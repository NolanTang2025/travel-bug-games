import { compressImageForAi } from "@/lib/compressImageForAi";
import { loadAiCreateDraft, getGeneratedGames } from "@/lib/creativeStorage";
import { peekGamePhotos, stashGamePhotos } from "@/lib/aiGamePhotoCache";

const SESSION_PHOTOS_KEY = "mnemo_play_photos";

type StoredPlayPhotos = {
  gameId?: string;
  photos: string[];
  at: number;
};

/** Keep diary photos reachable after navigation (sessionStorage strips raw data: URLs). */
export async function persistPlayPhotos(
  photos: string[],
  gameId?: string | null,
): Promise<void> {
  const clean = photos.filter((p) => typeof p === "string" && p.length > 0);
  if (!clean.length) return;

  stashGamePhotos(clean, gameId);

  const thumbs = await Promise.all(clean.slice(0, 4).map((p) => compressImageForAi(p)));
  const entry: StoredPlayPhotos = {
    gameId: gameId ?? undefined,
    photos: thumbs,
    at: Date.now(),
  };

  try {
    sessionStorage.setItem(SESSION_PHOTOS_KEY, JSON.stringify(entry));
    return;
  } catch {
    /* fall through — try single thumb */
  }

  try {
    sessionStorage.setItem(
      SESSION_PHOTOS_KEY,
      JSON.stringify({ gameId: gameId ?? undefined, photos: thumbs.slice(0, 1), at: Date.now() }),
    );
  } catch (e) {
    console.warn("persistPlayPhotos: sessionStorage quota", e);
  }
}

function readSessionStoredPhotos(gameId?: string | null): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_PHOTOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPlayPhotos;
    if (gameId && parsed.gameId && parsed.gameId !== gameId) return [];
    return parsed.photos.filter((p) => typeof p === "string" && p.length > 0);
  } catch {
    return [];
  }
}

function readLocalGeneratedPhotos(gameId?: string | null): string[] {
  const games = getGeneratedGames();
  if (gameId) {
    const match = games.find((g) => g.payload.communityGameId === gameId);
    if (match?.photos?.length) return match.photos;
  }
  const latest = games[0];
  if (latest?.photos?.length && Date.now() - latest.createdAt < 15 * 60 * 1000) {
    return latest.photos;
  }
  return [];
}

function readDraftPhotos(): string[] {
  const draft = loadAiCreateDraft();
  return draft?.photos.map((p) => p.dataUrl).filter(Boolean) ?? [];
}

export type PlayPhotoSession = {
  photos?: string[];
  photo?: string;
  communityGameId?: string;
};

/** Resolve user-uploaded photos for intro / post preview / gameplay. */
export function resolvePlayPhotos(
  gameId: string | undefined | null,
  session: PlayPhotoSession,
  navPhotos: string[] = [],
): string[] {
  const key = gameId ?? session.communityGameId ?? null;

  const cached = peekGamePhotos(key);
  if (cached.length) return cached;

  const stored = readSessionStoredPhotos(key);
  if (stored.length) return stored;

  const local = readLocalGeneratedPhotos(key);
  if (local.length) return local;

  if (!key) {
    const draft = readDraftPhotos();
    if (draft.length) return draft;
  }

  if (navPhotos.length) return navPhotos;

  const fromSession: string[] = [];
  if (Array.isArray(session.photos)) {
    fromSession.push(
      ...session.photos.filter((p): p is string => typeof p === "string" && p.length > 0),
    );
  } else if (session.photo && !session.photo.startsWith("data:")) {
    fromSession.push(session.photo);
  }
  return fromSession;
}
