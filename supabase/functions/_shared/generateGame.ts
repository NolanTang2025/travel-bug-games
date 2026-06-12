import { callToolCompletion } from "./llm.ts";
import { languageVoiceOverride, sanitizeGamePayload } from "./textNormalize.ts";
import { assetSlotsForEngine, isTextEngine } from "./engineAssetSlots.ts";
import {
  runGenerateGameAssets,
  spriteUrlsFromAssets,
  type GameAssetDraft,
} from "./generateGameAssets.ts";
import { pickTemplateFromHint } from "./pickTemplateHint.ts";
import { engineForTemplate } from "./templateEngines.ts";
import { pickTemplateWithVariation, TEMPLATE_IDS } from "./templateRank.ts";

export { TEMPLATE_IDS };

const TEXT_TEMPLATES = new Set([
  "diary_quiz", "landmark_quiz", "food_quiz", "caption_fill", "diary_fill", "mood_fill",
  "itinerary_order", "taste_order", "journey_choice", "detour_choice", "hostel_choice", "market_bargain",
]);

const TEXT_ROUNDS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      prompt: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      correctIndex: { type: "number" },
      tiles: { type: "array", items: { type: "string" } },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
};

function fallbackTemplateId(hint: string): string {
  if (hint.includes("日记") || hint.includes("回忆")) return "diary_quiz";
  if (hint.includes("竹")) return "bamboo_path";
  if (hint.includes("海") || hint.includes("滩")) return "beach_swipe";
  if (hint.includes("寺") || hint.includes("神社")) return "temple_rhythm";
  if (hint.includes("雪")) return "snow_shield";
  if (hint.includes("地铁") || hint.includes("轨")) return "metro_lane";
  if (hint.includes("选") || hint.includes("如果")) return "journey_choice";
  return pickTemplateFromHint(hint);
}

const JOURNEY_BEAT_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    moment: { type: "string" },
    twist: { type: "string" },
    villain: { type: "string" },
    treasure: { type: "string" },
    safeLabel: { type: "string" },
    dangerLabel: { type: "string" },
    runEpithet: { type: "string" },
    mnemoQuip: { type: "string" },
    shareCaption: { type: "string" },
  },
  required: [
    "headline", "moment", "twist", "villain", "treasure",
    "safeLabel", "dangerLabel", "runEpithet", "mnemoQuip", "shareCaption",
  ],
  additionalProperties: false,
};

const MNEMO_VOICE = `Brand: Mnemo — riso-print "memory press". PRIMARY MARKET: North America (US/Canada).

You write scroll-stopping TikTok / Instagram Reels / Story copy — NOT tourism copy, NOT game manual prose.

{{LANGUAGE_RULE}}

VOICE CALIBRATION (Gen-Z / TK, deadpan-ironic, 2024–2026):
- Sounds like a friend venting in the comments — never corporate, never brochure
- Exaggerate ONE relatable micro-feeling from THEIR diary/photo (not a trip recap list)
- Specific > generic: "three seconds of shade" beats "nice scenery"
- Humor = self-own + absurd noun phrases ("mosquito caucus", "TSA of my patience", "heat index villain")

HOOK PATTERNS (rotate — don't reuse same opener every field):
"not me…" · "no because…" · "the way i…" · "i'm never recovering from…" · "be so for real…" · "it's giving…" · "this wasn't in the brochure" · "i fear that i…" · "delulu about…" · "rent free in my head"

GOOD (hot hike + bugs):
- title: "zen trail derailed"
- tagline: "not me getting a bug convention on a healing walk"
- moment: "the way i thought this was nature therapy and it was a mosquito summit"
- twist: "you wrote bugs everywhere — now they spawn like canon"
- villain: "mosquito caucus"
- treasure: "three seconds of shade"
- instruction: "catch the good vibes, dodge the bug lobby — your journal made it law"
- shareCaption: "turned my travel journal into a mini game\\nthis wasn't in the brochure\\n#Mnemo #TravelTok #CoreMemory"
- runEpithet: "delulu about being outdoors"
- mnemoQuip: "Mnemo: pressed your meltdown into playable content"
- safeLabel: "send it" · dangerLabel: "sit down"

GOOD (airport line meltdown):
- title: "gate changed again"
- tagline: "no because the line is literally eating my soul"
- moment: "not me romanticizing the airport until my flight got gate-checked into chaos"
- villain: "line goblin"
- treasure: "one boarding pass that scans"

BAD (instant fail — rewrite if you wrote these):
- title "Forest Catch" / "Beach Adventure" / "City Explorer"
- tagline "A beautiful day exploring nature"
- moment "I had a wonderful time on my trip"
- instruction "Move the basket to catch items"
- shareCaption with no hook and no hashtags`;

