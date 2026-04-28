import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Remove ```json ... ``` wrappers so JSON.parse sees raw object. */
function stripMarkdownJsonFence(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }
  return t;
}

/**
 * Extract first top-level `{ ... }` using brace depth while respecting strings,
 * so values containing `}` don't break parsing (first `{` … last `}` does).
 */
function sliceFirstJsonObject(s: string): string | null {
  const trimmed = stripMarkdownJsonFence(s);
  const start = trimmed.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return null;
}

function extractJsonObject(s: string): unknown {
  const cleaned = stripMarkdownJsonFence(s);
  try {
    return JSON.parse(cleaned);
  } catch {
    // ignore
  }
  const sliced = sliceFirstJsonObject(s);
  if (sliced) {
    try {
      return JSON.parse(sliced);
    } catch (e) {
      const hint =
        e instanceof Error && /Unexpected end|position|Expected/i.test(e.message)
          ? " Output may have been truncated — retry or use a shorter journal/hint."
          : "";
      throw new Error(`${e instanceof Error ? e.message : "Invalid JSON"}${hint}`);
    }
  }
  throw new Error("No JSON object in model output");
}

function normalizeBaseUrl(raw: string): string {
  const t = raw.trim().replace(/\/+$/, "");
  return t.endsWith("/v1") ? t : `${t}/v1`;
}

