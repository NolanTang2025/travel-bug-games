import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_HTML_CHARS = 600_000;
const FETCH_TIMEOUT_MS = 18_000;
const MAX_COOKIE_CHARS = 10_000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const cp = Number.parseInt(String(hex), 16);
      if (!Number.isFinite(cp)) return _;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return _;
      }
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const cp = Number(n);
      if (!Number.isFinite(cp)) return _;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return _;
      }
    });
}

function assertPublicHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs");
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal")
  ) {
    throw new Error("URL not allowed");
  }
  return u;
}

function normalizeCookie(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.length > MAX_COOKIE_CHARS) throw new Error("Cookie too long");
  if (/[\r\n]/.test(s)) throw new Error("Cookie contains invalid characters");
  return s;
}

async function fetchBytes(
  url: string,
  accept: string,
  cookie?: string | null,
  extraHeaders?: Record<string, string>,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      Accept: accept,
      "User-Agent":
        "Mozilla/5.0 (compatible; TravelMemoryGames/1.0; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko)",
    };
    if (cookie) headers.Cookie = cookie;
    if (extraHeaders) {
      for (const [k, v] of Object.entries(extraHeaders)) headers[k] = v;
    }

    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type")?.split(";")[0]?.trim() || "";
    const buf = new Uint8Array(await res.arrayBuffer());
    return { bytes: buf, contentType: ct };
  } finally {
    clearTimeout(t);
  }
}

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  const b64 = encodeBase64(bytes);
  return `data:${mime};base64,${b64}`;
}

function parseHtmlMeta(html: string): {
  title?: string;
  description?: string;
  imageUrls: string[];
  warning?: string;
} {
  const slice = html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html;

  const metaName = (name: string): string | undefined => {
    const patterns = [
      new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
    ];
    for (const re of patterns) {
      const m = slice.match(re);
      if (m?.[1]) return decodeHtmlEntities(m[1].trim());
    }
    return undefined;
  };

  const metaContent = (prop: string): string | undefined => {
    const patterns = [
      new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, "i"),
      new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${prop}["']`, "i"),
    ];
    for (const re of patterns) {
      const m = slice.match(re);
      if (m?.[1]) return decodeHtmlEntities(m[1].trim());
    }
    return undefined;
  };

  let title = metaContent("og:title") || metaName("twitter:title");
  if (!title) {
    const tm = slice.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (tm?.[1]) title = decodeHtmlEntities(tm[1].trim());
  }

  let description =
    metaContent("og:description") ||
    metaName("twitter:description") ||
    metaName("description");

  const imageUrls: string[] = [];
  const ogImg = slice.matchAll(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
  );
  for (const m of ogImg) {
    const u = m[1]?.trim();
    if (u && !imageUrls.includes(u)) imageUrls.push(decodeHtmlEntities(u));
  }
  const ogImgAlt = slice.matchAll(
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi,
  );
  for (const m of ogImgAlt) {
    const u = m[1]?.trim();
    if (u && !imageUrls.includes(u)) imageUrls.push(decodeHtmlEntities(u));
  }
  const tw = metaName("twitter:image");
  if (tw && !imageUrls.includes(tw)) imageUrls.unshift(tw);

  let warning: string | undefined;
  if (!imageUrls.length && /instagram\.com/i.test(slice)) {
    warning =
      "Instagram often hides preview images for anonymous fetches. Try a direct image link or upload from your gallery.";
  }

  return { title, description, imageUrls: imageUrls.slice(0, 6), warning };
}

function parseCookieValue(cookie: string, key: string): string | null {
  const re = new RegExp(`(?:^|;\\s*)${key}=([^;]+)`);
  const m = cookie.match(re);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function tryParseInstagramOwner(html: string): { username?: string; mediaId?: string } {
  const slice = html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html;
  // Best-effort: IG frequently changes these fields. Keep multiple patterns.
  const username =
    slice.match(/"owner"\s*:\s*{[^}]*"username"\s*:\s*"([^"]+)"/)?.[1] ??
    slice.match(/"username"\s*:\s*"([^"]+)"\s*,\s*"is_verified"/)?.[1] ??
    undefined;
  const mediaId =
    slice.match(/"media_id"\s*:\s*"(\d+)"/)?.[1] ??
    slice.match(/"mediaId"\s*:\s*"(\d+)"/)?.[1] ??
    slice.match(/"pk"\s*:\s*"(\d+)"/)?.[1] ??
    undefined;
  return { username, mediaId };
}

