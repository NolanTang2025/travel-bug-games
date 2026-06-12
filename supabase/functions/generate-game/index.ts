import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { runGenerateGame } from "../_shared/generateGame.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const photos: string[] = Array.isArray(body.photos)
      ? body.photos.filter((p: unknown) => typeof p === "string").slice(0, 8)
      : typeof body.photo === "string" ? [body.photo] : [];

    const hint = typeof body.hint === "string" ? body.hint.trim().slice(0, 1200) : "";
    const suggested = typeof body.suggestedTemplateId === "string" ? body.suggestedTemplateId : "";
    const variationSeed = typeof body.variationSeed === "number" ? body.variationSeed : undefined;
    const temperature = typeof body.temperature === "number" ? body.temperature : undefined;
    const photoIndex = typeof body.photoIndex === "number" ? body.photoIndex : undefined;
    const forcePickTemplate = body.forcePickTemplate === true;
    const remix = body.remix === true;
    const forceVision = body.forceVision === true;

    const result = await runGenerateGame({
      photos,
      hint,
      suggestedTemplateId: suggested,
      variationSeed,
      temperature,
      photoIndex,
      forcePickTemplate,
      remix,
      forceVision,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-game:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
