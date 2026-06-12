/** Public site base (no trailing slash). */
export function getPublicSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
    if (isLocal) return "https://mnemo-games.vercel.app";
    return origin;
  }

  return "https://mnemo-games.vercel.app";
}

/** Scan-to-play landing — paste Instagram / RedNote links. */
export function getPublicPlayUrl(): string {
  return `${getPublicSiteUrl()}/play`;
}

/** Stable share link for a published community game. */
export function getPublicGamePlayUrl(gameId: string): string {
  return `${getPublicSiteUrl()}/games/play/${gameId}`;
}

export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}
