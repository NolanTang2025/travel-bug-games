import { corsHeaders } from "../_shared/cors.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { callToolCompletion } from "../_shared/llm.ts";
import { bytesToDataUrl } from "../_shared/socialTypes.ts";

type ArchiveSummary = {
  title: string;
  places: string[];
  timeline: { date: string; note: string }[];
  mood: string[];
  topics: string[];
  voice_notes: string;
  one_line_persona: string;
};

function normalizeIgUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (!u.hostname.includes("instagram.com")) return null;
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { user } = auth;

    const { url } = await req.json();
    const normalizedUrl = normalizeIgUrl(url);
    if (!normalizedUrl) {
      return new Response(JSON.stringify({ error: "无效的 Instagram 链接" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oembedRes = await fetch(
      `https://api.instagram.com/oembed?url=${encodeURIComponent(normalizedUrl)}`,
      { headers: { "User-Agent": "MnemoTravelArchive/1.0" } },
    );

    if (!oembedRes.ok) {
      return new Response(JSON.stringify({
        error: "无法读取该帖子（可能私密或需登录）。请改用 AI Create 上传截图。",
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = await oembedRes.json();
    const thumbnailUrl = meta.thumbnail_url as string | undefined;
    if (!thumbnailUrl) {
      return new Response(JSON.stringify({ error: "帖子没有可用的预览图" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const journalText = [
      meta.title ? `Instagram: ${meta.title}` : "Instagram 帖子",
      meta.author_name ? `作者: ${meta.author_name}` : "",
      `来源: ${normalizedUrl}`,
    ].filter(Boolean).join("\n");

    const admin = serviceClient();

    const { data: archive, error: archErr } = await admin
      .from("user_archives")
      .insert({ user_id: user.id, journal_text: journalText, status: "draft" })
      .select("id")
      .single();

    if (archErr || !archive) throw archErr ?? new Error("创建档案失败");

    const imgRes = await fetch(thumbnailUrl);
    if (!imgRes.ok) throw new Error("下载预览图失败");
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    const path = `${user.id}/${archive.id}/instagram-${crypto.randomUUID()}.jpg`;

    const { error: upErr } = await admin.storage
      .from("archive-media")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (upErr) throw upErr;

    await admin.from("archive_media").insert({
      archive_id: archive.id,
      user_id: user.id,
      storage_path: path,
      sort_order: 0,
      caption: meta.title ?? null,
    });

    const imageUrls = [{ type: "image_url", image_url: { url: bytesToDataUrl(bytes, "image/jpeg") } }];

    const summary = await callToolCompletion<ArchiveSummary>(
      `Build a travel archive from an Instagram post preview and caption. Do not invent facts beyond what is given.`,
      [
        { type: "text", text: `Caption/metadata:\n${journalText}` },
        ...imageUrls,
      ],
      "create_archive",
      "Create structured travel archive from Instagram",
      {
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
      },
      { vision: !!imageUrls.length },
    );

    await admin
      .from("user_archives")
      .update({
        title: summary.title,
        summary_json: summary,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", archive.id);

    await admin.from("twin_personas").update({ is_active: false }).eq("user_id", user.id);

    const twin = await callToolCompletion<{
      display_name: string;
      bio_short: string;
      system_prompt: string;
      traits_json: Record<string, unknown>;
    }>(
      `Create a digital twin persona for Slack drafts. First person, short replies, no fabricated trips.`,
      JSON.stringify({ title: summary.title, journal: journalText, summary }),
      "create_twin",
      "Create twin from archive",
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

    await admin.from("twin_personas").insert({
      user_id: user.id,
      archive_id: archive.id,
      display_name: twin.display_name,
      bio_short: twin.bio_short,
      system_prompt: twin.system_prompt,
      traits_json: twin.traits_json,
      is_active: true,
    });

    return new Response(JSON.stringify({
      archiveId: archive.id,
      normalizedUrl,
      title: summary.title,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-instagram:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "导入失败" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
