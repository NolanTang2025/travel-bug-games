import { corsHeaders } from "../_shared/cors.ts";
import { fetchSocialPreview } from "../_shared/socialPreview.ts";
import { runGenerateGame } from "../_shared/generateGame.ts";
import { pickTemplateFromHint } from "../_shared/pickTemplateHint.ts";

/** @deprecated 使用 social-to-game；保留兼容 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !url.trim()) {
      return new Response(JSON.stringify({ error: "请提供帖子链接" }), {
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
      instagramUrl: preview.platform === "instagram" ? preview.normalizedUrl : undefined,
      hint,
      photo: preview.photoDataUrl,
      photos: [preview.photoDataUrl],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("instagram-to-game:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "生成失败" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
