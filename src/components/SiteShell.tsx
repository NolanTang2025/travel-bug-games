import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/context/LocaleContext";
import type { AppLocale } from "@/i18n/translations";
import { usePreviewDevice } from "@/context/PreviewDeviceContext";
import { cn } from "@/lib/utils";

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
};

export function SiteShell({ children }: { children: ReactNode }) {
  const { locale, setLocale, t } = useLocale();
  const { mode, setMode } = usePreviewDevice();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/[0.92] backdrop-blur-xl shadow-[var(--elev-nav)] supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <span className="font-bold text-sm sm:text-base truncate">{t("brand")}</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm font-semibold text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t("navHome")}
            </Link>
            <Link to="/journal" className="hover:text-foreground transition-colors">
              {t("navJournal")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <Button
                type="button"
                variant={mode === "full" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setMode("full")}
                aria-pressed={mode === "full"}
              >
                <Monitor className="h-4 w-4 mr-1" />
                <span className="sr-only md:not-sr-only md:inline">{t("previewWeb")}</span>
              </Button>
              <Button
                type="button"
                variant={mode === "mobile-frame" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setMode("mobile-frame")}
                aria-pressed={mode === "mobile-frame"}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                <span className="sr-only md:not-sr-only md:inline">{t("previewMobile")}</span>
              </Button>
            </div>

            <label className="sr-only" htmlFor="locale-select">
              {t("langLabel")}
            </label>
            <Select value={locale} onValueChange={(v) => setLocale(v as AppLocale)}>
              <SelectTrigger id="locale-select" className="h-9 w-[130px] text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(localeLabels) as AppLocale[]).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {localeLabels[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <nav className="sm:hidden flex border-t border-border/40 divide-x divide-border/40 bg-muted/20">
          <Link
            to="/"
            className="flex-1 text-center py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/50"
          >
            {t("navHome")}
          </Link>
          <Link
            to="/journal"
            className="flex-1 text-center py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/50"
          >
            {t("navJournal")}
          </Link>
        </nav>
      </header>

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          mode === "mobile-frame" && "items-center justify-start bg-muted/35 py-4 px-2 sm:px-4",
        )}
      >
        <div
          className={cn(
            mode === "mobile-frame"
              ? "w-full max-w-[420px] min-h-[min(100dvh,880px)] rounded-[2rem] border-[10px] border-foreground/10 shadow-2xl bg-background overflow-hidden flex flex-col"
              : "w-full flex-1 flex flex-col min-h-0",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
