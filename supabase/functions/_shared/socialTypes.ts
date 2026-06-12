export function bytesToDataUrl(bytes: Uint8Array, mime = "image/jpeg"): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function downloadImageAsDataUrl(
  imageUrl: string,
  referer = "https://www.xiaohongshu.com/",
): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": MOBILE_UA,
      Referer: referer,
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error("下载帖子图片失败");
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return bytesToDataUrl(bytes, mime);
}

export const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

export const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export type SocialPreview = {
  platform: "instagram" | "xiaohongshu";
  normalizedUrl: string;
  caption: string;
  authorName?: string;
  photoDataUrl: string;
};
