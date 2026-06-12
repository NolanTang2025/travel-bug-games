const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/;
const MOJIBAKE_RE = /[ÃÂæåçèéêëìíîïðñòóôõöùúûüý]|ï¼|â€|ã./;

export function containsCjk(text: string): boolean {
  return CJK_RE.test(text);
}

export function repairMojibake(text: string): string {
  if (!text || !MOJIBAKE_RE.test(text)) return text;
  try {
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (repaired.includes("\uFFFD")) return text;
    const score = (s: string) =>
      (s.match(CJK_RE) || []).length * 3 - (s.match(MOJIBAKE_RE) || []).length * 2;
    return score(repaired) > score(text) ? repaired : text;
  } catch {
    return text;
  }
}

export function decodeLiteralEscapes(text: string): string {
  if (!/\\[ntr]|\\u[0-9a-fA-F]{4}/.test(text)) return text;
  let out = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
  out = out.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return out;
}

export function normalizeGameText(value: unknown): string {
  if (value == null) return "";
  let text = typeof value === "string" ? value : String(value);
  text = decodeLiteralEscapes(text);
  text = repairMojibake(text);
  return text.normalize("NFC").trim();
}

export function coerceRecord(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

export function coerceArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

export type DiaryLanguage = "zh" | "ja" | "ko" | "en";

export function detectDiaryLanguage(hint: string): DiaryLanguage {
  const zh = (hint.match(/[\u4e00-\u9fff]/g) || []).length;
  const ja = (hint.match(/[\u3040-\u30ff]/g) || []).length;
  const ko = (hint.match(/[\uac00-\ud7af]/g) || []).length;
  const en = (hint.match(/[a-zA-Z]/g) || []).length;
  if (zh >= 6 && zh >= en) return "zh";
  if (ja >= 4 && ja >= en) return "ja";
  if (ko >= 4 && ko >= en) return "ko";
  return "en";
}

export function languageVoiceOverride(_hint: string): string {
  return `DEFAULT LANGUAGE: US English only. Every string must sound like a TikTok/Reels caption or comment — NOT a travel blog, NOT a game tutorial written by marketing.

GEN-Z / TK VOICE (2024–2026 chronically-online NA):
- lowercase deadpan OK; em dashes rare; periods optional on hooks
- openers that land: "not me…", "no because…", "the way i…", "i'm never recovering from…", "be so for real", "it's giving…", "rent free", "this wasn't in the brochure", "main character moment (negative)", "delulu", "i fear that i…"
- roast ONE micro-feeling from the trip (heat stroke cosplay, line ate 2 hours, social battery at 0%, mosquito summit)
- shareCaption = paste-ready post: hook line → punchline → soft CTA → 2–3 hashtags (#Mnemo #TravelTok + trip tag)

HARD BAN: Adventure, Journey, Quest, Magic, hidden gem, breathtaking, wanderlust, must-visit, beautiful, peaceful, explore, discover, unforgettable, slay, ate, understood the assignment, vibe check (as filler), generic template titles like "Forest Catch" or "Beach Day"

PASS TEST: would a 22yo post this without cringing? if no, rewrite.`;
}

const BEAT_KEYS = [
  "headline",
  "moment",
  "twist",
  "villain",
  "treasure",
  "safeLabel",
  "dangerLabel",
  "runEpithet",
  "mnemoQuip",
  "shareCaption",
] as const;

export function normalizeJourneyBeatFields(
  raw: unknown,
): Record<string, string> | undefined {
  const record = coerceRecord(raw);
  if (!record) return undefined;

  const out: Record<string, string> = {};
  for (const key of BEAT_KEYS) {
    const value = normalizeGameText(record[key]);
    if (value) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function sanitizeGamePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...payload };

  for (const key of [
    "title",
    "tagline",
    "instruction",
    "shareCaption",
    "targetEmoji",
    "obstacleEmoji",
    "background",
  ]) {
    if (key in out) out[key] = normalizeGameText(out[key]);
  }

  const beat = normalizeJourneyBeatFields(out.journeyBeat);
  if (beat) {
    out.journeyBeat = beat;
    if (!normalizeGameText(out.shareCaption) && beat.shareCaption) {
      out.shareCaption = beat.shareCaption;
    }
  }

  const rounds = coerceArray(out.textRounds);
  if (rounds) {
    out.textRounds = rounds.map((item) => {
      if (!item || typeof item !== "object") return item;
      const o = { ...(item as Record<string, unknown>) };
      o.prompt = normalizeGameText(o.prompt);
      if (Array.isArray(o.options)) {
        o.options = o.options.map(normalizeGameText);
      }
      if (Array.isArray(o.tiles)) {
        o.tiles = o.tiles.map(normalizeGameText);
      }
      return o;
    });
  }

  if (Array.isArray(out.gameAssets)) {
    out.gameAssets = (out.gameAssets as unknown[]).map((item) => {
      if (!item || typeof item !== "object") return item;
      const o = { ...(item as Record<string, unknown>) };
      o.displayName = normalizeGameText(o.displayName);
      if (o.uploadTease) o.uploadTease = normalizeGameText(o.uploadTease);
      if (o.imagePrompt) o.imagePrompt = normalizeGameText(o.imagePrompt);
      return o;
    });
  }

  return out;
}
