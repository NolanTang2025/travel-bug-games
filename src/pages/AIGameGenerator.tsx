import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Loader2,
  Check,
  Globe2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsError } from "@/lib/edgeFunctionError";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_TRAVEL_LOCALE_ID,
  TRAVEL_LOCALES,
  getTravelLocale,
} from "@/data/travelLocales";
import { useLocale } from "@/context/LocaleContext";
import { cn } from "@/lib/utils";
import { detectJournalLocale } from "@/lib/langDetect";
import { saveCurrentAiGame } from "@/lib/gameLibrary";
import { fetchLinkPreview } from "@/lib/fetchLink";
import { resizeDataUrl } from "@/lib/imageResize";
import {
  clearInstagramCookie,
  getInstagramCookie,
  isCookieStale,
  setInstagramCookie,
} from "@/lib/cookieVault";
import {
  AI_FORGE_FALLBACK_THEME,
  extractPhotoTheme,
  type PhotoTheme,
} from "@/lib/extractPhotoTheme";

type JournalNavState = { journalPhoto?: string; journalHint?: string; journalLocaleId?: string };

const MAX_PHOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;

function readFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const AIGameGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const seededFromJournal = useRef(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [localeId, setLocaleId] = useState(DEFAULT_TRAVEL_LOCALE_ID);
  const [loading, setLoading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [igCookieDraft, setIgCookieDraft] = useState(() => getInstagramCookie()?.cookie ?? "");
  const [showCookie, setShowCookie] = useState(false);
  const [photoTheme, setPhotoTheme] = useState<PhotoTheme | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    if (seededFromJournal.current) return;
    const st = location.state as JournalNavState | null;
    if (st?.journalPhoto) {
      setPhotos([st.journalPhoto]);
      if (st.journalHint) setHint(st.journalHint);
      if (st.journalLocaleId) setLocaleId(st.journalLocaleId);
      seededFromJournal.current = true;
    }
  }, [location.state]);

  const primaryPhoto = photos[0] ?? null;

  useEffect(() => {
    if (!primaryPhoto) {
      setPhotoTheme(null);
      return;
    }
    let cancelled = false;
    void extractPhotoTheme(primaryPhoto).then((theme) => {
      if (!cancelled) setPhotoTheme(theme);
    });
    return () => {
      cancelled = true;
    };
  }, [primaryPhoto]);

  const theme = photoTheme ?? AI_FORGE_FALLBACK_THEME;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Image only");
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Max 5MB per image");
        continue;
      }
      if (next.length >= MAX_PHOTOS) break;
      try {
        next.push(await readFileDataUrl(file));
      } catch {
        toast.error("Could not read file");
      }
    }
    setPhotos(next);
  };

  const makePrimary = (index: number) => {
    if (index <= 0) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      copy.unshift(chosen);
      return copy;
    });
  };

  const runImportUrl = useCallback(async () => {
    const url = pasteUrl.trim();
    if (!url) {
      toast.error(t("importFail"));
      return;
    }
    setPasteBusy(true);
    try {
      const maybeCookie = getInstagramCookie()?.cookie ?? null;
      const res = await fetchLinkPreview(url, { cookie: maybeCookie });
      const shrink = async (dataUrl: string) => resizeDataUrl(dataUrl, 2200, 0.82);
      const cur = photosRef.current;

      if (res.kind === "image") {
        if (cur.length >= MAX_PHOTOS) {
          toast.error(t("importAlbumFull"));
          return;
        }
        let dataUrl = await shrink(res.dataUrl);
        if (dataUrl.length > MAX_BYTES * 2) {
          toast.error(t("journalImageTooLarge"));
          return;
        }
        setPhotos([...cur, dataUrl]);
        toast.success(t("importImageOk"));
        setPasteUrl("");
        return;
      }

      const bits = [res.title, res.description].filter((x): x is string => Boolean(x?.trim()));
      const ownerComments = Array.isArray((res as any).ownerComments) ? ((res as any).ownerComments as string[]) : [];
      if (ownerComments.length) {
        bits.push(`Author comments:\n${ownerComments.map((c) => `- ${c}`).join("\n")}`);
      }
      let newImage: string | undefined;
      if (res.imageDataUrl) {
        newImage = await shrink(res.imageDataUrl);
        if (newImage.length > MAX_BYTES * 2) {
          toast.error(t("journalImageTooLarge"));
          newImage = undefined;
        }
      }

      const prevLen = cur.length;
      let next = [...cur];
      if (newImage) {
        if (next.length >= MAX_PHOTOS) {
          toast.error(t("importAlbumFull"));
        } else {
          next.push(newImage);
        }
      }

      setPhotos(next);

      if (bits.length) {
        setHint((h) => {
          const block = bits.join("\n\n");
          const merged = h.trim() ? `${h.trim()}\n\n${block}` : block;
          return merged.slice(0, 800);
        });
      }

      if (res.warning) toast.message(res.warning);

      const addedImg = next.length > prevLen;
      if (addedImg) {
        toast.success(t("importPostOk"));
        setPasteUrl("");
      } else if (bits.length) {
        toast.success(t("importPostTextOnly"));
        setPasteUrl("");
      } else {
        toast.error(t("importFail"));
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : t("importFail"));
    } finally {
      setPasteBusy(false);
    }
  }, [pasteUrl, t]);

  const cookieSavedAt = getInstagramCookie()?.savedAt ?? null;
  const cookieStale = isCookieStale(cookieSavedAt, 7);

  const generate = async () => {
    if (!primaryPhoto) return toast.error("Upload a travel photo first");
    setLoading(true);
    try {
      const loc = getTravelLocale(localeId);
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          photo: primaryPhoto,
          hint:
            photos.length > 1
              ? `${hint}\n\n[${photos.length} trip photos uploaded; AI uses the cover image.]`.slice(
                  0,
                  800,
                )
              : hint,
          locale: loc.locale,
          languageInstruction: loc.promptLang,
        },
      });
      if (error) throw new Error(await messageFromFunctionsError(error));
      if (data?.error) throw new Error(data.error);
      const journalText = `${hint || ""}`.slice(0, 2000);
      const journalTextLocale = detectJournalLocale(journalText);
      const shared = {
        photo: primaryPhoto,
        photos,
        journalTextLocale,
        locale: data?.locale as string | undefined,
      };
      const payload =
        data?.blueprint != null
          ? { schemaVersion: 2 as const, blueprint: data.blueprint, ...shared }
          : { ...(data as Record<string, unknown>), ...shared };
      sessionStorage.setItem("ai_game", JSON.stringify(payload));
      void saveCurrentAiGame();
      navigate("/games/ai-play");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to generate";
      if (msg.includes("Rate")) toast.error("Too many requests — try again in a moment");
      else if (msg.includes("Payment")) toast.error("AI credits exhausted. Add funds in Workspace settings.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /** After cover exists, emphasize the forge step (hint stays optional). */
  const stepFocusIdx = !primaryPhoto ? 0 : 2;

  const flowSteps = [
    {
      key: "photo",
      label: "封面照片",
      sub: "Cover",
      Icon: Upload,
      done: Boolean(primaryPhoto),
      active: stepFocusIdx === 0,
    },
    {
      key: "context",
      label: "行程语境",
      sub: "Locale & note",
      Icon: Globe2,
      done: Boolean(primaryPhoto),
      active: stepFocusIdx === 1,
    },
    {
      key: "forge",
      label: "生成游戏",
      sub: "Forge",
      Icon: Wand2,
      done: false,
      active: stepFocusIdx === 2,
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-[background] duration-700 ease-out"
      style={{
        background: theme.meshGradient,
        ["--photo-accent" as string]: theme.accentHsl,
        ["--ring" as string]: theme.accentHsl,
      }}
    >
      {primaryPhoto && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-[-8%] opacity-[0.12] scale-105 motion-safe:transition-opacity duration-700"
            style={{
              backgroundImage: `url(${primaryPhoto})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(56px) saturate(1.12)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/65" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-xl px-4 pt-8 pb-16 sm:px-6">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "mb-8 gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-foreground shadow-sm backdrop-blur-xl",
              "transition-all hover:bg-white/65 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        <header className="mb-8 text-center sm:text-left">
          <div className="mx-auto inline-flex sm:mx-0 items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-1.5 text-sm font-semibold text-foreground/90 shadow-sm backdrop-blur-xl font-data">
            <Sparkles className="h-4 w-4 text-[hsl(var(--photo-accent))]" />
            <span className="tracking-wide">AI Game Forge</span>
          </div>
          <h1 className="mt-5 font-black tracking-tight text-foreground text-4xl md:text-[2.75rem] leading-[1.1] font-display">
            Drop a photo.
            <br />
            <span className="text-[hsl(var(--photo-accent))]">Get a game.</span>
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground text-[0.95rem] leading-relaxed">
            AI reads your travel snapshot and shapes a playable mini-game — this page picks up colors from your cover
            photo so the studio feels like part of the trip.
          </p>
        </header>

        {/* Flow steps */}
        <div className="glass-panel relative mb-8 overflow-hidden p-4 sm:p-5 glass-shimmer">
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-2">
            {flowSteps.map((step, i) => (
              <li
                key={step.key}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300",
                  step.done && !step.active
                    ? "border-emerald-300/50 bg-emerald-50/50 text-foreground"
                    : step.active
                      ? "border-[hsl(var(--photo-accent)/0.45)] bg-white/70 shadow-md ring-2 ring-[hsl(var(--photo-accent)/0.25)]"
                      : "border-white/55 bg-white/35 text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                    step.done && !step.active
                      ? "border-emerald-400/60 bg-emerald-100/80 text-emerald-700"
                      : "border-white/70 bg-white/70 text-[hsl(var(--photo-accent))]",
                  )}
                >
                  {step.done && !step.active ? <Check className="h-5 w-5" /> : <step.Icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground font-data">
                      Step {i + 1}
                    </span>
                  </div>
                  <p className="font-semibold leading-tight">{step.label}</p>
                  <p className="text-xs text-muted-foreground font-data">{step.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Import URL */}
        <section className="glass-panel-strong mb-6 p-6 sm:p-7">
          <div className="space-y-2 mb-4">
            <label className="text-sm font-semibold text-foreground block">{t("importUrlLabel")}</label>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("importUrlHelp")}</p>
            <div className="rounded-2xl border border-white/55 bg-white/35 p-3 backdrop-blur-md">
              <button
                type="button"
                className="text-xs font-semibold text-[hsl(var(--photo-accent))] underline underline-offset-2 font-data"
                onClick={() => setShowCookie((v) => !v)}
              >
                {t("cookieAdvancedToggle")}
              </button>
              {showCookie && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed font-data">
                    {t("cookieHelp")}
                    {cookieStale && (
                      <span className="ml-2 text-destructive font-semibold">{t("cookieStale")}</span>
                    )}
                  </p>
                  <textarea
                    value={igCookieDraft}
                    onChange={(e) => setIgCookieDraft(e.target.value)}
                    placeholder={t("cookiePlaceholder")}
                    className="glass-input w-full min-h-[96px] p-3 text-xs font-mono"
                  />
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl border-white/60 bg-white/55 backdrop-blur-sm"
                      onClick={() => {
                        const v = igCookieDraft.trim();
                        if (!v) {
                          clearInstagramCookie();
                          toast.success(t("cookieCleared"));
                          return;
                        }
                        setInstagramCookie(v);
                        toast.success(t("cookieSaved"));
                      }}
                    >
                      {t("cookieSave")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-white/60 bg-white/30 backdrop-blur-sm"
                      onClick={() => {
                        clearInstagramCookie();
                        setIgCookieDraft("");
                        toast.success(t("cookieCleared"));
                      }}
                    >
                      {t("cookieClear")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="url"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder={t("importUrlPlaceholder")}
                disabled={pasteBusy}
                className="glass-input flex-1 px-3 py-2.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runImportUrl();
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl shrink-0 border-white/60 bg-white/55 backdrop-blur-sm sm:w-40"
                disabled={pasteBusy || !pasteUrl.trim()}
                onClick={() => void runImportUrl()}
              >
                {pasteBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("importUrlLoading")}
                  </>
                ) : (
                  t("importUrlButton")
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3 font-data">{t("aiUploadHint")}</p>
          <label className="group block cursor-pointer">
            <div
              className={cn(
                "relative aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300",
                primaryPhoto
                  ? "border-[hsl(var(--photo-accent)/0.55)] shadow-[0_12px_40px_-16px_hsl(var(--photo-accent)/0.35)]"
                  : "border-white/65 bg-white/30 hover:border-[hsl(var(--photo-accent)/0.45)] hover:bg-white/45 hover:shadow-md",
              )}
            >
              {primaryPhoto ? (
                <img src={primaryPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--photo-accent))]" />
                  <p className="font-semibold text-foreground font-display">点击上传旅行照片</p>
                  <p className="text-xs mt-1 font-data">JPG / PNG，每张 ≤ 5MB · 最多 {MAX_PHOTOS} 张</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[2px]" />
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <button
                  key={`${i}-${src.slice(0, 24)}`}
                  type="button"
                  onClick={() => makePrimary(i)}
                  className={cn(
                    "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--photo-accent)/0.45)]",
                    i === 0
                      ? "border-[hsl(var(--photo-accent))] shadow-md scale-[1.02]"
                      : "border-white/50 opacity-90 hover:opacity-100 hover:scale-[1.02]",
                  )}
                  title={i === 0 ? "Cover for AI" : "Tap to use as cover"}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Locale & hint */}
        <section className="glass-panel mb-6 p-6 sm:p-7">
          <div className="mt-0">
            <label className="text-sm font-semibold text-foreground mb-2 block font-display">
              照片拍摄地点 / Trip location
            </label>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed font-data">
              游戏标题、玩法说明与界面按钮会使用该地点对应的官方书面语。
            </p>
            <Select value={localeId} onValueChange={setLocaleId}>
              <SelectTrigger className="glass-input w-full rounded-xl h-11">
                <SelectValue placeholder="选择地点" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(360px,70vh)]">
                {TRAVEL_LOCALES.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    <span className="font-medium">{row.label}</span>
                    {row.hint && (
                      <span className="text-muted-foreground ml-2 text-xs">· {row.hint}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-foreground mb-2 block font-display">
              Anything to know about this trip?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, 800))}
              placeholder="e.g., I got stuck in the rain in Kyoto and ducked into 12 ramen shops..."
              className="glass-input w-full p-3 text-sm resize-none h-28"
            />
          </div>
        </section>

        <div className="glass-panel-strong relative overflow-hidden p-2">
          <Button
            onClick={() => void generate()}
            disabled={loading || !primaryPhoto}
            size="lg"
            className={cn(
              "w-full h-14 rounded-[1.35rem] font-bold text-white border-0 shadow-lg transition-all font-display",
              "hover:brightness-[1.03] hover:shadow-xl hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg",
            )}
            style={{ background: theme.ctaGradient }}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> AI is dreaming…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" /> Generate my game
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIGameGenerator;