const JOURNEY_BEAT_RULES = `Reframe the trip into NA viral copy — remix runs need a NEW angle, not recycled hooks.

FIELD RULES:
- title: ironic meme headline ≤40 chars, lowercase OK — NEVER template name + noun (Forest Catch = FAIL)
- tagline: TikTok hook ≤80 chars — comment-section energy, must use a hook pattern above
- journeyBeat.headline: Story sticker / text-on-screen line, same vibe as title
- journeyBeat.moment: caption voice roasting the diary moment — NOT a literal quote, NOT "I enjoyed…"
- journeyBeat.twist: deadpan bridge to the mechanic ("you said X — the game made it law")
- journeyBeat.villain: meme noun phrase (line goblin / heat index villain / mosquito caucus)
- journeyBeat.treasure: hyper-specific want (iced coffee / 10 sec of AC / one photo that isn't blurry)
- journeyBeat.safeLabel / dangerLabel: 1–3 word UI labels in same voice (send it / nah / hold / sit) — NOT GO/STOP/WALK
- journeyBeat.runEpithet: roast title for end screen (certified line waiter / delulu tourist)
- journeyBeat.mnemoQuip: one line, starts with "Mnemo", dry punch
- journeyBeat.shareCaption: 2–4 short lines, paste-ready for TikTok/IG + #Mnemo #TravelTok + 1 trip-specific tag
- targetEmoji / obstacleEmoji: match villain/treasure, slightly unhinged OK
- instruction: ONE line, same voice — name the mechanic (catch/dodge/tap/hold/quiz) like a friend explaining, not a manual

textRounds (when required):
- 3 rounds exactly — TikTok poll / "pick your fighter" / fill-in-the-blank energy tied to journeyBeat.moment
- prompts: "be honest…", "which one were you…", "your trip was giving…"
- wrong options = plausible funny archetypes for THIS trip, not random words
- NEVER generic travel brochure questions`;

const ASSET_CREATIVE_RULES = `gameAssets — invent playable sprites from THIS trip (arcade templates only):
- One entry per required role listed in the template slot brief below.
- displayName: 2–5 word collectible name users will brag about ("shade goblin", "truffle witness") — never generic "target".
- imagePrompt: vivid art direction for AIGC sticker — colors, expression, props from the photo/journal; reference journeyBeat.treasure/villain; riso-game sprite not photorealistic portrait.
- referencePhotoIndex: 0-based index of uploaded photo that anchors the look, or null if none fit.
- needsUserPhoto: true when the perfect sprite NEEDS a shot the user hasn't uploaded yet (food close-up, face reaction, ticket stub, etc.).
- uploadTease: if needsUserPhoto OR you'd unlock a wilder sprite with another photo — one witty Gen-Z line telling them EXACTLY what to upload ("drop the truffle receipt — the game needs evidence"). Skip if photos already cover it.
- mood: one-word vibe (feral, tender, cursed, delulu, etc.)
- Be surprising — avoid default emoji ideas; pull from micro-details in the journal/photo.
- If only one photo exists, still invent distinct target vs obstacle personalities.`;

const GAME_ASSETS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      role: { type: "string", enum: ["target", "obstacle", "player", "prop"] },
      displayName: { type: "string" },
      imagePrompt: { type: "string" },
      referencePhotoIndex: { type: ["number", "null"] },
      needsUserPhoto: { type: "boolean" },
      uploadTease: { type: "string" },
      mood: { type: "string" },
    },
    required: ["role", "displayName", "imagePrompt", "needsUserPhoto"],
    additionalProperties: false,
  },
  minItems: 1,
  maxItems: 4,
};

function buildAssetSlotBrief(engine: string): string {
  const slots = assetSlotsForEngine(engine);
  if (!slots.length) return "";
  const lines = slots.map((s) => `  • role "${s.role}": ${s.hint}`).join("\n");
  return `\nRequired sprite roles for engine "${engine}":\n${lines}\n${ASSET_CREATIVE_RULES}`;
}

