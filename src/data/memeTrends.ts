import bundledManifest from "../../public/meme-trends.json";
import type { MemeTrend, MemeTrendsManifest } from "./memeTrendTypes";

export type { MemeTrend, MemeTrendHeat, MemeTrendsManifest } from "./memeTrendTypes";

export const BUNDLED_MANIFEST = bundledManifest as MemeTrendsManifest;

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isTrendActive(trend: MemeTrend, at: Date = new Date()): boolean {
  const expires = parseDate(trend.expiresAt);
  if (!expires) return true;
  return at < expires;
}

export function activeTrends(
  manifest: MemeTrendsManifest,
  at: Date = new Date(),
): MemeTrend[] {
  return manifest.trends.filter((t) => isTrendActive(t, at));
}

export function getMemeTrend(
  manifest: MemeTrendsManifest,
  id: string | null | undefined,
  at: Date = new Date(),
): MemeTrend | undefined {
  if (!id) return undefined;
  return activeTrends(manifest, at).find((t) => t.id === id);
}

export function featuredMemeTrends(
  manifest: MemeTrendsManifest,
  count = 3,
  at: Date = new Date(),
): MemeTrend[] {
  const active = activeTrends(manifest, at);
  const picked = manifest.featuredIds
    .map((id) => active.find((t) => t.id === id))
    .filter((t): t is MemeTrend => Boolean(t));

  if (picked.length >= count) return picked.slice(0, count);

  const remainder = active.filter((t) => !picked.some((p) => p.id === t.id));
  return [...picked, ...remainder].slice(0, count);
}

export function isNewerManifest(
  lhs: MemeTrendsManifest,
  rhs: MemeTrendsManifest,
): boolean {
  const left = parseDate(lhs.updatedAt)?.getTime() ?? 0;
  const right = parseDate(rhs.updatedAt)?.getTime() ?? 0;
  return left >= right;
}

/** Bundled trends — same source as mobile `Resources/meme-trends.json`. */
export const MEME_TRENDS = activeTrends(BUNDLED_MANIFEST);

export function getBundledMemeTrend(id: string | null | undefined): MemeTrend | undefined {
  return getMemeTrend(BUNDLED_MANIFEST, id);
}
