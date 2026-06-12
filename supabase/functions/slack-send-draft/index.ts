import { corsHeaders } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    const { draftId, draftText, action } = await req.json();

    if (!draftId) {
      return new Response(JSON.stringify({ error: "draftId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = serviceClient();
    const { data: draft, error } = await admin
      .from("slack_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single();

    if (error || !draft) {
      return new Response(JSON.stringify({ error: "Draft not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "dismiss") {
      await admin.from("slack_drafts").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("id", draftId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const text = (typeof draftText === "string" && draftText.trim()) ? draftText.trim() : draft.draft_text;
    if (!text) {
      return new Response(JSON.stringify({ error: "Empty draft" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: conn } = await admin
      .from("slack_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("team_id", draft.team_id)
      .maybeSingle();

    if (!conn?.access_token) {
      return new Response(JSON.stringify({ error: "Slack not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postBody: Record<string, string> = {
      channel: draft.channel_id,
      text,
    };
    if (draft.thread_ts) {
      postBody.thread_ts = draft.thread_ts;
    }

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postBody),
    });
    const slackData = await slackRes.json();
    if (!slackData.ok) {
      console.error("chat.postMessage", slackData);
      return new Response(JSON.stringify({ error: slackData.error ?? "Slack post failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("slack_drafts")
      .update({
        draft_text: text,
        status: "sent",
        slack_message_ts: slackData.ts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    return new Response(JSON.stringify({ ok: true, ts: slackData.ts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("slack-send-draft:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