/** Short provider error for clients; never echo the API key. */
function summarizeMoonshotError(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: { message?: string; type?: string } };
    const msg = j?.error?.message || j?.error?.type;
    const typ = j?.error?.type;
    if (typeof msg === "string" && msg.trim()) {
      let s = `Kimi API: ${msg.trim()}`;
      if (typ === "invalid_authentication_error") {
        s +=
          " — 请到 platform.moonshot.cn 或 platform.moonshot.ai（与账号一致）新建 API Key，Supabase Secret：MOONSHOT_API_KEY；若控制台 API 地址是 .cn，请再设 MOONSHOT_BASE_URL=https://api.moonshot.cn/v1";
      }
      return s;
    }
  } catch {
    // ignore
  }
  const snippet = body.replace(/\s+/g, " ").slice(0, 180);
  return snippet ? `Kimi API error (HTTP ${status}): ${snippet}` : `Kimi API error (HTTP ${status})`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { photo, hint, locale, languageInstruction } = body;
    if (!photo || typeof photo !== "string") {
      return json({ error: "photo (data URL) is required" }, 400);
    }

    const loc = typeof locale === "string" && locale.trim() ? locale.trim() : "en-US";
    const langLine =
      typeof languageInstruction === "string" && languageInstruction.trim()
        ? languageInstruction.trim()
        : "English (United States)";

    const MOONSHOT_API_KEY = Deno.env.get("MOONSHOT_API_KEY")?.trim();
    if (!MOONSHOT_API_KEY) throw new Error("MOONSHOT_API_KEY not configured");
    const moonshotBase = normalizeBaseUrl(Deno.env.get("MOONSHOT_BASE_URL") ?? "https://api.moonshot.ai/v1");
    const moonshotModel = (
      Deno.env.get("MOONSHOT_MODEL") ?? "moonshot-v1-8k-vision-preview"
    ).trim();

    const blueprintUiProps = {
      introHowTo: {
        type: "string",
        description: "1–2 sentences how to play; show target & obstacle emoji characters",
      },
      play: { type: "string", description: "Primary CTA e.g. Start / Play" },
      timeUp: { type: "string", description: "When round ends e.g. Time's up!" },
      score: { type: "string", description: "Score label" },
      misses: { type: "string", description: "Misses label" },
      replay: { type: "string", description: "Replay button" },
      newPhoto: { type: "string", description: "New photo button" },
      newGame: { type: "string", description: "Back / new game" },
      generatedBadge: { type: "string", description: "Small pill e.g. AI Generated" },
    };

    const blueprintSchema = {
      type: "object",
      description:
        "Constrained game design (Blueprint v1). No code — only data the app compiles into a playable mini-game.",
      properties: {
        schemaVersion: { type: "number", enum: [1] },
        engine: {
          type: "string",
          enum: [
            "tapfall",
            "lane_runner",
            "memory_pairs",
            "photo_reaction",
            "rhythm_tap",
            "color_sort",
          ],
          description:
            "tapfall=floating taps; lane_runner=3-lane dodge/collect; memory_pairs=flip pairs; photo_reaction=tap pops on photo; rhythm_tap=faster tap rhythm on photo; color_sort=fallback tapfall styling",
        },
        meta: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short playful title in target language" },
            tagline: { type: "string", description: "Hook in target language" },
            durationSec: { type: "number", description: "Round length 15–60" },
          },
          required: ["title", "tagline", "durationSec"],
          additionalProperties: false,
        },
        locale: { type: "string", description: "Optional BCP-47 hint e.g. ja-JP" },
        visuals: {
          type: "object",
          properties: {
            backgroundCss: { type: "string", description: "CSS linear-gradient(...) matching scene mood" },
            targetEmoji: { type: "string", description: "Single emoji — good tap / collect" },
            obstacleEmoji: { type: "string", description: "Single emoji — avoid / bad tap" },
            mechanic: { type: "string", enum: ["catch", "dodge"], description: "catch=collect good; dodge=avoid bad" },
          },
          required: ["backgroundCss", "targetEmoji", "obstacleEmoji"],
          additionalProperties: false,
        },
        tuning: {
          type: "object",
          description: "Optional difficulty knobs",
          properties: {
            lives: { type: "number", description: "1–9" },
            spawnEveryMs: { type: "number", description: "Spawn interval for tapfall / photo minigames" },
            fallSpeed: { type: "number", description: "Scroll speed hint for runner/tapfall" },
            memoryPairs: { type: "number", description: "4–10 pairs for memory_pairs" },
            runnerLanes: { type: "number", enum: [3, 5] },
            reactionWindowMs: { type: "number", description: "How long a photo tap target stays" },
            lifeLossOnMiss: { type: "number", description: "Lives lost on missed good tap (photo)" },
            runnerSpawnMs: { type: "number", description: "Spawn interval for lane_runner" },
          },
          additionalProperties: false,
        },
        ui: {
          type: "object",
          description: "All UI strings in the target language",
          properties: blueprintUiProps,
          required: [
            "introHowTo",
            "play",
            "timeUp",
            "score",
            "misses",
            "replay",
            "newPhoto",
            "newGame",
            "generatedBadge",
          ],
          additionalProperties: false,
        },
      },
      required: ["schemaVersion", "engine", "meta", "visuals", "ui"],
      additionalProperties: false,
    };

    const systemPrompt = `You are a playful game designer. Look at a travel photo and invent a SIMPLE one-screen mini-game inspired by what you see.

IMPORTANT — Language (locale ${loc}, ${langLine}):
All user-visible text inside blueprint.ui and blueprint.meta MUST be written ONLY in ${langLine}. Emoji in visuals stay as emoji characters.

Return ONLY a single JSON object, with this exact shape:
{
  "blueprint": ${JSON.stringify(blueprintSchema)}
}

You MUST produce a complete Blueprint v1 object:
- Pick ONE engine that fits the vibe (tapfall / lane_runner / memory_pairs / photo_reaction / rhythm_tap / color_sort).
- Choose targetEmoji & obstacleEmoji evocative of the scene (Kyoto rain → ☂️ vs ⚡).
- visuals.backgroundCss: a CSS linear-gradient(...) string matching mood & colors.
- meta.durationSec between 20 and 45.
- tuning is optional but helps difficulty.

The runtime compiles your blueprint — you never output code, only structured JSON.`;

    const userHint = typeof hint === "string" && hint.trim()
      ? `\n\nUser note about the trip: ${hint.trim().slice(0, 300)}`
      : "";

    const response = await fetch(`${moonshotBase}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MOONSHOT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Vision model so we can pass the travel photo (override with MOONSHOT_MODEL).
        model: moonshotModel,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Design a mini-game from this travel photo.${userHint}` },
              { type: "image_url", image_url: { url: photo } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        // In JSON mode, instruct the exact shape in the prompt.
        temperature: 0.5,
        // Blueprint JSON is large (all ui strings); 1200 tokens truncates mid-JSON → parse errors.
        max_completion_tokens: Number(Deno.env.get("MOONSHOT_MAX_COMPLETION_TOKENS") ?? "8192"),
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("moonshot error", response.status, t);
      return json({ error: summarizeMoonshotError(response.status, t) }, 500);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJsonObject(content) : content;
    const blueprint = (parsed as any)?.blueprint ?? parsed;
    if (!blueprint || typeof blueprint !== "object") throw new Error("Missing blueprint");

    return json({ blueprint, locale: loc });
  } catch (e) {
    console.error("generate-game error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
