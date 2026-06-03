import { buildGameFootnote, getCommunityPost } from "@/data/communityPosts";
import { getEditionById, getPerformanceTier, type PerformanceTier } from "@/data/printEditions";

const STORAGE_KEY = "mnemo_journal_runs";
const MAX_RUNS = 40;

export type SavedJournalRun = {
  id: string;
  editionId: string;
  editionTitle: string;
  city: string;
  vol: string;
  score: number;
  misses: number;
  tier: PerformanceTier;
  footnote: string;
  playedAt: number;
};

function readAll(): SavedJournalRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedJournalRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(runs: SavedJournalRun[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
}

export function getJournalRuns(): SavedJournalRun[] {
  return readAll().sort((a, b) => b.playedAt - a.playedAt);
}

export function getRunsForEdition(editionId: string): SavedJournalRun[] {
  return getJournalRuns().filter((r) => r.editionId === editionId);
}

export function saveJournalRun(
  editionId: string,
  score: number,
  misses: number,
): SavedJournalRun | null {
  const edition = getEditionById(editionId);
  const post = getCommunityPost(editionId);
  if (!edition) return null;

  const tier = getPerformanceTier(score, misses, edition);
  const footnote = post
    ? buildGameFootnote(post, tier, score, misses)
    : `Score ${score} · ${misses} misses`;

  const run: SavedJournalRun = {
    id: `${editionId}-${Date.now()}`,
    editionId,
    editionTitle: edition.title,
    city: edition.city,
    vol: edition.n,
    score,
    misses,
    tier,
    footnote,
    playedAt: Date.now(),
  };

  writeAll([run, ...readAll()]);
  return run;
}

export function clearJournalRuns() {
  localStorage.removeItem(STORAGE_KEY);
}
