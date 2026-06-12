import {
  DESKTOP_UA,
  downloadImageAsDataUrl,
  MOBILE_UA,
  type SocialPreview,
} from "./socialTypes.ts";

const XHS_HOSTS = ["xiaohongshu.com", "xhslink.com", "xhslink.cn"];

export function isXiaohongshuUrl(raw: string): boolean {
  try {
    const host = new URL(raw.trim()).hostname.replace(/^www\./, "");
    return XHS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export async function resolveXhsUrl(raw: string): Promise<string> {
  let current = raw.trim();
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": MOBILE_UA, Accept: "text/html" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      current = new URL(loc, current).href;
      continue;
    }
    break;
  }
  return current;
}

export function extractXhsNoteId(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/(?:explore|discovery\/item)\/([a-f0-9]{24})/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractMeta(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtml(m[1].trim());
  }
}

function parseInitialState(html: string): Record<string, unknown> | null {
  const m = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1].replace(/:\s*undefined/g, ": null"));
  } catch {
    return null;
  }
}

type NoteBits = { title: string; desc: string; imageUrl?: string; author?: string };

function extractNoteFromState(state: Record<string, unknown>): NoteBits | null {
  const candidates: unknown[] = [
    (state.note as Record<string, unknown> | undefined)?.noteDetailMap,
    state.noteDetailMap,
    (state.noteData as Record<string, unknown> | undefined)?.noteDetailMap,
    ((state.noteData as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)
      ?.noteDetailMap,
  ];

  for (const ndm of candidates) {
    if (!ndm || typeof ndm !== "object") continue;
    for (const [key, entry] of Object.entries(ndm as Record<string, unknown>)) {
      if (!key || key === "null") continue;
      const wrapped = entry as Record<string, unknown>;
      const note = (wrapped.note ?? wrapped) as Record<string, unknown>;
      const imageList = note.imageList as Record<string, unknown>[] | undefined;
      const first = imageList?.[0] as Record<string, unknown> | undefined;
      const imageUrl =
        (first?.urlDefault as string | undefined) ??
        (first?.url as string | undefined) ??
        ((first?.infoList as Record<string, unknown>[] | undefined)?.[0]?.url as string | undefined);

      const desc = String(note.desc ?? note.title ?? "").trim();
      const title = String(note.title ?? "").trim();
      if (desc || title || imageUrl) {
        const user = note.user as Record<string, unknown> | undefined;
        return {
          title,
          desc: desc || title,
          imageUrl,
          author: user?.nickname as string | undefined,
        };
      }
    }
  }
  return null;
}

async function fetchXhsHtml(url: string, ua = MOBILE_UA): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": ua,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Referer: "https://www.xiaohongshu.com/",
    },
  });
  if (!res.ok) throw new Error(`小红书页面返回 ${res.status}`);
  return await res.text();
}

export async function fetchXiaohongshuPreview(rawUrl: string): Promise<SocialPreview> {
  if (!isXiaohongshuUrl(rawUrl)) throw new Error("无效的小红书链接");

  const resolved = await resolveXhsUrl(rawUrl);
  let html = await fetchXhsHtml(resolved);
  let state = parseInitialState(html);
  let note = state ? extractNoteFromState(state) : null;

  if (!note?.imageUrl) {
    const desktopHtml = await fetchXhsHtml(resolved, DESKTOP_UA).catch(() => "");
    if (desktopHtml) {
      html = desktopHtml;
      state = parseInitialState(desktopHtml);
      if (state) note = extractNoteFromState(state) ?? note;
    }
  }

  const ogTitle = extractMeta(html, "og:title");
  const ogDesc = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  const caption = [
    note?.desc || ogDesc || ogTitle || "",
    note?.author ? `@${note.author}` : "",
  ].filter(Boolean).join("\n");

  const imageUrl = note?.imageUrl || ogImage;
  if (!imageUrl) {
    throw new Error(
      "无法自动读取小红书帖子。请从 App「分享 → 复制链接」粘贴完整链接；或在本页「上传帖子截图」。",
    );
  }

  const photoDataUrl = imageUrl.startsWith("data:")
    ? imageUrl
    : await downloadImageAsDataUrl(imageUrl, resolved);

  return {
    platform: "xiaohongshu",
    normalizedUrl: resolved.split("#")[0],
    caption: caption || "小红书旅行笔记",
    authorName: note?.author,
    photoDataUrl,
  };
}
