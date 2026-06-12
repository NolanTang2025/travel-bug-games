import type { SocialPreview } from "./socialTypes.ts";
import { fetchInstagramPreview, normalizeIgUrl } from "./instagramOembed.ts";
import { fetchXiaohongshuPreview, isXiaohongshuUrl } from "./xiaohongshuPreview.ts";

export type SocialPlatform = SocialPreview["platform"];

export function detectSocialPlatform(raw: string): SocialPlatform | null {
  const text = raw.trim();
  if (normalizeIgUrl(text) || text.includes("instagram.com")) return "instagram";
  if (isXiaohongshuUrl(text)) return "xiaohongshu";
  return null;
}

export async function fetchSocialPreview(url: string): Promise<SocialPreview> {
  const platform = detectSocialPlatform(url);
  if (platform === "instagram") return fetchInstagramPreview(url);
  if (platform === "xiaohongshu") return fetchXiaohongshuPreview(url);
  throw new Error("请粘贴 Instagram 或小红书帖子链接");
}
