import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardPaste,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GameGeneratingOverlay } from "@/components/GameGeneratingOverlay";
import { HeaderUserChip } from "@/components/HeaderUserChip";
import { SignInGateNote } from "@/components/SignInGateNote";
import { useAuth } from "@/hooks/useAuth";
import { writeAiGameSession } from "@/lib/aiGameSession";
import { BRAND_NAME } from "@/lib/brand";
import {
  clearPendingGenerate,
  getPendingGenerate,
  loadPlayUrlDraft,
  saveGeneratedGame,
  savePlayUrlDraft,
  setPendingGenerate,
  setLoginReturn,
} from "@/lib/creativeStorage";
import { PlayDanmaku } from "@/components/PlayDanmaku";
import { FeatureBetaBanner } from "@/components/FeatureBetaBanner";
import { compressImageForAi } from "@/lib/compressImageForAi";
import { extractSocialUrl } from "@/lib/extractSocialUrl";
import { pickTemplateFromHint } from "@/lib/pickTemplateFromHint";
import type { GameTemplateId } from "@/games/templates/types";

const MARQUEE = [
  "★ PASTE · PRESS · PLAY",
  "✦ INSTAGRAM → MINI GAME",
  "◈ REDNOTE → STORY CAPTION",
  "✸ ~15 SECONDS",
  "❖ MNEMO PRESS",
] as const;

const FLOW_STEPS = [
  {
    n: "01",
    title: "Copy link",
    body: "Share → Copy link on the post",
    tone: "bg-riso-cyan text-riso-ink rotate--2",
  },
  {
    n: "02",
    title: "Paste here",
    body: "Drop the URL in the ticket →",
    tone: "bg-riso-yellow text-riso-ink rotate-1",
  },
  {
    n: "03",
    title: "Play & share",
    body: "Game + caption for Story",
    tone: "bg-riso-pink text-background rotate--1",
  },
] as const;

function SpotSticker({
  label,
  tone,
  rotate = "rotate--2",
}: {
  label: string;
  tone: "pink" | "yellow" | "cyan" | "violet";
  rotate?: string;
}) {
  const bg = {
    pink: "bg-riso-pink text-background",
    yellow: "bg-riso-yellow text-riso-ink",
    cyan: "bg-riso-cyan text-riso-ink",
    violet: "bg-riso-violet text-background",
  }[tone];
  return (
    <span
      className={`sticker-sm inline-block rounded-full px-3 py-1 font-display uppercase text-[10px] tracking-[0.2em] ${bg} ${rotate}`}
    >
      {label}
    </span>
  );
}

const OUTCOMES = [
  "Playable mini game from the post",
  "Caption ready for TikTok / Reels / Story",
  "Saved to your Journal when signed in",
] as const;

