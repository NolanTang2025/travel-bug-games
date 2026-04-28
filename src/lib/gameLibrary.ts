import { resizeDataUrl } from "@/lib/imageResize";

export type SavedGame = {
  id: string;
  createdAt: string;
  title: string;
  tagline: string;
  background: string;
  mechanic: "catch" | "dodge";
  targetEmoji: string;
  obstacleEmoji: string;
  duration: number;
  locale?: string;
  ui?: unknown;
  journalTextLocale?: string;
  /** Smaller cover image data URL */
  coverPhoto: string;
  /** Full ai_game payload (stringified) */
  payload: string;
};

const KEY = "travel_memory_saved_games_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function listSavedGames(): SavedGame[] {
  const arr = safeParse<SavedGame[]>(localStorage.getItem(KEY));
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((g) => g && typeof g.id === "string" && typeof g.payload === "string")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function getSavedGame(id: string): SavedGame | null {
  return listSavedGames().find((g) => g.id === id) ?? null;
}

export async function saveCurrentAiGame(): Promise<SavedGame | null> {
  const raw = sessionStorage.getItem("ai_game");
  if (!raw) return null;
  const obj = safeParse<Record<string, unknown>>(raw) ?? {};

  const blueprint = obj.blueprint as {
    meta?: { title?: string; tagline?: string; durationSec?: number };
    visuals?: {
      backgroundCss?: string;
      mechanic?: string;
      targetEmoji?: string;
      obstacleEmoji?: string;
    };
  } | undefined;

  const createdAt = new Date().toISOString();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const photo = typeof obj.photo === "string" ? obj.photo : "";
  const coverPhoto =
    photo && photo.startsWith("data:image") ? await resizeDataUrl(photo, 720, 0.72) : "";

  const titleFromBlueprint = blueprint?.meta?.title;
  const taglineFromBlueprint = blueprint?.meta?.tagline;
  const bgFromBlueprint = blueprint?.visuals?.backgroundCss;

  const entry: SavedGame = {
    id,
    createdAt,
    title: String((typeof obj.title === "string" && obj.title.trim() ? obj.title : titleFromBlueprint) || "Untitled"),
    tagline: String((typeof obj.tagline === "string" ? obj.tagline : taglineFromBlueprint) || ""),
    background: String((typeof obj.background === "string" ? obj.background : bgFromBlueprint) || "linear-gradient(180deg, #334, #112)"),
    mechanic:
      obj.mechanic === "dodge" || blueprint?.visuals?.mechanic === "dodge" ? "dodge" : "catch",
    targetEmoji: String(obj.targetEmoji || blueprint?.visuals?.targetEmoji || "✨"),
    obstacleEmoji: String(obj.obstacleEmoji || blueprint?.visuals?.obstacleEmoji || "💧"),
    duration: Number(obj.duration ?? blueprint?.meta?.durationSec ?? 30),
    locale: typeof obj.locale === "string" ? obj.locale : undefined,
    ui: obj.ui,
    journalTextLocale: typeof obj.journalTextLocale === "string" ? obj.journalTextLocale : undefined,
    coverPhoto,
    payload: raw,
  };

  const prev = listSavedGames();
  const next = [entry, ...prev].slice(0, 24);
  localStorage.setItem(KEY, JSON.stringify(next));
  return entry;
}

