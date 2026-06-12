import { corsHeaders } from "../_shared/cors.ts";
import { generateSlackDraft } from "../_shared/slack.ts";
import { serviceClient } from "../_shared/supabase.ts";

/** Internal: create draft row (called from slack-events or manual) */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("SLACK_INTERNAL_SECRET");
    const internal = req.headers.get("x-slack-internal");
    if (!secret || internal !== secret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { userId, teamId, channelId, threadTs, triggerText, slackUserId } = body;

    const admin = serviceClient();
    const { data: persona } = await admin
      .from("twin_personas")
      .select("id, system_prompt")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!persona) {
      return new Response(JSON.stringify({ error: "No active persona" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draftText = await generateSlackDraft({
      systemPrompt: persona.system_prompt,
      triggerText: triggerText ?? "",
    });

    const { data: draft, error } = await admin
      .from("slack_drafts")
      .insert({
        user_id: userId,
        persona_id: persona.id,
        team_id: teamId,
        channel_id: channelId,
        thread_ts: threadTs ?? null,
        trigger_text: (triggerText ?? "").slice(0, 4000),
        draft_text: draftText,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ draftId: draft.id, draftText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("slack-draft-reply:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
