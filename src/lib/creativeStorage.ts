import { writeAiGameSession } from "@/lib/aiGameSession";

const DRAFT_KEY = "mnemo_ai_create_draft";
const PLAY_DRAFT_KEY = "mnemo_play_url_draft";
const GENERATED_KEY = "mnemo_generated_games";
const PENDING_KEY = "mnemo_pending_generate";
const LOGIN_RETURN_KEY = "mnemo_login_return";

const MAX_GENERATED = 30;

export type AiCreateDraft = {
  photos: { id: string; dataUrl: string }[];
  hint: string;
  updatedAt: number;
};

export type SavedGeneratedGame = {
  id: string;
  createdAt: number;
  hint: string;
  photos: string[];
  source: "ai-create" | "ai-remix" | "instagram" | "xiaohongshu" | "screenshot" | "viral-trend";
  payload: Record<string, unknown>;
};

export type PendingGenerate = "ai-create" | "play-link" | "play-screenshot";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`creativeStorage write failed (${key}):`, e);
    return false;
  }
}

export function loadAiCreateDraft(): AiCreateDraft | null {
  const draft = readJson<AiCreateDraft | null>(DRAFT_KEY, null);
  if (!draft || !Array.isArray(draft.photos)) return null;
  return draft;
}

export function saveAiCreateDraft(draft: Omit<AiCreateDraft, "updatedAt">): boolean {
  return writeJson(DRAFT_KEY, { ...draft, updatedAt: Date.now() });
}

export function clearAiCreateDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function loadPlayUrlDraft(): string {
  return localStorage.getItem(PLAY_DRAFT_KEY) ?? "";
}

export function savePlayUrlDraft(url: string) {
  localStorage.setItem(PLAY_DRAFT_KEY, url);
}

export function setPendingGenerate(kind: PendingGenerate) {
  sessionStorage.setItem(PENDING_KEY, kind);
}

export function getPendingGenerate(): PendingGenerate | null {
  const v = sessionStorage.getItem(PENDING_KEY);
  if (v === "ai-create" || v === "play-link" || v === "play-screenshot") return v;
  return null;
}

export function clearPendingGenerate() {
  sessionStorage.removeItem(PENDING_KEY);
}

export function setLoginReturn(path: string) {
  sessionStorage.setItem(LOGIN_RETURN_KEY, path);
}

export function takeLoginReturn(): string | null {
  const path = sessionStorage.getItem(LOGIN_RETURN_KEY);
  if (path) sessionStorage.removeItem(LOGIN_RETURN_KEY);
  return path;
}

export function saveGeneratedGame(input: {
  hint: string;
  photos: string[];
  source: SavedGeneratedGame["source"];
  payload: Record<string, unknown>;
}): SavedGeneratedGame | null {
  const entry: SavedGeneratedGame = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    hint: input.hint,
    photos: input.photos,
    source: input.source,
    payload: input.payload,
  };
  const all = readJson<SavedGeneratedGame[]>(GENERATED_KEY, []);
  const next = [entry, ...all].slice(0, MAX_GENERATED);
  if (!writeJson(GENERATED_KEY, next)) return null;
  return entry;
}

export function getGeneratedGames(): SavedGeneratedGame[] {
  return readJson<SavedGeneratedGame[]>(GENERATED_KEY, []).sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function removeGeneratedGamesByArchiveId(archiveId: string): void {
  const all = readJson<SavedGeneratedGame[]>(GENERATED_KEY, []);
  const next = all.filter((g) => String(g.payload.archiveId ?? "") !== archiveId);
  if (next.length !== all.length) writeJson(GENERATED_KEY, next);
}

/** Local fallback when a journal game was saved before community publish. */
export function findGeneratedGameByArchiveId(archiveId: string): SavedGeneratedGame | null {
  return (
    getGeneratedGames().find((g) => String(g.payload.archiveId ?? "") === archiveId) ?? null
  );
}

/** Load a saved game into session for /games/ai-play */
export function restoreGeneratedGameToSession(id: string): boolean {
  const game = getGeneratedGames().find((g) => g.id === id);
  if (!game) return false;
  return writeAiGameSession(game.payload);
}
