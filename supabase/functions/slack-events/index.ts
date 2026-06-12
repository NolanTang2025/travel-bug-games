import { corsHeaders } from "../_shared/cors.ts";
import { generateSlackDraft } from "../_shared/slack.ts";
import { serviceClient } from "../_shared/supabase.ts";

async function verifySlackSignature(body: string, timestamp: string, signature: string): Promise<boolean> {
  const secret = Deno.env.get("SLACK_SIGNING_SECRET");
  if (!secret) return false;
  const base = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return signature === `v0=${hex}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rawBody = await req.text();
  const payload = JSON.parse(rawBody);

  if (payload.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ts = req.headers.get("x-slack-request-timestamp") ?? "";
  const sig = req.headers.get("x-slack-signature") ?? "";
  if (!(await verifySlackSignature(rawBody, ts, sig))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = payload.event;
  if (!event || event.subtype === "bot_message" || event.bot_id) {
    return new Response("ok", { status: 200 });
  }

  const teamId = payload.team_id as string;
  const slackUserId = event.user as string | undefined;
  if (!slackUserId) return new Response("ok", { status: 200 });

  const admin = serviceClient();
  const { data: conn } = await admin
    .from("slack_connections")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("slack_user_id", slackUserId)
    .maybeSingle();

  if (!conn) return new Response("ok", { status: 200 });

  const isMention = event.type === "app_mention";
  const isDm = event.channel_type === "im" && event.type === "message";
  if (!isMention && !isDm) return new Response("ok", { status: 200 });

  let triggerText = (event.text as string) ?? "";
  if (isMention) {
    triggerText = triggerText.replace(/<@[A-Z0-9]+>/g, "").trim();
  }
  if (!triggerText) return new Response("ok", { status: 200 });

  const { data: persona } = await admin
    .from("twin_personas")
    .select("id, system_prompt")
    .eq("user_id", conn.user_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!persona) return new Response("ok", { status: 200 });

  try {
    const draftText = await generateSlackDraft({
      systemPrompt: persona.system_prompt,
      triggerText,
    });

    await admin.from("slack_drafts").insert({
      user_id: conn.user_id,
      persona_id: persona.id,
      team_id: teamId,
      channel_id: event.channel,
      thread_ts: event.thread_ts ?? event.ts,
      trigger_text: triggerText.slice(0, 4000),
      draft_text: draftText,
      status: "pending",
    });

    const { data: connFull } = await admin
      .from("slack_connections")
      .select("bot_access_token")
      .eq("user_id", conn.user_id)
      .eq("team_id", teamId)
      .maybeSingle();

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://mnemo.games";
    const botToken = connFull?.bot_access_token as string | undefined;
    if (botToken) {
      const threadTs = (event.thread_ts ?? event.ts) as string;
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: event.channel,
          thread_ts: threadTs,
          text: `✍️ *Mnemo* 已根据你的分身起草回复。请到 <${siteUrl}/twin|Mnemo Twin> 确认后再发送（不会自动发帖）。`,
        }),
      }).catch((err) => console.error("bot notify:", err));
    }
  } catch (e) {
    console.error("slack-events draft:", e);
  }

  return new Response("ok", { status: 200 });
});
