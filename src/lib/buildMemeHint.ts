import type { MemeTrend } from "@/data/memeTrends";

export function buildMemeHint(trend: MemeTrend, userStory: string): string {
  const story = userStory.trim().slice(0, 400);
  const tags = trend.hashtags.join(" ");

  return `[MNEMO VIRAL TREND — "${trend.title}"]
${trend.llmBrief}

Creator's real moment (every beat must anchor here — no generic travel brochure):
${story || "(see photo — infer a specific moment)"}

Viral packaging (Gen-Z / TikTok voice — deadpan, self-own, comment-section energy):
- title/tagline/shareCaption must PERFORM the trend format using THEIR story as the punchline
- use hook patterns: "not me…", "no because…", "the way i…", "this wasn't in the brochure", "be so for real"
- shareCaption: line 1 = scroll-stop hook; 2–3 short lines; paste-ready for TikTok/Reels/Story
- BANNED: Adventure, Journey, beautiful, peaceful, wanderlust, generic template titles
- Weave hashtags naturally: ${tags}
- Do not explain the meme to the audience — show it`;
}
