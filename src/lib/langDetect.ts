import type { AppLocale } from "@/i18n/translations";

function countRegex(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

/**
 * Very lightweight language guess from user-entered text.
 * Prioritizes what users typically type in journals: CJK vs Latin.
 */
export function detectJournalLocale(text: string): AppLocale {
  const t = (text || "").trim();
  if (!t) return "en";

  const han = countRegex(t, /[\u4E00-\u9FFF]/g); // CJK Unified Ideographs
  const hiraKata = countRegex(t, /[\u3040-\u30FF]/g); // Japanese
  const hangul = countRegex(t, /[\uAC00-\uD7AF]/g); // Korean
  const latin = countRegex(t, /[A-Za-z]/g);

  // If Japanese scripts present, prefer Japanese.
  if (hiraKata >= 2) return "ja";
  // If Korean present, prefer Korean.
  if (hangul >= 2) return "ko";

  // Chinese vs English: compare rough density.
  if (han >= 2 && han >= latin) return "zh-CN";
  if (latin >= 3 && latin > han) return "en";

  // Default for short/mixed.
  if (han > 0) return "zh-CN";
  return "en";
}

