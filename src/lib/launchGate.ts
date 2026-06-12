export type FeatureId = "pastePostToGame" | "twinDiscordConnect" | "trendRemixToGame";

export type FeaturePhase = "live" | "beta" | "paused";

export type FeatureMeta = {
  phase: FeaturePhase;
  tag: string;
  title: string;
  blurb: string;
  bannerTitle: string;
  bannerBody: string;
  tone: "pink" | "cyan" | "violet" | "yellow";
  /** Hide or disable the main CTA while still showing the screen */
  blockPrimaryAction?: boolean;
};

export const FEATURES: Record<FeatureId, FeatureMeta> = {
  pastePostToGame: {
    phase: "beta",
    tag: "Private beta",
    title: "Paste to game",
    blurb:
      "We're finishing the post → playable clip pipeline. You can preview the flow, but results may be incomplete.",
    bannerTitle: "Post → game · private beta",
    bannerBody:
      "Paste & generate is live in preview only. Link parsing and game output may fail while we ship the full chain.",
    tone: "cyan",
    blockPrimaryAction: false,
  },
  twinDiscordConnect: {
    phase: "beta",
    tag: "Private beta",
    title: "Twin × Discord",
    blurb:
      "Digital twin from your archives works. Discord connect and auto-drafts are still being wired up.",
    bannerTitle: "Twin × Discord · private beta",
    bannerBody:
      "You can build a twin from Journal archives. Discord connection and inbox drafts aren't fully live yet — nothing sends without your approval.",
    tone: "violet",
    blockPrimaryAction: true,
  },
  trendRemixToGame: {
    phase: "beta",
    tag: "Private beta",
    title: "Viral Lab · Trends",
    blurb:
      "Trend remix → playable clip is in preview. Templates refresh, but generation may fail or return incomplete games.",
    bannerTitle: "Trends · private beta",
    bannerBody:
      "The full trend → remix → play pipeline is still in internal testing. Browse and draft freely — game output may be unstable.",
    tone: "yellow",
    blockPrimaryAction: false,
  },
};

/** Route-level gates — `paused` shows ComingSoon instead of the page. */
export const LAUNCH_GATE = {
  pastePostToGame: FEATURES.pastePostToGame.phase !== "paused",
  journalToGame: true,
  trendRemixToGame: FEATURES.trendRemixToGame.phase !== "paused",
};

export type PausedRoute = "pastePost" | "journalCreate" | "trendRemix" | "twinDiscord";

const PAUSED_ROUTE_FEATURE: Partial<Record<PausedRoute, FeatureId>> = {
  pastePost: "pastePostToGame",
  trendRemix: "trendRemixToGame",
};

export function featureMeta(id: FeatureId): FeatureMeta {
  return FEATURES[id];
}

export function isFeatureBeta(id: FeatureId): boolean {
  return FEATURES[id].phase === "beta";
}

export function isFeaturePaused(id: FeatureId): boolean {
  return FEATURES[id].phase === "paused";
}

export function pausedCopy(route: PausedRoute): {
  eyebrow: string;
  title: string;
  tag: string;
  blurb: string;
  tone: FeatureMeta["tone"];
} {
  const featureId = PAUSED_ROUTE_FEATURE[route];
  if (featureId) {
    const f = FEATURES[featureId];
    return {
      eyebrow: "Mnemo Press",
      title: f.title,
      tag: f.tag,
      blurb: f.blurb,
      tone: f.tone,
    };
  }

  const fallback: Record<
    Exclude<PausedRoute, "pastePost" | "trendRemix">,
    { eyebrow: string; title: string; tag: string; blurb: string; tone: FeatureMeta["tone"] }
  > = {
    journalCreate: {
      eyebrow: "Mnemo Press",
      title: "AI Create",
      tag: "Coming soon",
      blurb: "Photo + note → playable game is rolling out shortly.",
      tone: "pink",
    },
    twinDiscord: {
      eyebrow: "Mnemo Twin",
      title: "Twin Discord",
      tag: FEATURES.twinDiscordConnect.tag,
      blurb: FEATURES.twinDiscordConnect.blurb,
      tone: FEATURES.twinDiscordConnect.tone,
    },
  };

  return fallback[route as Exclude<PausedRoute, "pastePost" | "trendRemix">];
}

/** Nav path → feature for inline beta pills */
export const NAV_BETA_FEATURES: Partial<Record<string, FeatureId>> = {
  "/play": "pastePostToGame",
  "/trends": "trendRemixToGame",
  "/twin": "twinDiscordConnect",
};

/** Home mode cards → feature */
export const MODE_BETA_FEATURES: Partial<Record<string, FeatureId>> = {
  "/play": "pastePostToGame",
  "/trends": "trendRemixToGame",
  "/twin": "twinDiscordConnect",
};
