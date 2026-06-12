/** In-tab cache for diary photos (data URLs stripped from sessionStorage). */
const byGameId = new Map<string, string[]>();
let latest: string[] = [];

export function stashGamePhotos(photos: string[], gameId?: string | null): void {
  latest = photos;
  if (gameId) byGameId.set(gameId, photos);
}

export function peekGamePhotos(gameId?: string | null): string[] {
  if (gameId && byGameId.has(gameId)) return byGameId.get(gameId)!;
  return latest;
}

export function clearGamePhotos(gameId?: string | null): void {
  if (gameId) byGameId.delete(gameId);
  latest = [];
}
