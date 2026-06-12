import type { AIGameTemplateSpec, GameEngine } from "@/games/templates/types";
import { isTextEngine } from "@/games/templates/types";
import type { GameplayGuide } from "@/lib/gameplayGuide";
import { BRAND_NAME } from "@/lib/brand";

/** Mnemo riso-press IP — stamped on every generated level */
export const MNEMO_PRESS = `${BRAND_NAME} Press`;
export const MNEMO_STAMP_INTRO = `${MNEMO_PRESS} · journal → post`;
export const MNEMO_STAMP_OVER = `Made on ${BRAND_NAME}`;

export type ShareCaptionOptions = {
  /** Stable play URL — appended for link-in-bio / Story swipe-up */
  playUrl?: string;
};

/** TikTok / Reels / Story caption — paste to social */
export function buildShareCaption(spec: AIGameTemplateSpec, options?: ShareCaptionOptions): string {
  const beat = spec.journeyBeat;
  const base =
    beat?.shareCaption?.trim() ||
    (() => {
      const lines: string[] = [];
      const hook = spec.tagline?.trim() || beat?.headline || spec.title;
      if (hook) lines.push(hook);
      const punch = beat?.moment?.trim() || beat?.twist?.trim();
      if (punch && punch !== hook) lines.push(punch);
      lines.push(`not me turning a trip into playable content with ${BRAND_NAME}`);
      lines.push("this wasn't in the brochure");
      lines.push("#Mnemo #TravelTok #CoreMemory");
      return lines.join("\n");
    })();

  if (options?.playUrl && !base.includes(options.playUrl)) {
    return `${base}\n${options.playUrl}`;
  }
  return base;
}

export async function copyShareCaption(
  spec: AIGameTemplateSpec,
  options?: ShareCaptionOptions,
): Promise<boolean> {
  const text = buildShareCaption(spec, options);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function beatOr(spec: AIGameTemplateSpec, key: "villain" | "treasure", fallback: string) {
  return spec.journeyBeat?.[key] ?? fallback;
}

function headline(spec: AIGameTemplateSpec) {
  return spec.journeyBeat?.headline || spec.title;
}

function twist(spec: AIGameTemplateSpec) {
  return (
    spec.journeyBeat?.twist ||
    spec.tagline ||
    `not me turning a journal entry into playable content.`
  );
}

function mnemoQuip(spec: AIGameTemplateSpec) {
  return (
    spec.journeyBeat?.mnemoQuip ||
    `${BRAND_NAME}: your trip is now a post you can actually play — no because that's kind of unhinged.`
  );
}

function guideBase(spec: AIGameTemplateSpec): Pick<GameplayGuide, "title" | "summary" | "penalty"> {
  return {
    title: headline(spec),
    summary: twist(spec),
    penalty: `whiff −25 · combo gone · ${BRAND_NAME} saw that`,
  };
}

function catchGuide(spec: AIGameTemplateSpec): GameplayGuide {
  const villain = beatOr(spec, "villain", "the bad stuff");
  const treasure = beatOr(spec, "treasure", "the good moment");
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "👈", title: "Slide", body: "Drag or tap ← → — the basket follows you." },
      {
        emoji: spec.targetEmoji,
        title: "Catch the good",
        body: `${spec.targetEmoji} = ${treasure}. Center the basket — clean catches stack combo.`,
      },
      {
        emoji: spec.obstacleEmoji,
        title: `Dodge ${villain}`,
        body: `${spec.obstacleEmoji} in the basket counts as a whiff. Move aside.`,
      },
      { emoji: "🔥", title: "Combo", body: "Clean streaks multiply your score." },
    ],
    winCondition: `Max score in ${spec.duration}s · ${MNEMO_PRESS}`,
  };
}

