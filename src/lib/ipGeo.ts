import type { AppLocale } from "@/i18n/translations";

/** Map ISO 3166-1 alpha-2 country code → UI locale */
export function countryToLocale(country: string | undefined): AppLocale {
  const c = (country || "").toUpperCase();
  if (c === "CN") return "zh-CN";
  if (c === "TW" || c === "HK" || c === "MO") return "zh-TW";
  if (c === "JP") return "ja";
  if (c === "KR") return "ko";
  if (["US", "GB", "AU", "NZ", "CA", "IE", "SG", "IN", "PH", "MY"].includes(c)) return "en";
  if (["FR", "BE", "CH"].includes(c)) return "en"; // could be fr — keep en for incomplete fr pack
  if (["DE", "AT"].includes(c)) return "en";
  return "en";
}

export function browserLocaleFallback(): AppLocale {
  const nav = navigator.language || "en";
  if (nav.startsWith("zh-CN") || nav === "zh") return "zh-CN";
  if (nav.startsWith("zh-TW") || nav.startsWith("zh-HK")) return "zh-TW";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("ko")) return "ko";
  return "en";
}

export async function fetchCountryFromIp(): Promise<string | undefined> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4500) });
    if (!res.ok) throw new Error("ipapi");
    const data = (await res.json()) as { country_code?: string; error?: boolean };
    if (data.error) throw new Error("ipapi error");
    return data.country_code;
  } catch {
    try {
      const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4500) });
      if (!res.ok) throw new Error("ipwho");
      const data = (await res.json()) as { country_code?: string; success?: boolean };
      if (data.success === false) throw new Error("ipwho fail");
      return data.country_code;
    } catch {
      return undefined;
    }
  }
}
