import type { ArchiveSummary } from "@/lib/archiveApi";

/** Rich hint for game generation — framework stays English; AI content follows diary language. */
export function buildRichGameHint(input: {
  journalText?: string | null;
  summary?: ArchiveSummary | null;
  displayTitle?: string;
  variationNote?: string;
}): string {
  const parts: string[] = [];
  const journal = input.journalText?.trim();
  if (journal) parts.push(journal);

  const summary = input.summary;
  if (summary) {
    if (summary.mood?.length) parts.push(`Moods: ${summary.mood.join(", ")}`);
    if (summary.places?.length) parts.push(`Places: ${summary.places.join(", ")}`);
    if (summary.topics?.length) parts.push(`Topics: ${summary.topics.join(", ")}`);
    if (summary.one_line_persona?.trim()) parts.push(`Persona: ${summary.one_line_persona.trim()}`);
    if (summary.timeline?.length) {
      const beats = summary.timeline
        .filter((t) => t.note?.trim())
        .slice(0, 4)
        .map((t) => `${t.date}: ${t.note}`)
        .join(" | ");
      if (beats) parts.push(`Timeline: ${beats}`);
    }
    if (summary.voice_notes?.trim()) {
      parts.push(`Voice notes: ${summary.voice_notes.trim().slice(0, 120)}`);
    }
  }

  const title = input.displayTitle?.trim();
  if (title && title !== "Travel entry") parts.push(`Trip title: ${title}`);
  if (input.variationNote?.trim()) parts.push(input.variationNote.trim());

  return parts.join("\n").trim().slice(0, 1200);
}

export function createVariationSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function pickPhotoIndex(seed: number, photoCount: number): number {
  if (photoCount <= 0) return 0;
  return Math.abs(seed) % photoCount;
}
