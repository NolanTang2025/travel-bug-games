import { z } from "zod";
import {
  type GameSpec,
  type GameTemplateId,
  FALLBACK_SPEC,
  mergeGameUi,
} from "@/gamekit/gameSpec";

/** Extensible engine ids — unknown values compile to tapfall until implemented */
export const blueprintEngineEnum = z.enum([
  "tapfall",
  "lane_runner",
  "memory_pairs",
  "photo_reaction",
  "rhythm_tap",
  "color_sort",
]);

export type BlueprintEngine = z.infer<typeof blueprintEngineEnum>;

const gameUiPartial = z
  .object({
    introHowTo: z.string().optional(),
    play: z.string().optional(),
    timeUp: z.string().optional(),
    score: z.string().optional(),
    misses: z.string().optional(),
    replay: z.string().optional(),
    newPhoto: z.string().optional(),
    newGame: z.string().optional(),
    generatedBadge: z.string().optional(),
  })
  .strict();

export const gameBlueprintV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    engine: blueprintEngineEnum,
    meta: z.object({
      title: z.string().max(120),
      tagline: z.string().max(200),
      durationSec: z.number().min(10).max(90),
    }),
    /** Optional display locale hint (e.g. ja-JP) for `lang` / RTL */
    locale: z.string().optional(),
    visuals: z.object({
      backgroundCss: z.string(),
      targetEmoji: z.string().min(1).max(16),
      obstacleEmoji: z.string().min(1).max(16),
      mechanic: z.enum(["catch", "dodge"]).optional(),
    }),
    tuning: z
      .object({
        lives: z.number().min(1).max(9).optional(),
        spawnEveryMs: z.number().min(200).max(5000).optional(),
        runnerSpawnMs: z.number().min(300).max(2000).optional(),
        fallSpeed: z.number().optional(),
        memoryPairs: z.number().min(4).max(10).optional(),
        runnerLanes: z.union([z.literal(3), z.literal(5)]).optional(),
        reactionWindowMs: z.number().min(400).max(3000).optional(),
        lifeLossOnMiss: z.number().min(0).max(3).optional(),
      })
      .optional(),
    ui: gameUiPartial,
  })
  .strict();

export type GameBlueprintV1 = z.infer<typeof gameBlueprintV1Schema>;

const ENGINE_TO_TEMPLATE: Record<BlueprintEngine, GameTemplateId> = {
  tapfall: "falling",
  lane_runner: "runner",
  memory_pairs: "memory",
  photo_reaction: "photoTap",
  rhythm_tap: "photoTap",
  color_sort: "falling",
};

export function compileBlueprintToGameSpec(
  bp: GameBlueprintV1,
  ctx: {
    photo: string;
    photos?: string[];
    journalTextLocale?: GameSpec["journalTextLocale"];
    locale?: string;
  },
): GameSpec {
  const mechanic = bp.visuals.mechanic ?? "catch";
  const mergedUi = mergeGameUi(
    { ui: bp.ui },
    {
      mechanic,
      targetEmoji: bp.visuals.targetEmoji,
      obstacleEmoji: bp.visuals.obstacleEmoji,
    },
  );

  const templateId: GameTemplateId = ENGINE_TO_TEMPLATE[bp.engine] ?? "falling";

  const params: GameSpec["params"] = {};
  const t = bp.tuning ?? {};
  if (templateId === "memory") {
    params.memory = { pairs: t.memoryPairs ?? 8 };
  }
  if (templateId === "photoTap") {
    params.photoTap = {
      spawnEveryMs: t.spawnEveryMs ?? 850,
      lifeLossOnMiss: t.lifeLossOnMiss ?? 1,
      reactionWindowMs: t.reactionWindowMs ?? 1400,
    };
  }
  if (templateId === "runner") {
    params.runner = {
      lanes: t.runnerLanes ?? 3,
      scrollSpeed: t.fallSpeed,
      spawnEveryMs: t.runnerSpawnMs ?? t.spawnEveryMs,
    };
  }

  return {
    title: bp.meta.title,
    tagline: bp.meta.tagline,
    mechanic,
    targetEmoji: bp.visuals.targetEmoji,
    obstacleEmoji: bp.visuals.obstacleEmoji,
    background: bp.visuals.backgroundCss,
    photo: ctx.photo,
    photos: ctx.photos,
    duration: Math.round(bp.meta.durationSec),
    locale: ctx.locale ?? bp.locale,
    ui: mergedUi,
    journalTextLocale: ctx.journalTextLocale,
    templateId,
    params: Object.keys(params).length ? params : undefined,
  };
}

export function safeParseBlueprint(raw: unknown): GameBlueprintV1 | null {
  const r = gameBlueprintV1Schema.safeParse(raw);
  return r.success ? r.data : null;
}

/** When blueprint is invalid, produce a playable tapfall spec from fallback + photo context */
export function fallbackSpecFromPhoto(ctx: {
  photo: string;
  photos?: string[];
  journalTextLocale?: GameSpec["journalTextLocale"];
  locale?: string;
}): GameSpec {
  return {
    ...FALLBACK_SPEC,
    photo: ctx.photo,
    photos: ctx.photos,
    journalTextLocale: ctx.journalTextLocale,
    locale: ctx.locale ?? FALLBACK_SPEC.locale,
    templateId: "falling",
  };
}
