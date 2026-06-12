const IG_URL_RE = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[\w-]+/i;
const XHS_URL_RE = /https?:\/\/(?:www\.)?(?:xiaohongshu\.com\/(?:explore|discovery\/item)\/[\w]+|xhslink\.(?:com|cn)\/[^\s]+)/i;

export type SocialPlatform = "instagram" | "xiaohongshu";

export function extractSocialUrl(text: string): { url: string; platform: SocialPlatform } | null {
  const xhs = text.match(XHS_URL_RE);
  if (xhs) return { url: xhs[0].replace(/\/$/, ""), platform: "xiaohongshu" };

  const ig = text.match(IG_URL_RE);
  if (ig) return { url: ig[0].replace(/\/$/, ""), platform: "instagram" };

  return null;
}

export function isSocialPostUrl(text: string): boolean {
  return extractSocialUrl(text) !== null;
}
