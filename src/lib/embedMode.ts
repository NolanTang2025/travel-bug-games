/** Mobile app WebView: strip site chrome and skip intro screens. */
export function isEmbedMode(search: string): boolean {
  const value = new URLSearchParams(search).get("embed");
  return value === "1" || value === "true";
}

export function isAutoplayMode(search: string): boolean {
  const value = new URLSearchParams(search).get("autoplay");
  return value === "1" || value === "true";
}

export function useGameEmbedFlags(search: string) {
  const embed = isEmbedMode(search);
  const autoplay = isAutoplayMode(search);
  return { embed, autoplay, immersive: embed && autoplay };
}
