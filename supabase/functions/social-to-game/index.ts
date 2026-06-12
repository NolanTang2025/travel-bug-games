import { corsHeaders } from "../_shared/cors.ts";
import { runGenerateGame } from "../_shared/generateGame.ts";
import { pickTemplateFromHint } from "../_shared/pickTemplateHint.ts";
import { fetchSocialPreview } from "../_shared/socialPreview.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !url.trim()) {
      return new Response(JSON.stringify({ error: "请提供 Instagram 或小红书帖子链接" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preview = await fetchSocialPreview(url);
    const hint = preview.caption.slice(0, 300);
    const game = await runGenerateGame({
      photos: [preview.photoDataUrl],
      hint,
      suggestedTemplateId: pickTemplateFromHint(hint),
      forceVision: true,
    });

    return new Response(JSON.stringify({
      ...game,
      source: preview.platform,
      socialUrl: preview.normalizedUrl,
      hint,
      photo: preview.photoDataUrl,
      photos: [preview.photoDataUrl],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-to-game:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "生成失败" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