function buildVariationBlock(seed: number, remix: boolean, photoIndex: number): string {
  return `VARIATION RUN seed=${seed} photoIndex=${photoIndex}${remix ? " REMIX=true" : ""}.
- Fresh hook every run — different opener, different shareCaption, different runEpithet. No recycled lines.
- Use mood/places from hint but abstract the feeling into a roast, not a trip recap.
- Self-check before output: title/tagline/instruction must NOT sound like a brochure or template name.
- textRounds (if any): TikTok poll / "pick your fighter" — wrong answers = funny archetypes for THIS trip only.`;
}

function mnemoVoiceForHint(hint: string): string {
  return MNEMO_VOICE.replace("{{LANGUAGE_RULE}}", languageVoiceOverride(hint));
}

function buildCustomizePrompt(
  templateId: string,
  engine: string,
  isText: boolean,
  seed: number,
  remix: boolean,
  photoIndex: number,
  photoCount: number,
  hint: string,
): string {
  return `Customize travel mini-game for FIXED templateId: ${templateId}.
Do NOT change templateId.
${mnemoVoiceForHint(hint)}
${JOURNEY_BEAT_RULES}
${buildVariationBlock(seed, remix, photoIndex)}
- background: CSS linear-gradient(...) only.
- duration: ${isText ? 40 : 35}.
${isText
    ? `- textRounds: exactly 3 rounds — TikTok poll / fill-in prompts tied to journeyBeat.moment. Omit gameAssets.`
    : `- gameAssets: ${assetSlotsForEngine(engine).length} sprites — see slot brief.${buildAssetSlotBrief(engine)}\nUser uploaded ${photoCount} photo(s).`}
`;
}

function buildPickPrompt(
  seed: number,
  remix: boolean,
  photoIndex: number,
  photoCount: number,
  hint: string,
): string {
  return `Pick templateId from catalog matching diary/photo (竹林→bamboo_path, 虫/热/徒步→forest_catch, mood/quiz→diary_quiz, etc.).
${mnemoVoiceForHint(hint)}
${JOURNEY_BEAT_RULES}
${buildVariationBlock(seed, remix, photoIndex)}
- templateId: exact id from list.
- duration: 32-40.
- Text templates: textRounds 3 rounds tied to journeyBeat.moment — omit gameAssets.
- Arcade templates: include gameAssets per engine slot brief after you pick templateId.
- User uploaded ${photoCount} photo(s).
Seed: ${seed}.`;
}

export type GenerateGameInput = {
  photos: string[];
  hint?: string;
  suggestedTemplateId?: string;
  /** Instagram 一键玩：始终看图 */
  forceVision?: boolean;
  variationSeed?: number;
  temperature?: number;
  /** 换玩法：AI 自选模板，不走固定 customize */
  forcePickTemplate?: boolean;
  photoIndex?: number;
  remix?: boolean;
  runId?: string;
};

