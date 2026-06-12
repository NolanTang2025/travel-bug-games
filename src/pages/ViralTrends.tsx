import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  Copy,
  Flame,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GameGeneratingOverlay } from "@/components/GameGeneratingOverlay";
import { FeatureBetaBanner } from "@/components/FeatureBetaBanner";
import { FeatureBetaBadge } from "@/components/FeatureBetaBadge";
import { SignInGateNote } from "@/components/SignInGateNote";
import { TrendCoverImage } from "@/components/TrendCoverImage";
import { useAuth } from "@/hooks/useAuth";
import {
  featuredMemeTrends,
  getMemeTrend,
  type MemeTrend,
  type MemeTrendHeat,
} from "@/data/memeTrends";
import { useMemeTrends } from "@/hooks/useMemeTrends";
import { buildMemeHint } from "@/lib/buildMemeHint";
import { publishCommunityGame, writeAiGameSession } from "@/lib/communityGamesApi";
import { persistPlayPhotos } from "@/lib/resolvePlayPhotos";
import { compressPhotosForAi } from "@/lib/compressImageForAi";
import { createVariationSeed, pickPhotoIndex } from "@/lib/gameHint";
import { gamePlayPath } from "@/lib/gamePlayRoute";
import { pickTemplateWithVariation } from "@/lib/pickTemplateFromHint";
import { resolveTrendPhotoDataUrl } from "@/lib/trendPlaceholderPhoto";
import { autoArchiveFromAiCreate } from "@/lib/autoArchive";
import {
  saveGeneratedGame,
  setLoginReturn,
  setPendingGenerate,
} from "@/lib/creativeStorage";
import { BRAND_NAME } from "@/lib/brand";
import type { GameTemplateId } from "@/games/templates/types";

const MAX_STORY = 320;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function heatBadge(heat: MemeTrendHeat) {
  if (heat === "blazing") return { label: "Blazing", className: "bg-riso-pink text-background" };
  if (heat === "hot") return { label: "Hot", className: "bg-riso-yellow text-riso-ink" };
  return { label: "Warm", className: "bg-riso-cyan/90 text-riso-ink" };
}

