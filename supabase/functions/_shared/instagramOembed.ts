import { downloadImageAsDataUrl, type SocialPreview } from "./socialTypes.ts";

export function normalizeIgUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (!u.hostname.includes("instagram.com")) return null;
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function fetchInstagramPreview(url: string): Promise<SocialPreview> {
  const normalizedUrl = normalizeIgUrl(url);
  if (!normalizedUrl) throw new Error("无效的 Instagram 链接");

  const oembedRes = await fetch(
    `https://api.instagram.com/oembed?url=${encodeURIComponent(normalizedUrl)}`,
    { headers: { "User-Agent": "MnemoPlay/1.0" } },
  );

  if (!oembedRes.ok) {
    throw new Error("无法读取该 Ins 帖子（需公开账号）");
  }

  const meta = await oembedRes.json();
  const thumbnailUrl = meta.thumbnail_url as string | undefined;
  if (!thumbnailUrl) throw new Error("帖子没有可用的预览图");

  const photoDataUrl = await downloadImageAsDataUrl(thumbnailUrl, "https://www.instagram.com/");

  const caption = [
    meta.title ? String(meta.title) : "",
    meta.author_name ? `@${meta.author_name}` : "",
  ].filter(Boolean).join("\n");

  return {
    platform: "instagram",
    normalizedUrl,
    caption: caption || "Instagram travel moment",
    authorName: meta.author_name as string | undefined,
    photoDataUrl,
  };
}
