import { corsHeaders } from "../_shared/cors.ts";
import { callLovableTool } from "../_shared/ai.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

type TwinOutput = {
  display_name: string;
  bio_short: string;
  system_prompt: string;
  traits_json: {
    tone: string;
    languages: string[];
    interests: string[];
    sample_phrases: string[];
    avoid: string[];
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    const { archiveId } = await req.json();
    if (!archiveId) {
      return new Response(JSON.stringify({ error: "archiveId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = serviceClient();
    const { data: archive, error } = await admin
      .from("user_archives")
      .select("id, user_id, title, journal_text, summary_json, status")
      .eq("id", archiveId)
      .eq("user_id", user.id)
      .single();

    if (error || !archive || archive.status !== "ready") {
      return new Response(JSON.stringify({ error: "Archive not ready" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twinRaw = await callLovableTool<TwinOutput>(
      `You create a digital twin persona for Slack draft replies. The twin speaks AS the traveler in first person. Never fabricate trips or facts not in the archive. Replies should be short (1-4 sentences), warm, authentic. system_prompt must instruct the model how to draft Slack messages.`,
      JSON.stringify({
        title: archive.title,
        journal: archive.journal_text,
        summary: archive.summary_json,
      }),
      "create_twin",
      "Create digital twin persona from travel archive",
      {
        type: "object",
        properties: {
          display_name: { type: "string" },
          bio_short: { type: "string" },
          system_prompt: { type: "string" },
          traits_json: {
            type: "object",
            properties: {
              tone: { type: "string" },
              languages: { type: "array", items: { type: "string" } },
              interests: { type: "array", items: { type: "string" } },
              sample_phrases: { type: "array", items: { type: "string" } },
              avoid: { type: "array", items: { type: "string" } },
            },
            required: ["tone", "languages", "interests", "sample_phrases", "avoid"],
          },
        },
        required: ["display_name", "bio_short", "system_prompt", "traits_json"],
        additionalProperties: false,
      },
    );

    const twin = {
      display_name: String(twinRaw.display_name ?? "Your twin").slice(0, 80),
      bio_short: String(twinRaw.bio_short ?? "").slice(0, 280),
      system_prompt: String(twinRaw.system_prompt ?? "Draft short Slack replies in the traveler's voice."),
      traits_json: {
        tone: String(twinRaw.traits_json?.tone ?? "warm"),
        languages: Array.isArray(twinRaw.traits_json?.languages)
          ? twinRaw.traits_json.languages.map(String).slice(0, 8)
          : ["English"],
        interests: Array.isArray(twinRaw.traits_json?.interests)
          ? twinRaw.traits_json.interests.map(String).slice(0, 12)
          : [],
        sample_phrases: Array.isArray(twinRaw.traits_json?.sample_phrases)
          ? twinRaw.traits_json.sample_phrases.map(String).slice(0, 8)
          : [],
        avoid: Array.isArray(twinRaw.traits_json?.avoid)
          ? twinRaw.traits_json.avoid.map(String).slice(0, 8)
          : [],
      },
    };

    await admin.from("twin_personas").update({ is_active: false }).eq("user_id", user.id);

    const { data: persona, error: insErr } = await admin
      .from("twin_personas")
      .insert({
        user_id: user.id,
        archive_id: archiveId,
        display_name: twin.display_name,
        bio_short: twin.bio_short || null,
        system_prompt: twin.system_prompt,
        traits_json: twin.traits_json,
        is_active: true,
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ personaId: persona.id, twin }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-twin:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