function TrendCoverCard({
  trend,
  selected,
  onSelect,
  size = "md",
}: {
  trend: MemeTrend;
  selected: boolean;
  onSelect: () => void;
  size?: "lg" | "md" | "sm";
}) {
  const badge = heatBadge(trend.heat);
  const width =
    size === "lg" ? "w-[220px] sm:w-[240px]" : size === "sm" ? "w-[140px]" : "w-full";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group viral-trend-cover-card text-left shrink-0 snap-start",
        width,
        selected ? "viral-trend-cover-card--selected" : "",
      ].join(" ")}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-riso-ink/15 bg-background">
        <TrendCoverImage trend={trend} className="absolute inset-0 h-full w-full" />
        <span
          className={`absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="absolute top-3 right-3 z-10 text-2xl drop-shadow-md" aria-hidden>
          {trend.emoji}
        </span>
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-16">
          <h3 className="font-display text-lg sm:text-xl leading-tight text-white drop-shadow-sm line-clamp-2">
            {trend.title}
          </h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/80 line-clamp-1">
            {trend.subtitle}
          </p>
        </div>
        {selected && (
          <div className="absolute inset-0 z-20 ring-4 ring-riso-pink ring-inset rounded-2xl pointer-events-none" />
        )}
      </div>
    </button>
  );
}

const ViralTrends = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { trends, manifest, refresh, isRefreshing, updatedLabel } = useMemeTrends();
  const fileRef = useRef<HTMLInputElement>(null);

  const featured = useMemo(() => featuredMemeTrends(manifest, 5), [manifest]);

  const initialTrendId = params.get("trend") ?? featured[0]?.id ?? trends[0]?.id ?? "";
  const [trendId, setTrendId] = useState(initialTrendId);
  const [story, setStory] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<GameTemplateId | undefined>();

  const trend = useMemo(
    () => getMemeTrend(manifest, trendId) ?? featured[0] ?? trends[0],
    [manifest, trendId, featured, trends],
  );

  useEffect(() => {
    if (!trends.length) return;
    if (!trends.some((t) => t.id === trendId)) {
      setTrendId(featured[0]?.id ?? trends[0]?.id ?? "");
    }
  }, [trends, trendId, featured]);

  useEffect(() => {
    if (trendId) setParams({ trend: trendId }, { replace: true });
  }, [trendId, setParams]);

  const selectTrend = useCallback((id: string) => {
    setTrendId(id);
    setStory("");
    setPhoto(null);
    setPhotoPreview(null);
  }, []);

  const ingestPhoto = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setPhoto(dataUrl);
      setPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const generate = useCallback(async () => {
    if (!trend) return;
    if (!story.trim()) {
      toast.error("Write your real moment first — that's the viral hook");
      return;
    }
    if (!user) {
      setPendingGenerate("ai-create");
      setLoginReturn(`/trends?trend=${trendId}`);
      toast.message("Sign in to press your viral game");
      navigate("/login", { state: { from: `/trends?trend=${trendId}` } });
      return;
    }

    const photoDataUrl = await resolveTrendPhotoDataUrl(trend, photo);
    const richHint = buildMemeHint(trend, story);
    const variationSeed = createVariationSeed();
    const suggested = pickTemplateWithVariation(richHint, variationSeed, { topN: 4 });
    setSuggestedTemplateId(suggested);
    setGenDone(false);
    setLoading(true);

    try {
      const aiPhotos = await compressPhotosForAi([photoDataUrl]);
      const photoIndex = pickPhotoIndex(variationSeed, aiPhotos.length);

      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          photos: aiPhotos,
          hint: richHint,
          suggestedTemplateId: suggested,
          variationSeed,
          photoIndex,
          temperature: 0.96,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGenDone(true);
      await new Promise((r) => setTimeout(r, 400));

      const published = await publishCommunityGame({
        title: String(data.title ?? `${trend.title} memory`),
        tagline: String(data.tagline ?? ""),
        templateId: String(data.templateId ?? suggested),
        engine: String(data.engine ?? ""),
        spec: data as Record<string, unknown>,
        photos: [photoDataUrl],
        hint: richHint.slice(0, 300),
      });
      const communityGameId = published?.id ?? null;
      const coverUrl = published?.coverUrl ?? null;

      await persistPlayPhotos([photoDataUrl], communityGameId);

      const payload = {
        ...data,
        photos: coverUrl ? [coverUrl] : undefined,
        photo: coverUrl ?? photoDataUrl,
        hint: richHint,
        memeTrendId: trend.id,
        memeTrendTitle: trend.title,
        communityGameId: communityGameId ?? undefined,
        source: "viral-trend" as const,
      };

      writeAiGameSession(payload);
      sessionStorage.setItem("ai_game_source", "viral-trend");
      saveGeneratedGame({
        hint: story,
        photos: [photoDataUrl],
        source: "viral-trend",
        payload: { ...payload, photos: [photoDataUrl], photo: photoDataUrl },
      });

      void autoArchiveFromAiCreate(
        [{ dataUrl: photoDataUrl }],
        `${trend.title}: ${story}`,
      );

      navigate(gamePlayPath(communityGameId), {
        state: { reload: Date.now(), photos: [photoDataUrl] },
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
      setGenDone(false);
      setSuggestedTemplateId(undefined);
    }
  }, [user, photo, trend, story, trendId, navigate]);

  const copyHooks = useCallback(() => {
    if (!trend) return;
    const text = [
      ...trend.hookExamples.map((h) => `• ${h}`),
      "",
      trend.hashtags.join(" "),
    ].join("\n");
    void navigator.clipboard.writeText(text);
    toast.success("Hooks copied — remix with your story");
  }, [trend]);

  if (!trend) {
    return (
      <div className="viral-trends-page mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          {isRefreshing ? "Loading NA trends…" : "No active trends in the manifest."}
        </p>
        <button
          type="button"
          onClick={() => void refresh(true)}
          className="mt-4 font-mono text-xs uppercase tracking-widest text-riso-cyan hover:underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <GameGeneratingOverlay
        open={loading}
        done={genDone}
        photoPreview={photoPreview ?? trend.coverUrl}
        hint={story || trend.title}
        suggestedTemplateId={suggestedTemplateId}
      />

      <div className="viral-trends-page">
        <div className="sticky top-0 z-30 border-b border-riso-yellow/40 bg-riso-yellow/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-riso-ink">
            <span className="feature-beta-badge-sm">BETA</span>
            <span>Trends · private beta — remix pipeline may be unstable</span>
          </div>
        </div>

        <section className="relative border-b-2 border-riso-ink/10 bg-paper">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <FeatureBetaBanner feature="trendRemixToGame" className="mb-6" />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
                  <span>▚ {BRAND_NAME} · Viral Lab · NA TikTok ▚</span>
                  <FeatureBetaBadge feature="trendRemixToGame" />
                </p>
                <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] leading-[0.95] tracking-tight text-riso-ink max-w-xl flex items-center gap-3 flex-wrap">
                  <span>
                    Pick a <span className="text-riso-pink">trend</span>.
                    <br />
                    Press your <span className="text-riso-cyan">story</span>.
                  </span>
                  <FeatureBetaBadge feature="trendRemixToGame" />
                </h1>
                <p className="mt-3 max-w-lg font-mono text-sm text-foreground/70 leading-relaxed">
                  Each card shows what&apos;s peaking on NA TikTok right now — tap one, write what
                  actually happened, get a playable post.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {trends.length} live · updated {updatedLabel}
                </span>
                <button
                  type="button"
                  onClick={() => void refresh(true)}
                  disabled={isRefreshing}
                  className="sticker-sm rounded-full border-2 border-riso-ink/20 bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-riso-yellow/30 disabled:opacity-50"
                >
                  {isRefreshing ? "…" : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl uppercase tracking-tight text-riso-ink flex items-center gap-2">
              <Flame className="h-5 w-5 text-riso-pink" />
              Peaking now
            </h2>
          </div>
          <div className="viral-trends-rail -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {featured.map((t) => (
                <TrendCoverCard
                  key={t.id}
                  trend={t}
                  selected={t.id === trendId}
                  onSelect={() => selectTrend(t.id)}
                  size="lg"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-8">
          <h2 className="mb-4 font-display text-xl uppercase tracking-tight text-riso-ink">
            All trends
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {trends.map((t) => (
              <TrendCoverCard
                key={t.id}
                trend={t}
                selected={t.id === trendId}
                onSelect={() => selectTrend(t.id)}
              />
            ))}
          </div>
        </section>

        <section className="border-t-2 border-riso-ink/10 bg-background/80">
          <div className="mx-auto grid w-full max-w-[1280px] gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
            <div className="relative min-h-[240px] lg:min-h-[520px] border-b-2 lg:border-b-0 lg:border-r-2 border-riso-ink/10">
              <TrendCoverImage trend={trend} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
                  Selected · {trend.platforms.join(" · ")}
                </p>
                <p className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-white">
                  {trend.emoji} {trend.title}
                </p>
                <p className="mt-3 max-w-xl font-mono text-sm text-white/85 leading-relaxed">
                  {trend.gist}
                </p>
              </div>
            </div>

            <div className="viral-trends-studio p-6 sm:p-8 lg:p-10">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Your real moment
                </span>
                <p className="font-hand text-lg text-riso-ink/80 mt-1 mb-3">{trend.storyPrompt}</p>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value.slice(0, MAX_STORY))}
                  rows={4}
                  placeholder={trend.storyStarters[0]}
                  className="viral-trends-textarea w-full rounded-xl border-2 border-riso-ink/20 bg-paper px-4 py-3 font-hand text-xl leading-relaxed text-riso-ink placeholder:text-riso-ink/30 focus:outline-none focus:border-riso-pink/50 focus:ring-2 focus:ring-riso-pink/20"
                />
                <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                  {story.length}/{MAX_STORY}
                </p>
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                {trend.storyStarters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStory(s)}
                    className="rounded-full border border-riso-ink/15 bg-riso-yellow/40 px-3 py-1 font-hand text-sm text-riso-ink hover:bg-riso-yellow transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                  Photo (optional)
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  {photoPreview ? (
                    <div className="relative h-24 w-20 shrink-0">
                      <img
                        src={photoPreview}
                        alt=""
                        className="h-full w-full rounded-lg border-2 border-riso-ink object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-riso-ink bg-background"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-riso-ink/30 bg-riso-ink/5 hover:bg-riso-cyan/15 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-riso-ink/60" />
                      <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                        Yours
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) ingestPhoto(f);
                      e.target.value = "";
                    }}
                  />
                  <p className="font-mono text-xs text-muted-foreground max-w-[220px] leading-snug">
                    No photo? We&apos;ll use the trend cover as your game still.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-riso-ink/15 bg-riso-violet/8 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-riso-ink">
                    Viral playbook
                  </p>
                  <button
                    type="button"
                    onClick={copyHooks}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-riso-violet hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    Copy hooks
                  </button>
                </div>
                <ul className="space-y-2">
                  {trend.viralPlaybook.map((tip) => (
                    <li key={tip} className="font-mono text-xs text-foreground/80 leading-snug flex gap-2">
                      <span className="text-riso-pink shrink-0">✦</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 space-y-3">
                {!authLoading && !user && (
                  <SignInGateNote returnTo={`/trends?trend=${trendId}`} className="w-full" />
                )}
                <button
                  type="button"
                  onClick={generate}
                  disabled={loading || !story.trim()}
                  className="sticker w-full rounded-full bg-riso-pink px-8 py-5 font-display uppercase tracking-[0.12em] text-base text-background disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Pressing virality…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Press meme game
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </button>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                  Game + caption · post to {trend.platforms[0]} this week
                </p>
                <p className="font-mono text-[10px] text-riso-ink/55 text-center leading-relaxed">
                  BETA · Trend remix may fail or return incomplete games during beta.
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="py-8 text-center font-mono text-xs text-muted-foreground">
          Trends rotate fast —{" "}
          <Link to="/play" className="text-riso-cyan underline-offset-2 hover:underline">
            paste a post
          </Link>{" "}
          or{" "}
          <Link to="/games/ai-create" className="text-riso-pink underline-offset-2 hover:underline">
            classic journal mode
          </Link>
        </p>
      </div>
    </>
  );
};

export default ViralTrends;
