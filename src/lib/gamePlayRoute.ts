/** Navigate here after generation when a community game id exists. */
export function gamePlayPath(communityGameId?: string | null): string {
  if (communityGameId) return `/games/play/${communityGameId}`;
  return "/games/ai-play";
}
