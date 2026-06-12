/** Infer archive title from diary text when AI summary fails */
export function deriveArchiveTitle(raw: string): string {
  const t = raw.trim();
  if (!t) return "Travel log";

  const went = t.match(/(?:went to|visited|explored|in)\s+([^,.!\n]{2,48})/i);
  if (went?.[1]) {
    const place = went[1].trim().slice(0, 36);
    if (place) return place;
  }

  const first = t.split(/[\n。！？!?]/)[0]?.trim() ?? "";
  return first.slice(0, 36) || "Travel log";
}
