import { sanitizeGamePayload } from "@/lib/gameTextNormalize";
import { persistPlayPhotos } from "@/lib/resolvePlayPhotos";

const AI_GAME_SESSION_KEY = "ai_game";

function extractPhotoUrls(payload: Record<string, unknown>): string[] {
  if (Array.isArray(payload.photos)) {
    const urls = payload.photos.filter((p): p is string => typeof p === "string" && p.length > 0);
    if (urls.length) return urls;
  }
  if (typeof payload.photo === "string" && payload.photo.length > 0) return [payload.photo];
  return [];
}

/** Persist play payload without blowing sessionStorage quota (no base64 photos). */
export function writeAiGameSession(payload: Record<string, unknown>): boolean {
  const originalPhotos = extractPhotoUrls(payload);
  const gameId =
    typeof payload.communityGameId === "string" ? payload.communityGameId : null;
  if (originalPhotos.length) void persistPlayPhotos(originalPhotos, gameId);

  const slim = sanitizeGamePayload({ ...payload });
  if (Array.isArray(slim.photos)) {
    slim.photos = (slim.photos as unknown[]).filter(
      (p) => typeof p === "string" && !String(p).startsWith("data:"),
    );
  }
  if (typeof slim.photo === "string" && slim.photo.startsWith("data:")) {
    const photos = slim.photos as string[] | undefined;
    slim.photo = photos?.[0];
  }

  try {
    sessionStorage.setItem(AI_GAME_SESSION_KEY, JSON.stringify(slim));
    return true;
  } catch (e) {
    console.error("writeAiGameSession:", e);
    try {
      const { photos: _p, photo: _ph, ...core } = slim;
      sessionStorage.setItem(AI_GAME_SESSION_KEY, JSON.stringify(core));
      return true;
    } catch {
      return false;
    }
  }
}
