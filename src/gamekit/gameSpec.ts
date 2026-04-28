/**
 * Canonical mini-game runtime spec used by AI play templates.
 * AI outputs a constrained blueprint; {@link compileBlueprintToGameSpec} fills this shape.
 */

export type GameUi = {
  introHowTo: string;
  play: string;
  timeUp: string;
  score: string;
  misses: string;
  replay: string;
  newPhoto: string;
  newGame: string;
  generatedBadge: string;
};

export type GameTemplateId = "falling" | "runner" | "memory" | "photoTap";

export type GameSpec = {
  title: string;
  tagline: string;
  mechanic: "catch" | "dodge";
  targetEmoji: string;
  obstacleEmoji: string;
  background: string;
  photo: string;
  photos?: string[];
  duration: number;
  locale?: string;
  ui: GameUi;
  journalTextLocale?: "en" | "zh-CN" | "ja" | "ko" | "zh-TW";
  templateId?: GameTemplateId;
  params?: {
    photoTap?: { spawnEveryMs?: number; lifeLossOnMiss?: number; reactionWindowMs?: number };
    memory?: { pairs?: number };
    runner?: { lanes?: 3 | 5; scrollSpeed?: number; spawnEveryMs?: number };
  };
};

export function mergeGameUi(
  parsed: { ui?: Partial<GameUi> } | null,
  s: Pick<GameSpec, "mechanic" | "targetEmoji" | "obstacleEmoji">,
): GameUi {
  const u = parsed?.ui ?? {};
  const defaultIntro =
    s.mechanic === "catch"
      ? `Tap the ${s.targetEmoji} to score. Avoid the ${s.obstacleEmoji}.`
      : `Tap the ${s.obstacleEmoji} before it lands. Don't tap the ${s.targetEmoji}!`;
  const t = (v: unknown, fb: string) => (typeof v === "string" && v.trim() ? v.trim() : fb);
  return {
    introHowTo: t(u.introHowTo, defaultIntro),
    play: t(u.play, "Play →"),
    timeUp: t(u.timeUp, "Time!"),
    score: t(u.score, "Score"),
    misses: t(u.misses, "Misses"),
    replay: t(u.replay, "Replay"),
    newPhoto: t(u.newPhoto, "New photo"),
    newGame: t(u.newGame, "New game"),
    generatedBadge: t(u.generatedBadge, "AI Generated"),
  };
}

export const FALLBACK_SPEC: Omit<GameSpec, "ui"> & { ui: GameUi } = {
  title: "Travel Memory",
  tagline: "Catch the moments!",
  mechanic: "catch",
  targetEmoji: "✨",
  obstacleEmoji: "💧",
  background: "linear-gradient(180deg, hsl(200 70% 60%), hsl(220 60% 30%))",
  photo: "",
  duration: 30,
  locale: "en-US",
  ui: mergeGameUi(null, {
    mechanic: "catch",
    targetEmoji: "✨",
    obstacleEmoji: "💧",
  }),
};
