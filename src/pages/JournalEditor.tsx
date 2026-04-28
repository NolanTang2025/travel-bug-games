import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, ImagePlus, Loader2, Mic, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { emptyJournal, loadJournal, saveJournal, type JournalDraft } from "@/lib/journalStorage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRAVEL_LOCALES, getTravelLocale } from "@/data/travelLocales";
import { fetchLinkPreview } from "@/lib/fetchLink";
import { resizeDataUrl } from "@/lib/imageResize";
import {
  clearInstagramCookie,
  getInstagramCookie,
  isCookieStale,
  setInstagramCookie,
} from "@/lib/cookieVault";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 14;
const MAX_FILE = 5 * 1024 * 1024;

function readFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Staggered "page turning" reveal inside the opening spread */
function JournalBlock({
  step,
  children,
  className,
}: {
  step: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("journal-section-in", className)}
      style={{ animationDelay: `${420 + step * 78}ms` }}
    >
      {children}
    </div>
  );
}

export default function JournalEditor() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<JournalDraft>(() => loadJournal());
  const recRef = useRef<{ stop: () => void } | null>(null);
  const [listening, setListening] = useState(false);
  const [importLink, setImportLink] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [igCookieDraft, setIgCookieDraft] = useState(() => getInstagramCookie()?.cookie ?? "");
  const [showCookie, setShowCookie] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    saveJournal(draft);
  }, [draft]);

  const onPickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...draft.images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE) {
        toast.error("Image too large (max 5MB)");
        continue;
      }
      if (next.length >= MAX_IMAGES) break;
      try {
        next.push(await readFileDataUrl(file));
      } catch {
        toast.error(t("journalImageReadFail"));
      }
    }
    setDraft((d) => ({ ...d, images: next }));
  };

  const removeImage = (idx: number) => {
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== idx) }));
  };

  const runImportFromUrl = useCallback(async () => {
    const url = importLink.trim();
    if (!url) {
      toast.error(t("importFail"));
      return;
    }
    setImportBusy(true);
    try {
      const maybeCookie = getInstagramCookie()?.cookie ?? null;
      const res = await fetchLinkPreview(url, { cookie: maybeCookie });
      const shrink = async (dataUrl: string) => resizeDataUrl(dataUrl, 2200, 0.82);
      const dr = draftRef.current;

      if (res.kind === "image") {
        if (dr.images.length >= MAX_IMAGES) {
          toast.error(t("importAlbumFull"));
          return;
        }
        let dataUrl = await shrink(res.dataUrl);
        if (dataUrl.length > MAX_FILE * 2) {
          toast.error(t("journalImageTooLarge"));
          return;
        }
        setDraft({ ...dr, images: [...dr.images, dataUrl] });
        toast.success(t("importImageOk"));
        setImportLink("");
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
        if (newImage.length > MAX_FILE * 2) {
          toast.error(t("journalImageTooLarge"));
          newImage = undefined;
        }
      }

      const prevLen = dr.images.length;
      let images = [...dr.images];
      let narrative = dr.narrative;

      if (newImage) {
        if (images.length >= MAX_IMAGES) {
          toast.error(t("importAlbumFull"));
        } else {
          images.push(newImage);
        }
      }

      if (bits.length) {
        const block = bits.join("\n\n");
        narrative = narrative.trim() ? `${narrative.trim()}\n\n${block}` : block;
      }

      const addedImg = images.length > prevLen;

      setDraft({ ...dr, images, narrative });

      if (res.warning) toast.message(res.warning);
      if (addedImg) {
        toast.success(t("importPostOk"));
        setImportLink("");
      } else if (bits.length) {
        toast.success(t("importPostTextOnly"));
        setImportLink("");
      } else {
        toast.error(t("importFail"));
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : t("importFail"));
    } finally {
      setImportBusy(false);
    }
  }, [importLink, t]);

  const cookieSavedAt = getInstagramCookie()?.savedAt ?? null;
  const cookieStale = isCookieStale(cookieSavedAt, 7);

  const toggleListen = useCallback(() => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      toast.message(t("journalVoiceHint"));
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = getTravelLocale(draft.travelLocaleId || "cn").locale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i][0].transcript;
      }
      if (chunk) {
        setDraft((d) => ({
          ...d,
          narrative: (d.narrative ? `${d.narrative} ` : "") + chunk,
        }));
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [listening, t, draft.travelLocaleId]);

  const goBook = () => {
    saveJournal(draft);
    navigate("/journal/book");
  };

  const goGame = () => {
    if (!draft.images.length) {
      toast.error(t("journalNeedImage"));
      return;
    }
    saveJournal(draft);
    const albumNote =
      draft.images.length > 1 ? t("journalAlbumNote").replace("{{n}}", String(draft.images.length)) : "";
    const lines = [
      draft.narrative.trim(),
      draft.instagramUrl.trim() && `Instagram: ${draft.instagramUrl.trim()}`,
      draft.twitterUrl.trim() && `X/Twitter: ${draft.twitterUrl.trim()}`,
      albumNote,
    ].filter(Boolean) as string[];
    const hint = lines.join("\n\n");
    navigate("/games/ai-create", {
      state: {
        journalPhoto: draft.images[0],
        journalHint: hint,
        journalLocaleId: draft.travelLocaleId || "cn",
      },
    });
  };

  const reset = () => {
    setDraft(emptyJournal());
    saveJournal(emptyJournal());
  };

  const fieldBase =
    "rounded-xl border border-[hsl(220_14%_86%)] bg-white/60 shadow-[inset_0_2px_6px_hsl(220_20%_70%/0.06)] backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/35";

  return (
    <div className="journal-desk flex-1 flex flex-col min-h-[100dvh]">
      <div className="journal-perspective flex-1 flex flex-col px-3 py-8 sm:px-6">
        <div className="journal-magic-open mx-auto w-full max-w-xl flex-1 flex flex-col">
          <article className="journal-paper relative pt-10 pb-10 pl-11 pr-6 sm:pl-14 sm:pr-12 flex flex-col flex-1">
            <span className="journal-binding-holes" aria-hidden />

            {/* Holographic washi tape */}
            <div className="pointer-events-none absolute -top-2 left-8 right-8 flex justify-between gap-4 sm:left-12 sm:right-12">
              <div className="journal-washi flex-1 max-w-[38%] bg-gradient-to-r from-cyan-200/90 via-sky-100 to-blue-50/90" />
              <div className="journal-washi flex-1 max-w-[32%] bg-gradient-to-r from-violet-200/90 to-fuchsia-50/90" />
              <div className="journal-washi hidden sm:block flex-1 max-w-[26%] bg-gradient-to-r from-amber-200/80 to-orange-50/70" />
            </div>

            <JournalBlock step={0}>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 hover:text-primary transition-colors font-data"
              >
                <ArrowLeft className="h-4 w-4" /> {t("navHome")}
              </Link>
              <h1 className="font-display text-[2.35rem] sm:text-[2.75rem] leading-none mt-5 text-foreground font-bold">
                {t("navJournal")}
              </h1>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed font-data">
                {t("journalStepMedia")}
              </p>
            </JournalBlock>

            <JournalBlock step={1} className="mt-9">
              <label className="text-sm font-bold text-foreground block mb-1 font-data">
                {t("journalTravelLocationLabel")}
              </label>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed font-data">{t("journalTravelLocationHelp")}</p>
              <Select
                value={draft.travelLocaleId || "cn"}
                onValueChange={(v) => setDraft((d) => ({ ...d, travelLocaleId: v }))}
              >
                <SelectTrigger className={cn(fieldBase, "w-full h-11")}>
                  <SelectValue />
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
            </JournalBlock>

            <JournalBlock step={2} className="mt-9 space-y-3">
              <label className="text-sm font-bold text-foreground font-data">{t("importUrlLabel")}</label>
              <p className="text-xs text-muted-foreground font-data">{t("importUrlHelp")}</p>
              <div className="rounded-2xl border border-white/55 bg-white/40 p-3 backdrop-blur-md">
                <button
                  type="button"
                  className="text-xs font-bold text-primary underline underline-offset-2 font-data"
                  onClick={() => setShowCookie((v) => !v)}
                >
                  {t("cookieAdvancedToggle")}
                </button>
                {showCookie && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-data">
                      {t("cookieHelp")}
                      {cookieStale && (
                        <span className="ml-2 text-destructive font-semibold">{t("cookieStale")}</span>
                      )}
                    </p>
                    <Textarea
                      value={igCookieDraft}
                      onChange={(e) => setIgCookieDraft(e.target.value)}
                      placeholder={t("cookiePlaceholder")}
                      className={cn(fieldBase, "min-h-[96px] text-xs font-mono")}
                    />
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl bg-white/60 border border-[hsl(220_14%_86%)]"
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
                        className="rounded-xl border-[hsl(220_14%_86%)] bg-white/50"
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
                <Input
                  value={importLink}
                  onChange={(e) => setImportLink(e.target.value)}
                  placeholder={t("importUrlPlaceholder")}
                  className={cn(fieldBase, "flex-1")}
                  disabled={importBusy}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runImportFromUrl();
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl shrink-0 sm:w-40 bg-white/60 border border-[hsl(220_14%_86%)] font-data font-bold"
                  disabled={importBusy || !importLink.trim()}
                  onClick={() => void runImportFromUrl()}
                >
                  {importBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("importUrlLoading")}
                    </>
                  ) : (
                    t("importUrlButton")
                  )}
                </Button>
              </div>
            </JournalBlock>

            <JournalBlock step={3} className="mt-9 space-y-3">
              <label className="text-sm font-bold text-foreground font-data">{t("journalIgPlaceholder")}</label>
              <Input
                value={draft.instagramUrl}
                onChange={(e) => setDraft((d) => ({ ...d, instagramUrl: e.target.value }))}
                placeholder="https://www.instagram.com/p/..."
                className={fieldBase}
              />
              <label className="text-sm font-bold text-foreground pt-2 block font-data">{t("journalTwPlaceholder")}</label>
              <Input
                value={draft.twitterUrl}
                onChange={(e) => setDraft((d) => ({ ...d, twitterUrl: e.target.value }))}
                placeholder="https://x.com/..."
                className={fieldBase}
              />
            </JournalBlock>

            <JournalBlock step={4} className="mt-9">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground font-data">{t("journalStepMedia")}</span>
                <span className="text-xs font-data text-muted-foreground">
                  {draft.images.length}/{MAX_IMAGES}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 font-data">{t("journalUploadHint")}</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[hsl(220_14%_82%)] rounded-2xl p-8 cursor-pointer bg-white/50 hover:bg-white/70 transition-colors shadow-inner backdrop-blur-sm">
                <ImagePlus className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <span className="text-sm font-data font-bold text-foreground/80">+ JPEG / PNG</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickImages(e.target.files)}
                />
              </label>
              {draft.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                  {draft.images.map((src, i) => (
                    <div
                      key={i}
                      className={cn(
                        "polaroid-frame relative aspect-square group",
                        i % 3 === 0 && "-rotate-1",
                        i % 3 === 1 && "rotate-2",
                        i % 3 === 2 && "-rotate-2",
                      )}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold font-data transition-opacity"
                        onClick={() => removeImage(i)}
                      >
                        {t("journalRemove")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </JournalBlock>

            <JournalBlock step={5} className="mt-10 flex-1 flex flex-col">
              <label className="text-sm font-bold text-foreground mb-2 font-data">{t("journalNarrativeLabel")}</label>
              <Textarea
                value={draft.narrative}
                onChange={(e) => setDraft((d) => ({ ...d, narrative: e.target.value }))}
                placeholder={t("journalNarrativePlaceholder")}
                className={cn(
                  "journal-ruled-area min-h-[200px] flex-1 text-base font-hand text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/35",
                )}
              />
              <p className="text-xs text-muted-foreground mt-2 font-data">{t("journalVoiceHint")}</p>
              <Button
                type="button"
                variant={listening ? "destructive" : "secondary"}
                className="mt-3 self-start gap-2 rounded-full font-data font-bold border border-[hsl(220_14%_86%)] bg-white/60"
                onClick={toggleListen}
              >
                {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? t("journalVoiceStop") : t("journalVoiceStart")}
              </Button>
            </JournalBlock>

            <JournalBlock step={6} className="mt-10 flex flex-col sm:flex-row gap-3 pb-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl h-12 border-[hsl(220_14%_86%)] bg-white/60 font-data font-bold shadow-sm hover:bg-white/80"
                onClick={goBook}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("journalPreviewBook")}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-2xl h-12 font-bold font-data text-white shadow-md hover:shadow-glow-ice hover:-translate-y-0.5 transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(200 90% 52%), hsl(210 85% 45%))",
                }}
                onClick={goGame}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t("journalTurnGame")}
              </Button>
            </JournalBlock>

            <JournalBlock step={7} className="mt-6 flex justify-center">
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 font-data hover:text-foreground transition-colors"
                onClick={reset}
              >
                {t("journalClearDraft")}
              </button>
            </JournalBlock>
          </article>
        </div>
      </div>
    </div>
  );
}