const InstagramPlay = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const [url, setUrl] = useState(() => loadPlayUrlDraft());
  const [loading, setLoading] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<GameTemplateId | undefined>();
  const [previewPhoto, setPreviewPhoto] = useState<string>();
  const [overlayHint, setOverlayHint] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const autoStarted = useRef(false);
  const pendingScreenshotFile = useRef<File | null>(null);
  const pendingGenerateRan = useRef(false);

  const goPlay = useCallback((payload: Record<string, unknown>, source: string) => {
    writeAiGameSession(payload);
    sessionStorage.setItem("ai_game_source", source);
    const photos = Array.isArray(payload.photos)
      ? (payload.photos as string[]).filter((p) => typeof p === "string")
      : typeof payload.photo === "string"
        ? [payload.photo]
        : [];
    const hint = typeof payload.hint === "string" ? payload.hint : "";
    const saved = saveGeneratedGame({
      hint,
      photos,
      source: source as "instagram" | "xiaohongshu" | "screenshot",
      payload,
    });
    if (saved) toast.message("Saved to this device");
    const communityGameId =
      typeof payload.communityGameId === "string" ? payload.communityGameId : undefined;
    navigate(gamePlayPath(communityGameId), { state: { reload: Date.now() } });
  }, [navigate]);

  const requireAuth = useCallback(
    (kind: "play-link" | "play-screenshot", file?: File) => {
      if (user) return true;
      savePlayUrlDraft(url);
      setPendingGenerate(kind);
      if (file) pendingScreenshotFile.current = file;
      setLoginReturn("/play");
      toast.message("Sign in first — link saved on this device");
      navigate("/login", { state: { from: "/play" } });
      return false;
    },
    [navigate, url, user],
  );

  const runFromLink = useCallback(async (rawUrl: string) => {
    if (!requireAuth("play-link")) return;
    const found = extractSocialUrl(rawUrl) ?? (rawUrl.trim().includes("instagram.com") || rawUrl.includes("xiaohongshu.com") || rawUrl.includes("xhslink")
      ? { url: rawUrl.trim(), platform: rawUrl.includes("instagram") ? "instagram" as const : "xiaohongshu" as const }
      : null);

    if (!found) {
      toast.error("Paste an Instagram or RedNote post link");
      return;
    }

    setLoading(true);
    setGenDone(false);
    setSuggestedTemplateId(undefined);
    setPreviewPhoto(undefined);
    setOverlayHint(found.platform === "xiaohongshu" ? "RedNote → mini game" : "Instagram → mini game");

    try {
      const { data, error } = await supabase.functions.invoke("social-to-game", {
        body: { url: found.url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const hint = typeof data.hint === "string" ? data.hint : "";
      setSuggestedTemplateId(pickTemplateFromHint(hint));
      if (typeof data.photo === "string") setPreviewPhoto(data.photo);

      setGenDone(true);
      await new Promise((r) => setTimeout(r, 400));

      goPlay({
        ...data,
        source: data.source ?? found.platform,
        socialUrl: data.socialUrl ?? found.url,
      }, data.source ?? found.platform);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setGenDone(false);
      setSuggestedTemplateId(undefined);
      setOverlayHint(undefined);
    }
  }, [goPlay, requireAuth]);

  const runFromScreenshot = useCallback(async (file: File) => {
    if (!requireAuth("play-screenshot", file)) return;
    setLoading(true);
    setGenDone(false);
    setOverlayHint("Screenshot → mini game");

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });

      const compressed = await compressImageForAi(dataUrl);
      setPreviewPhoto(dataUrl);
      const hint = url.trim() || "RedNote travel note";
      const suggested = pickTemplateFromHint(hint);
      setSuggestedTemplateId(suggested);

      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          photos: [compressed],
          photo: compressed,
          hint,
          suggestedTemplateId: suggested,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGenDone(true);
      await new Promise((r) => setTimeout(r, 400));

      goPlay({
        ...data,
        photos: [dataUrl],
        photo: dataUrl,
        hint,
        source: "screenshot",
      }, "screenshot");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setGenDone(false);
      setSuggestedTemplateId(undefined);
      setOverlayHint(undefined);
    }
  }, [goPlay, requireAuth, url]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (url.trim()) savePlayUrlDraft(url);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [url]);

  useEffect(() => {
    if (authLoading || !user || pendingGenerateRan.current || loading) return;
    const pending = getPendingGenerate();
    if (!pending || (pending !== "play-link" && pending !== "play-screenshot")) return;
    pendingGenerateRan.current = true;
    clearPendingGenerate();
    if (pending === "play-link" && url.trim()) {
      void runFromLink(url);
      return;
    }
    if (pending === "play-screenshot") {
      if (pendingScreenshotFile.current) {
        const file = pendingScreenshotFile.current;
        pendingScreenshotFile.current = null;
        void runFromScreenshot(file);
      } else {
        toast.message("Re-upload the screenshot to continue");
      }
    }
  }, [authLoading, user, loading, url, runFromLink, runFromScreenshot]);

  useEffect(() => {
    const fromQuery = params.get("url") ?? params.get("ig") ?? params.get("xhs");
    if (!fromQuery || autoStarted.current || authLoading) return;

    if (!user) {
      autoStarted.current = true;
      setUrl(fromQuery);
      savePlayUrlDraft(fromQuery);
      setPendingGenerate("play-link");
      setLoginReturn(`/play?url=${encodeURIComponent(fromQuery)}`);
      toast.message("Sign in to generate a game");
      navigate("/login", { state: { from: "/play" } });
      return;
    }

    autoStarted.current = true;
    setUrl(fromQuery);
    void runFromLink(fromQuery);
  }, [params, runFromLink, authLoading, user, navigate]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const found = extractSocialUrl(text);
      if (found) {
        setUrl(found.url);
        void runFromLink(found.url);
      } else {
        toast.error("No Instagram or RedNote link in clipboard");
      }
    } catch {
      toast.error("Paste the link manually");
    }
  };

  return (
    <>
      <PlayDanmaku hidden={loading} />

      <GameGeneratingOverlay
        open={loading}
        done={genDone}
        photoPreview={previewPhoto}
        hint={overlayHint}
        suggestedTemplateId={suggestedTemplateId}
      />

      <div className="play-paste-shell">
        <header className="play-paste-header">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-display text-sm tracking-tight text-riso-ink hover:text-riso-pink transition-colors"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-pink text-xs text-background shadow-pop-sm">
                M
              </span>
              {BRAND_NAME}
            </Link>

            <nav className="hidden sm:flex flex-1 items-center justify-center gap-1">
              <Link
                to="/games/ai-create"
                className="px-3 py-1 text-xs font-display uppercase tracking-wide text-muted-foreground hover:text-riso-ink rounded-full hover:bg-riso-yellow/40 transition-colors"
              >
                Create
              </Link>
              <span className="px-3 py-1 text-xs font-display uppercase tracking-wide text-riso-ink bg-riso-yellow rounded-full shadow-pop-sm">
                Paste post
              </span>
              <Link
                to="/journal"
                className="px-3 py-1 text-xs font-display uppercase tracking-wide text-muted-foreground hover:text-riso-ink rounded-full hover:bg-riso-yellow/40 transition-colors"
              >
                Journal
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-riso-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </Link>
              {user ? (
                <HeaderUserChip user={user} />
              ) : (
                <Link
                  to="/login"
                  state={{ from: "/play" }}
                  className="font-display text-xs uppercase tracking-wide text-riso-ink hover:text-riso-pink"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="play-paste-marquee border-t-0" aria-hidden>
          <div className="play-paste-marquee-track">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} className="px-6 font-display text-xs uppercase tracking-[0.3em] text-riso-ink">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute -left-32 top-32 h-72 w-72 rounded-full bg-gradient-peach opacity-55 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-gradient-ultraviolet opacity-45 blur-3xl"
          aria-hidden
        />
        <div
          className="play-paste-float right-[8%] top-36 text-3xl animate-float hidden sm:block"
          aria-hidden
        >
          🎮
        </div>
        <div
          className="play-paste-float left-[6%] top-[48%] text-2xl animate-wobble hidden md:block"
          style={{ animationDelay: "0.5s" }}
          aria-hidden
        >
          ✦
        </div>

        <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:py-14 pb-24">
          <FeatureBetaBanner feature="pastePostToGame" className="mb-8" />
          <div className="play-paste-hero-grid">
            {/* Left — zine story */}
            <div className="max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-3">
                ▚ {BRAND_NAME} Press · Vol. PLAY ▚
              </p>

              <h1 className="font-display text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.9] tracking-tight text-riso-ink">
                Posts<span className="text-chroma-lg"> pressed</span>
                <br />
                into <span className="text-riso-pink">playable</span>
                <br className="hidden sm:block" />
                {" "}memories
              </h1>

              <p className="mt-5 font-hand text-2xl sm:text-3xl text-riso-ink leading-snug max-w-md">
                Paste a link. Get a mini game + a caption you can steal for Reels.
              </p>

              <div className="play-paste-hero-chips">
                <span className="sticker-sm rounded-full bg-riso-cyan px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-riso-ink">
                  Instagram
                </span>
                <span className="sticker-sm rounded-full bg-riso-pink px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-background">
                  RedNote
                </span>
              </div>

              <p className="mt-3 font-mono text-xs text-muted-foreground leading-relaxed max-w-md">
                Public posts only · signed-in saves land in your Journal
              </p>

              {/* Overlapping mock — stickers anchored to stage, not headline */}
              <div className="play-paste-mock-stage hidden sm:block" aria-hidden>
                <div className="play-paste-stage-sticker-left animate-wobble">
                  <SpotSticker label="~15 sec" tone="yellow" rotate="rotate-2" />
                </div>
                <div
                  className="play-paste-stage-sticker-right animate-wobble"
                  style={{ animationDelay: "0.6s" }}
                >
                  <SpotSticker label="Story ready" tone="violet" rotate="rotate--3" />
                </div>

                <div className="play-paste-mock-row">
                  <div className="play-paste-mock-post">
                    <span
                      className="washi-tape bg-riso-cyan/80 -rotate-6 left-3 -top-2"
                      aria-hidden
                    />
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-riso-ink/15">
                      <span className="h-6 w-6 shrink-0 rounded-full border-2 border-riso-ink bg-riso-pink" />
                      <span className="font-mono text-[9px] uppercase tracking-wider text-riso-ink">
                        travel.post
                      </span>
                    </div>
                    <div className="play-paste-mock-photo">
                      <span className="font-hand text-3xl text-riso-ink/45">📸</span>
                    </div>
                    <p className="mt-2 font-hand text-sm text-riso-ink line-clamp-2 leading-snug">
                      best ramen behind a shrine…
                    </p>
                  </div>

                  <span className="play-paste-mock-arrow">→</span>

                  <div className="play-paste-mock-game">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-riso-ink mb-1.5">
                      Mini game
                    </p>
                    <p className="font-display text-xs uppercase leading-tight text-riso-ink">
                      Dodge the crowd
                    </p>
                    <div className="mt-2.5 flex gap-1.5 text-base leading-none">
                      <span>🍜</span>
                      <span className="opacity-70">🚶</span>
                      <span className="opacity-45">🚶</span>
                    </div>
                    <p className="mt-2.5 font-mono text-[8px] text-muted-foreground">+ Story caption</p>
                  </div>
                </div>
              </div>

              <div className="play-paste-zine-rule texture-halftone hidden sm:block" aria-hidden />

              <div className="play-paste-flow">
                {FLOW_STEPS.map((step) => (
                  <div key={step.n} className={`play-paste-flow-step ${step.tone}`}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-75 mb-1">
                      {step.n}
                    </p>
                    <p className="font-display text-sm uppercase tracking-wide leading-tight">
                      {step.title}
                    </p>
                    <p className="mt-1.5 font-hand text-base opacity-90 leading-snug">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>

              <ul className="mt-8 space-y-3">
                {OUTCOMES.map((line) => (
                  <li key={line} className="play-paste-outcome">
                    <Check className="h-4 w-4 shrink-0 text-riso-pink mt-0.5" strokeWidth={2.8} />
                    <span className="font-hand text-lg text-riso-ink leading-snug">{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 sticker-sm inline-block bg-riso-ink text-background px-5 py-3 rotate--1">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-70 mb-1">
                  Got photos instead?
                </p>
                <Link
                  to="/games/ai-create"
                  className="font-display text-sm uppercase tracking-wide hover:text-riso-yellow transition-colors inline-flex items-center gap-1"
                >
                  AI Create
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right — admit-one ticket */}
            <div className="play-paste-action-wrap w-full">
              <span className="washi-tape bg-riso-pink/80 rotate-6 left-8 -top-3" aria-hidden />
              <span className="washi-tape bg-riso-yellow/85 -rotate-12 right-10 -top-2" aria-hidden />

              <div className="play-paste-action-card w-full rotate-1">
                <span className="play-paste-stamp" aria-hidden>
                  Mnemo
                  <br />
                  Press
                </span>

                <p className="riso-eyebrow text-center tracking-[0.4em] mb-1">▚ Admit one ▚</p>
                <p className="font-display text-2xl uppercase text-center text-riso-ink mb-1">
                  Paste ticket
                </p>
                <p className="font-hand text-center text-lg text-riso-ink/75 mb-6">
                  {user ? "You're in — we'll save this to Journal" : "Sign in to save & share"}
                </p>

                {!user && !authLoading && (
                  <SignInGateNote returnTo="/play" className="mb-5 -rotate-1" />
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runFromLink(url);
                  }}
                  className="space-y-4"
                >
                  <label className="block">
                    <span className="riso-label">Post link</span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="paste instagram or rednote url…"
                      className="play-paste-url-field"
                      disabled={loading}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="play-paste-press-btn"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    Press · make it playable
                  </button>

                  <button
                    type="button"
                    onClick={() => void pasteFromClipboard()}
                    disabled={loading}
                    className="riso-btn-google w-full text-xs"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                    Paste from clipboard
                  </button>
                </form>

                <details className="play-paste-fallback group">
                  <summary>
                    <span className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-riso-violet" />
                      Link being weird?
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-4 pt-4 border-t-2 border-riso-ink/10">
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-4">
                      Screenshot the post — caption in frame — we&apos;ll press it anyway.
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void runFromScreenshot(f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => fileRef.current?.click()}
                      className="riso-btn-secondary w-full text-xs"
                    >
                      <Camera className="h-4 w-4" />
                      Upload screenshot
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default InstagramPlay;
