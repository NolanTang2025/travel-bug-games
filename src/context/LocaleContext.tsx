import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppLocale, TranslationKey } from "@/i18n/translations";
import { translate } from "@/i18n/translations";
import { browserLocaleFallback, countryToLocale, fetchCountryFromIp } from "@/lib/ipGeo";

const STORAGE_KEY = "travel_memory_locale";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: TranslationKey) => string;
  geoReady: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
      if (s && ["en", "zh-CN", "ja", "ko", "zh-TW"].includes(s)) return s;
    } catch {
      /* ignore */
    }
    return browserLocaleFallback();
  });
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setGeoReady(true);
          return;
        }
        const cc = await fetchCountryFromIp();
        if (cancelled) return;
        if (!localStorage.getItem(STORAGE_KEY)) {
          setLocaleState(countryToLocale(cc));
        }
      } finally {
        if (!cancelled) setGeoReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, geoReady }),
    [locale, setLocale, t, geoReady],
  );

  useEffect(() => {
    const map: Record<AppLocale, string> = {
      en: "en",
      "zh-CN": "zh-Hans",
      "zh-TW": "zh-Hant",
      ja: "ja",
      ko: "ko",
    };
    document.documentElement.lang = map[locale] ?? "en";
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