export async function runGenerateGame(input: GenerateGameInput): Promise<Record<string, unknown>> {
  const allPhotos = input.photos.filter((p) => typeof p === "string").slice(0, 8);
  if (!allPhotos.length) throw new Error("At least one photo required");

  const seed = input.variationSeed ?? Math.floor(Math.random() * 1_000_000_000);
  const photoIndex = input.photoIndex != null
    ? Math.abs(input.photoIndex) % allPhotos.length
    : Math.abs(seed) % allPhotos.length;
  const photo = allPhotos[photoIndex] ?? allPhotos[0];

  const hint = (input.hint ?? "").trim().slice(0, 1200);
  const remix = input.remix ?? false;
  const forcePick = input.forcePickTemplate ?? false;

  let templateId: string;
  if (forcePick) {
    templateId = pickTemplateWithVariation(hint, seed, { topN: 5, widenPool: true });
  } else {
    templateId = pickTemplateWithVariation(hint, seed, { topN: 3 });
  }

  if (!TEMPLATE_IDS.includes(templateId as typeof TEMPLATE_IDS[number])) {
    templateId = fallbackTemplateId(hint);
  }

  const isText = TEXT_TEMPLATES.has(templateId);
  const engine = engineForTemplate(templateId);
  const temperature = input.temperature ?? (remix ? 0.98 : forcePick ? 0.96 : 0.94);
  const runId = input.runId ?? crypto.randomUUID();

  const gameAssetsProperty = isText ? {} : { gameAssets: GAME_ASSETS_SCHEMA };
  const gameAssetsRequired = isText ? [] : ["gameAssets"];

  const customizeProperties = {
    type: "object",
    properties: {
      title: { type: "string" },
      tagline: { type: "string" },
      targetEmoji: { type: "string" },
      obstacleEmoji: { type: "string" },
      background: { type: "string" },
      duration: { type: "number" },
      instruction: { type: "string" },
      journeyBeat: JOURNEY_BEAT_SCHEMA,
      ...(isText ? { textRounds: TEXT_ROUNDS_SCHEMA } : gameAssetsProperty),
    },
    required: [
      "title",
      "tagline",
      "targetEmoji",
      "obstacleEmoji",
      "background",
      "duration",
      "instruction",
      "journeyBeat",
      ...gameAssetsRequired,
    ],
    additionalProperties: false,
  };

  const pickProperties = {
    type: "object",
    properties: {
      templateId: { type: "string", enum: [...TEMPLATE_IDS] },
      title: { type: "string" },
      tagline: { type: "string" },
      targetEmoji: { type: "string" },
      obstacleEmoji: { type: "string" },
      background: { type: "string" },
      duration: { type: "number" },
      instruction: { type: "string" },
      journeyBeat: JOURNEY_BEAT_SCHEMA,
      textRounds: TEXT_ROUNDS_SCHEMA,
      gameAssets: GAME_ASSETS_SCHEMA,
    },
    required: ["templateId", "title", "tagline", "targetEmoji", "obstacleEmoji", "background", "duration", "instruction", "journeyBeat"],
    additionalProperties: false,
  };

  const useCustomize = !forcePick;
  const useVision = input.forceVision || allPhotos.length > 0;
  const userContent: unknown[] = [
    {
      type: "text",
      text: `Diary / summary:\n${hint || "(see photo)"}\nTemplate: ${templateId}\nVariation seed: ${seed}\nPhoto ${photoIndex + 1} of ${allPhotos.length}`,
    },
  ];
  if (useVision) {
    userContent.push({ type: "image_url", image_url: { url: photo } });
  }

  const args = await callToolCompletion<Record<string, unknown>>(
    useCustomize
      ? buildCustomizePrompt(templateId, engine, isText, seed, remix, photoIndex, allPhotos.length, hint)
      : buildPickPrompt(seed, remix, photoIndex, allPhotos.length, hint),
    userContent,
    "pick_travel_game",
    useCustomize ? "Customize fixed travel game template" : "Pick travel game template",
    useCustomize ? customizeProperties : pickProperties,
    { vision: useVision, maxTokens: useCustomize ? 2200 : 2400, temperature },
  );

  const finalId = useCustomize
    ? templateId
    : TEMPLATE_IDS.includes(args.templateId as typeof TEMPLATE_IDS[number])
      ? (args.templateId as string)
      : fallbackTemplateId(hint);

  const finalEngine = engineForTemplate(finalId);
  const finalIsText = isTextEngine(finalEngine);

  let gameAssets: Awaited<ReturnType<typeof runGenerateGameAssets>> = [];
  if (!finalIsText && Array.isArray(args.gameAssets)) {
    const drafts = (args.gameAssets as Record<string, unknown>[])
      .map((raw): GameAssetDraft | null => {
        const role = String(raw.role ?? "");
        const displayName = String(raw.displayName ?? "").trim();
        const imagePrompt = String(raw.imagePrompt ?? "").trim();
        if (!role || !displayName || !imagePrompt) return null;
        const ref = raw.referencePhotoIndex;
        return {
          role,
          displayName,
          imagePrompt,
          referencePhotoIndex: typeof ref === "number" ? ref : ref === null ? null : undefined,
          needsUserPhoto: raw.needsUserPhoto === true,
          uploadTease: typeof raw.uploadTease === "string" ? raw.uploadTease.trim() : undefined,
          mood: typeof raw.mood === "string" ? raw.mood.trim() : undefined,
        };
      })
      .filter((d): d is GameAssetDraft => d != null)
      .slice(0, 4);

    if (drafts.length) {
      gameAssets = await runGenerateGameAssets(runId, drafts, allPhotos);
    }
  }

  const spriteUrls = spriteUrlsFromAssets(gameAssets);

  return sanitizeGamePayload({
    ...args,
    templateId: finalId,
    engine: finalEngine,
    gameAssets,
    ...spriteUrls,
    assetRunId: runId,
    _meta: {
      variationSeed: seed,
      photoIndex,
      templateId: finalId,
      engine: finalEngine,
      forcePick,
      assetsGenerated: gameAssets.filter((a) => a.status === "ready").length,
    },
  });
}
