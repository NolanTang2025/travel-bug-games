import { corsHeaders } from "../_shared/cors.ts";
import { callLovableTool } from "../_shared/ai.ts";
import { archiveMediaAsVisionContent } from "../_shared/archiveImages.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";

type ArchiveSummary = {
  title: string;
  places: string[];
  timeline: { date: string; note: string }[];
  mood: string[];
  topics: string[];
  voice_notes: string;
  one_line_persona: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let archiveIdForFallback: string | null = null;
  let journalForFallback = "";

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { user } = auth;
    const { archiveId } = await req.json();
    archiveIdForFallback = archiveId;
    if (!archiveId || typeof archiveId !== "string") {
      return new Response(JSON.stringify({ error: "archiveId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = serviceClient();
    const { data: archive, error: archErr } = await admin
      .from("user_archives")
      .select("id, user_id, journal_text")
      .eq("id", archiveId)
      .eq("user_id", user.id)
      .single();

    if (archErr || !archive) {
      return new Response(JSON.stringify({ error: "Archive not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: media } = await admin
      .from("archive_media")
      .select("storage_path, sort_order")
      .eq("archive_id", archiveId)
      .order("sort_order");

    const paths = (media ?? []).map((m) => m.storage_path as string);
    const imageUrls = await archiveMediaAsVisionContent(admin, paths);

    const journal = (archive.journal_text as string).trim().slice(0, 4000);
    journalForFallback = journal;

    if (!imageUrls.length && !journal) {
      return new Response(JSON.stringify({ error: "Add at least one photo or journal text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("user_archives").update({ status: "draft" }).eq("id", archiveId);

    const userContent: unknown[] = [
      {
        type: "text",
        text: `Diary:\n${journal || "(no text — infer lightly from photos only)"}`,
      },
      ...imageUrls,
    ];

    const archiveSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        places: { type: "array", items: { type: "string" } },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: { date: { type: "string" }, note: { type: "string" } },
            required: ["date", "note"],
          },
        },
        mood: { type: "array", items: { type: "string" } },
        topics: { type: "array", items: { type: "string" } },
        voice_notes: { type: "string" },
        one_line_persona: { type: "string" },
      },
      required: ["title", "places", "timeline", "mood", "topics", "voice_notes", "one_line_persona"],
      additionalProperties: false,
    };

    const system = `You build travel archives from photos and diary text. Extract only what is supported by the content — do not invent places or events. Output structured JSON for a digital twin persona.`;

    let summary: ArchiveSummary;
    try {
      summary = await callLovableTool<ArchiveSummary>(
        system,
        userContent,
        "create_archive",
        "Create structured travel archive summary",
        archiveSchema,
        { vision: imageUrls.length > 0 },
      );
    } catch (visionErr) {
      if (!imageUrls.length) throw visionErr;
      console.warn("generate-archive vision failed, retrying text-only:", visionErr);
      summary = await callLovableTool<ArchiveSummary>(
        system,
        `Diary:\n${journal || "(no text)"}`,
        "create_archive",
        "Create structured travel archive summary",
        archiveSchema,
        { vision: false },
      );
    }

    const { error: updateErr } = await admin
      .from("user_archives")
      .update({
        title: summary.title,
        summary_json: summary,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", archiveId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ archiveId, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-archive:", e);
    if (archiveIdForFallback) {
      try {
        const j = journalForFallback;
        const fallbackTitle = j.match(/(?:去了|来到)([^，。,\n]{2,24})/)?.[1]?.trim()
          ?? j.split(/[。.\n,，]/)[0]?.trim().slice(0, 36)
          ?? "Travel archive";
        await serviceClient().from("user_archives").update({
          title: fallbackTitle,
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", archiveIdForFallback);
      } catch { /* ignore */ }
    }

    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
