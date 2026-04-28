import type { GameSpec } from "@/gamekit/gameSpec";
import { mergeGameUi, FALLBACK_SPEC } from "@/gamekit/gameSpec";
import {
  compileBlueprintToGameSpec,
  safeParseBlueprint,
  fallbackSpecFromPhoto,
} from "@/gamekit/blueprint";

type LegacySession = {
  title?: string;
  tagline?: string;
  mechanic?: string;
  targetEmoji?: string;
  obstacleEmoji?: string;
  background?: string;
  duration?: number;
  locale?: string;
  ui?: Partial<GameSpec["ui"]>;
  journalTextLocale?: GameSpec["journalTextLocale"];
  templateId?: GameSpec["templateId"];
  params?: GameSpec["params"];
  photo?: string;
  photos?: string[];
  schemaVersion?: number;
  blueprint?: unknown;
};

/**
 * Build {@link GameSpec} from `sessionStorage` JSON (blueprint v1 or legacy flat AI payload).
 */
export function loadGameSpecFromSessionParsed(parsed: LegacySession): GameSpec | null {
  const photo = typeof parsed.photo === "string" ? parsed.photo : "";
  const photos = Array.isArray(parsed.photos) ? parsed.photos : undefined;
  const journalTextLocale = parsed.journalTextLocale;
  const topLocale = typeof parsed.locale === "string" ? parsed.locale : undefined;

  if (parsed.schemaVersion === 2 && parsed.blueprint != null) {
    const bp = safeParseBlueprint(parsed.blueprint);
    if (bp) {
      return compileBlueprintToGameSpec(bp, { photo, photos, journalTextLocale, locale: topLocale });
    }
    return fallbackSpecFromPhoto({ photo, photos, journalTextLocale, locale: topLocale });
  }

  const mechanic = parsed.mechanic === "dodge" ? "dodge" : "catch";
  const targetEmoji = parsed.targetEmoji || FALLBACK_SPEC.targetEmoji;
  const obstacleEmoji = parsed.obstacleEmoji || FALLBACK_SPEC.obstacleEmoji;

  const tid = parsed.templateId;
  const templateId: GameSpec["templateId"] =
    tid === "runner" || tid === "photoTap" || tid === "memory" || tid === "falling" ? tid : "falling";

  const s: GameSpec = {
    title: parsed.title || FALLBACK_SPEC.title,
    tagline: parsed.tagline || FALLBACK_SPEC.tagline,
    mechanic,
    targetEmoji,
    obstacleEmoji,
    background: parsed.background || FALLBACK_SPEC.background,
    photo,
    photos,
    duration: Math.min(90, Math.max(10, Number(parsed.duration) || 30)),
    locale: topLocale ?? FALLBACK_SPEC.locale,
    ui: mergeGameUi(parsed, { mechanic, targetEmoji, obstacleEmoji }),
    journalTextLocale,
    templateId,
    params: parsed.params,
  };
  return s;
}

export function loadGameSpecFromSessionString(raw: string): GameSpec | null {
  try {
    const parsed = JSON.parse(raw) as LegacySession;
    return loadGameSpecFromSessionParsed(parsed);
  } catch {
    return null;
  }
}
