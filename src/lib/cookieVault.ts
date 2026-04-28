const IG_COOKIE_KEY = "travel_memory_cookie_instagram_v1";
const IG_COOKIE_SAVED_AT_KEY = "travel_memory_cookie_instagram_saved_at_v1";

export function getInstagramCookie(): { cookie: string; savedAt: string | null } | null {
  const cookie = localStorage.getItem(IG_COOKIE_KEY) || "";
  if (!cookie.trim()) return null;
  return { cookie, savedAt: localStorage.getItem(IG_COOKIE_SAVED_AT_KEY) };
}

export function setInstagramCookie(cookie: string) {
  localStorage.setItem(IG_COOKIE_KEY, cookie);
  localStorage.setItem(IG_COOKIE_SAVED_AT_KEY, new Date().toISOString());
}

export function clearInstagramCookie() {
  localStorage.removeItem(IG_COOKIE_KEY);
  localStorage.removeItem(IG_COOKIE_SAVED_AT_KEY);
}

export function isCookieStale(savedAtIso: string | null, staleDays = 7): boolean {
  if (!savedAtIso) return true;
  const ts = Date.parse(savedAtIso);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts > staleDays * 24 * 60 * 60 * 1000;
}