function extractInstagramShortcode(u: URL): string | null {
  const parts = u.pathname.split("/").filter(Boolean);
  // /p/{code}/ , /reel/{code}/ , /tv/{code}/
  if (parts.length >= 2 && (parts[0] === "p" || parts[0] === "reel" || parts[0] === "tv")) {
    return parts[1] || null;
  }
  return null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickOwnerCommentsFromGraphql(graphql: any): { ownerUsername?: string; ownerComments?: string[] } {
  const media = graphql?.shortcode_media;
  const ownerUsername = asString(media?.owner?.username) ?? undefined;
  const edges = media?.edge_media_to_parent_comment?.edges;
  const ownerComments: string[] = [];
  if (Array.isArray(edges) && ownerUsername) {
    for (const e of edges) {
      const n = e?.node;
      const u = asString(n?.owner?.username);
      const text = asString(n?.text);
      if (u && text && u.toLowerCase() === ownerUsername.toLowerCase()) ownerComments.push(text);
    }
  }
  return { ownerUsername, ownerComments };
}

async function fetchInstagramOwnerComments(opts: {
  pageUrl: URL;
  cookie: string | null;
  html: string;
}): Promise<{ ownerUsername?: string; ownerComments?: string[]; warning?: string }> {
  if (!opts.cookie) return {};
  const host = opts.pageUrl.hostname.toLowerCase();
  if (!/(\.|^)instagram\.com$/.test(host)) return {};

  // Prefer shortcode JSON endpoint (more stable than HTML parsing) when cookie is present.
  const shortcode = extractInstagramShortcode(opts.pageUrl);
  const csrf = parseCookieValue(opts.cookie, "csrftoken");
  const igHeaders: Record<string, string> = {
    Referer: opts.pageUrl.href,
    "X-Requested-With": "XMLHttpRequest",
    // Common web app id observed on instagram.com
    "X-IG-App-ID": "936619743392459",
  };
  if (csrf) igHeaders["X-CSRFToken"] = csrf;

  if (shortcode) {
    const jsonUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    try {
      const { bytes } = await fetchBytes(jsonUrl, "application/json,*/*;q=0.8", opts.cookie, igHeaders);
      const text = new TextDecoder().decode(bytes);
      const data = JSON.parse(text) as any;
      const graphql = data?.graphql ?? data?.items?.[0]?.graphql ?? data?.data ?? data;
      const picked = pickOwnerCommentsFromGraphql(graphql);
      if (picked.ownerComments && picked.ownerComments.length) return picked;
      // If endpoint works but no comments found, still return ownerUsername for debugging.
      return { ownerUsername: picked.ownerUsername, ownerComments: picked.ownerComments ?? [] };
    } catch {
      // fall back to media id path
    }
  }

  const { username, mediaId } = tryParseInstagramOwner(opts.html);
  if (!mediaId) {
    return { ownerUsername: username, ownerComments: [], warning: "Could not locate Instagram media id for comments." };
  }

  // Private-ish endpoint: works only if cookie is valid for the session.
  const apiUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true&permalink_enabled=false`;
  try {
    const csrf = parseCookieValue(opts.cookie, "csrftoken");
    const igHeaders: Record<string, string> = {
      Referer: opts.pageUrl.href,
      "X-Requested-With": "XMLHttpRequest",
      "X-IG-App-ID": "936619743392459",
    };
    if (csrf) igHeaders["X-CSRFToken"] = csrf;
    const { bytes } = await fetchBytes(apiUrl, "application/json,*/*;q=0.8", opts.cookie, igHeaders);
    const text = new TextDecoder().decode(bytes);
    const data = JSON.parse(text) as any;
    const comments = Array.isArray(data?.comments) ? data.comments : [];
    const ownerComments = comments
      .filter((c: any) => {
        const u = c?.user?.username;
        if (!u || typeof u !== "string") return false;
        if (!username) return false;
        return u.toLowerCase() === username.toLowerCase();
      })
      .map((c: any) => String(c?.text || "").trim())
      .filter((s: string) => s);

    return { ownerUsername: username, ownerComments };
  } catch {
    return {
      ownerUsername: username,
      ownerComments: [],
      warning: "Could not fetch Instagram comments with the provided cookie.",
    };
  }
}

async function tryEmbedImage(url: string): Promise<{ dataUrl: string; bytes: number } | null> {
  try {
    const abs = new URL(url).href;
    const { bytes, contentType } = await fetchBytes(abs, "image/*,*/*;q=0.8");
    if (!contentType.startsWith("image/")) return null;
    if (bytes.length > MAX_IMAGE_BYTES) return null;
    return { dataUrl: bytesToDataUrl(bytes, contentType), bytes: bytes.length };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    const cookie = normalizeCookie(body?.cookie);
    if (!rawUrl) return json({ ok: false, error: "url required" }, 400);

    const pageUrl = assertPublicHttpUrl(rawUrl);

    const first = await fetchBytes(
      pageUrl.href,
      "text/html,application/xhtml+xml,image/*,*/*;q=0.9",
      cookie,
    );
    const ct = first.contentType.toLowerCase();

    if (ct.startsWith("image/")) {
      if (first.bytes.length > MAX_IMAGE_BYTES) {
        return json({ ok: false, error: "Image too large (max 5MB)" }, 400);
      }
      const mime = ct.split(";")[0] || "image/jpeg";
      return json({
        ok: true,
        kind: "image",
        dataUrl: bytesToDataUrl(first.bytes, mime),
        bytes: first.bytes.length,
      });
    }

    const html = new TextDecoder().decode(first.bytes);
    const meta = parseHtmlMeta(html);
    const igExtra = await fetchInstagramOwnerComments({ pageUrl, cookie, html });

    let imageDataUrl: string | undefined;
    let imageBytes = 0;
    for (const imgUrl of meta.imageUrls) {
      try {
        const resolved = new URL(imgUrl, pageUrl.href).href;
        const embedded = await (async () => {
          try {
            const { bytes, contentType } = await fetchBytes(resolved, "image/*,*/*;q=0.8", cookie);
            if (!contentType.startsWith("image/")) return null;
            if (bytes.length > MAX_IMAGE_BYTES) return null;
            return { dataUrl: bytesToDataUrl(bytes, contentType), bytes: bytes.length };
          } catch {
            return null;
          }
        })();
        if (embedded) {
          imageDataUrl = embedded.dataUrl;
          imageBytes = embedded.bytes;
          break;
        }
      } catch {
        continue;
      }
    }

    return json({
      ok: true,
      kind: "page",
      url: pageUrl.href,
      title: meta.title,
      description: meta.description,
      imageUrls: meta.imageUrls,
      imageDataUrl,
      imageBytes,
      warning: meta.warning ?? igExtra.warning,
      ownerUsername: igExtra.ownerUsername,
      ownerComments: igExtra.ownerComments,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ ok: false, error: msg }, 400);
  }
});