function swarmGuide(spec: AIGameTemplateSpec): GameplayGuide {
  const treasure = beatOr(spec, "treasure", "the wins");
  return {
    ...guideBase(spec),
    steps: [
      { emoji: spec.targetEmoji, title: "Tap fast", body: `${treasure} drops — tap ${spec.targetEmoji} before it's gone.` },
      { emoji: spec.obstacleEmoji, title: "Wrong tap", body: `Never tap ${spec.obstacleEmoji}. Instant regret.` },
      { emoji: "⚡", title: "It speeds up", body: "Late game gets chaotic. Stay locked in." },
    ],
    winCondition: `${spec.duration}s tap sprint · ${BRAND_NAME} is watching`,
  };
}

function tapClearGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: spec.obstacleEmoji, title: "Tap threats", body: `Pop ${spec.obstacleEmoji} before they land.` },
      { emoji: spec.targetEmoji, title: "Hands off", body: `${spec.targetEmoji} is a bonus — tapping it hurts you.` },
    ],
    winCondition: `Survive ${spec.duration}s · clear the board`,
  };
}

function holdGuide(spec: AIGameTemplateSpec): GameplayGuide {
  const safe = spec.journeyBeat?.safeLabel ?? "go";
  const danger = spec.journeyBeat?.dangerLabel ?? "wait";
  const treasure = beatOr(spec, "treasure", "the finish");
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "🚦", title: "Read the signal", body: `Bar flips between "${safe}" and "${danger}" — that's the beat.` },
      { emoji: "👆", title: "Hold on green", body: `Only hold when it says "${safe}" to move the progress bar.` },
      { emoji: "🛑", title: "Release on red", body: `"${danger}" means let go. Greeding costs you.` },
      {
        emoji: spec.obstacleEmoji,
        title: `Dodge ${beatOr(spec, "villain", "hazards")}`,
        body: `${spec.obstacleEmoji} drops during danger windows — don't force it.`,
      },
    ],
    winCondition: `Reach ${treasure} · +50 per checkpoint`,
  };
}

function dragGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "🫙", title: "Drag", body: "Slide your finger — the jar follows." },
      { emoji: spec.targetEmoji, title: "Collect", body: `Catch ${spec.targetEmoji} (${beatOr(spec, "treasure", "loot")}).` },
      { emoji: spec.obstacleEmoji, title: "Avoid", body: `${spec.obstacleEmoji} in the jar = whiff.` },
    ],
    winCondition: `${spec.duration}s collect run · ${MNEMO_PRESS}`,
  };
}

function lanesGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "↔️", title: "Switch lanes", body: "Tap arrows or swipe — three lanes." },
      { emoji: spec.targetEmoji, title: "Grab bonuses", body: `Same lane as ${spec.targetEmoji} to collect.` },
      { emoji: spec.obstacleEmoji, title: "Move over", body: "Obstacle incoming? Change lanes." },
    ],
    winCondition: `${spec.duration}s lane run`,
  };
}

function swipeGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "🧭", title: "Follow arrows", body: "Swipe the direction shown — hesitation costs you." },
      { emoji: "💨", title: "Block the gust", body: `Correct swipes hold off ${beatOr(spec, "villain", "the wind")}.` },
    ],
    winCondition: `${spec.duration}s wind gauntlet`,
  };
}

function rhythmGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "✨", title: "Hit the lit column", body: "Tap whichever column is glowing on beat." },
      { emoji: spec.obstacleEmoji, title: "Stay on tempo", body: "Early or late taps count as misses." },
    ],
    winCondition: `${spec.duration}s rhythm run`,
  };
}

function tramGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "↕️", title: "Move tracks", body: "Slide up/down to align with pickups." },
      { emoji: spec.targetEmoji, title: "Collect", body: `Pass through ${spec.targetEmoji} for points.` },
      { emoji: spec.obstacleEmoji, title: "Dodge", body: `See ${spec.obstacleEmoji}? Switch early.` },
    ],
    winCondition: `${spec.duration}s tram run`,
  };
}

function shutterGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: "📷", title: "Frame it", body: "Wait until the target is in the viewfinder." },
      { emoji: "👆", title: "Snap", body: `That's you locking in ${beatOr(spec, "treasure", "the shot")}.` },
    ],
    winCondition: `${spec.duration}s photo run · feed-ready`,
  };
}

function popGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return {
    ...guideBase(spec),
    steps: [
      { emoji: spec.targetEmoji, title: "Quick tap", body: `${spec.targetEmoji} flashes briefly — tap it.` },
      { emoji: "⏱️", title: "No hesitation", body: "Late = miss. Trust your reflexes." },
    ],
    winCondition: `${spec.duration}s pop quiz`,
  };
}

function textGuide(spec: AIGameTemplateSpec): GameplayGuide {
  const rounds = spec.textRounds?.length ?? 3;
  const moment = spec.journeyBeat?.moment?.slice(0, 48);
  return {
    title: headline(spec),
    summary: moment
      ? `${BRAND_NAME} quizzed you on "${moment}…" — ${rounds} rounds.`
      : `${BRAND_NAME} pulled ${rounds} questions from your journal.`,
    steps: [
      { emoji: "📔", title: "Read", body: "Every prompt ties to YOUR trip — not a generic personality test." },
      { emoji: "✅", title: "Pick", body: "Choose what actually happened that day. Guessing is cringe." },
      { emoji: "🧩", title: "Fill-in", body: "Tap words in order to rebuild the line you meant." },
    ],
    winCondition: `${rounds} rounds · ${MNEMO_PRESS} on file`,
    penalty: "Wrong answers cost points — no timer though",
  };
}

const GUIDE: Partial<Record<GameEngine, (spec: AIGameTemplateSpec) => GameplayGuide>> = {
  falling_catch: catchGuide,
  falling_swarm: swarmGuide,
  falling_tap_clear: tapClearGuide,
  hold_crosswalk: holdGuide,
  drag_jar: dragGuide,
  lanes_vertical: lanesGuide,
  swipe_wind: swipeGuide,
  rhythm_tap: rhythmGuide,
  tram_sides: tramGuide,
  shutter_snap: shutterGuide,
  photo_pop: popGuide,
};

export function buildGameplayGuide(spec: AIGameTemplateSpec): GameplayGuide {
  if (isTextEngine(spec.engine)) return textGuide(spec);
  const factory = GUIDE[spec.engine];
  return factory ? factory(spec) : catchGuide(spec);
}

export type RunRecap = {
  headline: string;
  epithet: string;
  statsLine: string;
  mnemoLine: string;
  moment?: string;
};

function defaultEpithet(score: number, misses: number): string {
  if (misses === 0 && score >= 200) return "quietly cooked";
  if (misses >= 8) return "chronically whiffing";
  if (score < 80) return "bare minimum tourist";
  return "somehow still standing";
}

export function buildRunRecap(
  result: { score: number; misses: number },
  spec: AIGameTemplateSpec,
): RunRecap {
  const beat = spec.journeyBeat;
  return {
    headline: beat?.headline || spec.title,
    epithet: beat?.runEpithet || defaultEpithet(result.score, result.misses),
    statsLine: `${result.score} pts · ${result.misses} whiffs`,
    mnemoLine: mnemoQuip(spec),
    moment: beat?.moment,
  };
}

export function getPenaltyCopy(spec: AIGameTemplateSpec): { message: string; detail: string } {
  const danger = spec.journeyBeat?.dangerLabel;
  const villain = beatOr(spec, "villain", "that");
  return {
    message: danger ? `${danger} — be so for real` : `${villain} got you. no because.`,
    detail: `−25 pts · combo reset · logged for the group chat`,
  };
}

export const JOURNEY_FLASH_LABELS = [
  `${BRAND_NAME} reading your journal`,
  "your inner monologue",
  "the moment we're exaggerating",
  "main character energy (unfortunately)",
] as const;
