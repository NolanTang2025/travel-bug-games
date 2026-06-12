import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Loader2,
  RefreshCw,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { deriveArchiveTitle } from "@/lib/archiveTitle";
import {
  fetchArchive,
  fetchArchiveMedia,
  fetchArchivePhotoDataUrls,
  generateArchive,
  resolveDisplayUrlsForPaths,
  type ArchiveSummary,
  type UserArchive,
} from "@/lib/archiveApi";
import { ArchiveGeneratingOverlay } from "@/components/ArchiveGeneratingOverlay";
import { GameGeneratingOverlay } from "@/components/GameGeneratingOverlay";
import { TwinGeneratingOverlay } from "@/components/TwinGeneratingOverlay";
import { DeleteMemoryButton } from "@/components/DeleteMemoryButton";
import { TravelInsightsPlayground } from "@/components/TravelInsightsPlayground";
import { compressPhotosForAi } from "@/lib/compressImageForAi";
import { getCachedMediaObjectUrls } from "@/lib/mediaImageCache";
import { buildRichGameHint, createVariationSeed, pickPhotoIndex } from "@/lib/gameHint";
import { pickTemplateWithVariation } from "@/lib/pickTemplateFromHint";
import { persistPlayPhotos } from "@/lib/resolvePlayPhotos";
import { gamePlayPath } from "@/lib/gamePlayRoute";
import {
  fetchCommunityGameByArchiveId,
  publishCommunityGame,
  replaceCommunityGamesForArchive,
  writeAiGameSession,
  type CommunityGameRow,
} from "@/lib/communityGamesApi";
import { findGeneratedGameByArchiveId, restoreGeneratedGameToSession, saveGeneratedGame } from "@/lib/creativeStorage";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePersona, generateTwin } from "@/lib/twinApi";
import type { GameTemplateId } from "@/games/templates/types";

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function PipelineStep({
  n,
  label,
  done,
  active,
}: {
  n: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="journal-pipeline-step min-w-0">
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm shadow-pop-sm",
          done
            ? "border-riso-cyan bg-riso-cyan text-riso-ink"
            : active
              ? "border-riso-pink bg-riso-pink text-background animate-pulse"
              : "border-riso-ink/25 bg-background text-muted-foreground",
        ].join(" ")}
      >
        {done ? "✓" : n}
      </span>
      <span
        className={[
          "font-mono text-[10px] uppercase tracking-[0.2em] leading-tight",
          done ? "text-riso-cyan" : active ? "text-riso-pink" : "text-muted-foreground",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

function MetaPill({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "cyan" | "pink" | "yellow";
}) {
  const bg = {
    ink: "bg-background",
    cyan: "bg-riso-cyan/35",
    pink: "bg-riso-pink/25",
    yellow: "bg-riso-yellow/45",
  }[tone];
  return <span className={`journal-meta-pill ${bg}`}>{children}</span>;
}

const ArchiveDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [archive, setArchive] = useState<UserArchive | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingTwin, setGeneratingTwin] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingGame, setGeneratingGame] = useState(false);
  const [gameDone, setGameDone] = useState(false);
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<GameTemplateId | undefined>();
  const [summaryDone, setSummaryDone] = useState(false);
  const [twinDone, setTwinDone] = useState(false);
  const [hasPersona, setHasPersona] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [linkedGame, setLinkedGame] = useState<CommunityGameRow | null>(null);
  const [localGameId, setLocalGameId] = useState<string | null>(null);
  const [playingGame, setPlayingGame] = useState(false);
  const [varyGameplay, setVaryGameplay] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const media = await fetchArchiveMedia(id);
      const paths = media.map((m) => m.storage_path);
      const cachedByPath = await getCachedMediaObjectUrls(paths);
      const cachedUrls = paths.map((p) => cachedByPath[p]).filter((u): u is string => !!u);
      if (cachedUrls.length) {
        setImageUrls(cachedUrls);
        setLoading(false);
      }

      const [arch, persona, game] = await Promise.all([
        fetchArchive(id),
        fetchActivePersona(),
        fetchCommunityGameByArchiveId(id),
      ]);
      setArchive(arch);
      setHasPersona(!!persona && persona.archive_id === id);
      setLinkedGame(game);
      setLocalGameId(game ? null : findGeneratedGameByArchiveId(id)?.id ?? null);
      const byPath = await resolveDisplayUrlsForPaths(paths);
      setImageUrls(paths.map((p) => byPath[p]).filter((u): u is string => !!u));
      setPhotoIndex(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const summary = archive?.summary_json as ArchiveSummary | null;
  const displayTitle = useMemo(
    () =>
      archive?.title ||
      (archive?.journal_text ? deriveArchiveTitle(archive.journal_text) : null) ||
      summary?.title ||
      "Travel entry",
    [archive, summary],
  );

  const isDraft = archive?.status === "draft";
  const isFailed = archive?.status === "failed";
  const isReady = archive?.status === "ready";
  const hasPhotos = imageUrls.length > 0;
  const hasSummary = !!summary;
  const canSummarize = hasPhotos || !!archive?.journal_text?.trim();
  const hasExistingGame = !!linkedGame || !!localGameId;

  const onRegenerateSummary = async () => {
    if (!id) return;
    if (!canSummarize) {
      toast.message("Add photos or journal text first");
      return;
    }
    setRegenerating(true);
    setSummaryDone(false);
    try {
      await generateArchive(id);
      setSummaryDone(true);
      await new Promise((r) => setTimeout(r, 400));
      toast.success(hasSummary ? "AI insights regenerated" : "AI insights ready");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setRegenerating(false);
      setSummaryDone(false);
    }
  };

  const gameHint = useMemo(
    () =>
      buildRichGameHint({
        journalText: archive?.journal_text,
        summary,
        displayTitle,
      }),
    [archive?.journal_text, summary, displayTitle],
  );

  const onPlayExistingGame = async () => {
    setPlayingGame(true);
    try {
      if (linkedGame) {
        navigate(gamePlayPath(linkedGame.id), { state: { reload: Date.now() } });
        return;
      }
      if (localGameId && restoreGeneratedGameToSession(localGameId)) {
        navigate(gamePlayPath(), { state: { reload: Date.now() } });
        return;
      }
      toast.error("Couldn't load your game — try again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open game");
    } finally {
      setPlayingGame(false);
    }
  };

  const runGameGeneration = async (options?: { remix?: boolean }) => {
    if (!id) return;
    const remix = options?.remix ?? false;
    if (!remix && hasExistingGame) {
      toast.message("This trip already has a game — tap Play, or remix with a new style");
      return;
    }
    if (!hasPhotos) {
      toast.error("Add at least one photo to turn this trip into a game");
      return;
    }

    setGeneratingGame(true);
    setGameDone(false);

    const variationSeed = createVariationSeed();
    const richHint = buildRichGameHint({
      journalText: archive?.journal_text,
      summary,
      displayTitle,
      variationNote: remix ? `Remix run #${variationSeed}` : undefined,
    });
    const forcePick = varyGameplay || remix;
    const pickedTemplate = pickTemplateWithVariation(richHint, variationSeed, {
      topN: forcePick ? 5 : 3,
      widenPool: forcePick,
    });
    setSuggestedTemplateId(pickedTemplate);

    try {
      if (remix) {
        await replaceCommunityGamesForArchive(id);
        setLinkedGame(null);
        setLocalGameId(null);
      }

      const dataUrls = await fetchArchivePhotoDataUrls(id);
      if (!dataUrls.length) throw new Error("Couldn't load trip photos");
      const aiPhotos = await compressPhotosForAi(dataUrls);
      const photoIndex = pickPhotoIndex(variationSeed, aiPhotos.length);

      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: {
          photos: aiPhotos,
          hint: richHint,
          suggestedTemplateId: pickedTemplate,
          variationSeed,
          photoIndex,
          forcePickTemplate: forcePick,
          remix,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const spec = { ...(data as Record<string, unknown>) };
      delete spec._meta;

      setGameDone(true);
      await new Promise((r) => setTimeout(r, 380));

      const coverPhotos = [...dataUrls];
      if (photoIndex > 0 && photoIndex < coverPhotos.length) {
        const [picked] = coverPhotos.splice(photoIndex, 1);
        coverPhotos.unshift(picked);
      }

      const published = await publishCommunityGame({
        title: String(spec.title ?? displayTitle),
        tagline: String(spec.tagline ?? ""),
        templateId: String(spec.templateId ?? pickedTemplate),
        engine: String(spec.engine ?? ""),
        spec,
        photos: coverPhotos,
        archiveId: id,
        hint: richHint,
      });
      const communityGameId = published?.id ?? null;
      const coverUrl = published?.coverUrl ?? null;

      await persistPlayPhotos(dataUrls, communityGameId);

      const sessionPhotos = coverUrl
        ? [coverUrl, ...dataUrls.slice(1).filter((p) => !p.startsWith("data:"))]
        : dataUrls.filter((p) => !p.startsWith("data:"));

      const payload = {
        ...spec,
        photos: sessionPhotos.length ? sessionPhotos : undefined,
        photo: sessionPhotos[0] ?? dataUrls[photoIndex] ?? dataUrls[0],
        hint: richHint,
        archiveId: id,
        communityGameId: communityGameId ?? undefined,
        source: remix ? ("ai-remix" as const) : ("ai-create" as const),
        variationSeed,
        photoIndex,
      };
      writeAiGameSession(payload);
      saveGeneratedGame({
        hint: richHint,
        photos: dataUrls,
        source: remix ? "ai-remix" : "ai-create",
        payload: { ...payload, photos: dataUrls, photo: dataUrls[photoIndex] ?? dataUrls[0] },
      });

      if (communityGameId) {
        const refreshed = await fetchCommunityGameByArchiveId(id);
        setLinkedGame(refreshed);
        setLocalGameId(null);
      }

      navigate(gamePlayPath(communityGameId), {
        state: { reload: Date.now(), photos: dataUrls },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate game";
      if (msg.includes("Rate") || msg.includes("频繁")) toast.error("Too many requests — try again later");
      else if (msg.includes("Payment") || msg.includes("余额")) toast.error("AI quota exceeded — check your API key");
      else toast.error(msg);
      setGeneratingGame(false);
      setGameDone(false);
    } finally {
      setSuggestedTemplateId(undefined);
    }
  };

  const onMakeGame = () => runGameGeneration();
  const onRemixGame = () => runGameGeneration({ remix: true });

  const onGenerateTwin = async () => {
    if (!id || !isReady) return;
    setGeneratingTwin(true);
    setTwinDone(false);
    try {
      await generateTwin(id);
      setTwinDone(true);
      await new Promise((r) => setTimeout(r, 450));
      toast.success("Digital twin ready");
      navigate("/twin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate twin");
      setGeneratingTwin(false);
      setTwinDone(false);
    }
  };

  const prevPhoto = () => setPhotoIndex((i) => (i <= 0 ? imageUrls.length - 1 : i - 1));
  const nextPhoto = () => setPhotoIndex((i) => (i >= imageUrls.length - 1 ? 0 : i + 1));

  if (loading) {
    return (
      <div className="journal-page flex flex-1 items-center justify-center py-24">
        <div className="sticker rounded-2xl bg-background px-8 py-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-riso-pink" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Loading trip log…
          </p>
        </div>
      </div>
    );
  }

  if (!archive) {
    return (
      <section className="journal-page mx-auto max-w-lg px-4 py-20 text-center">
        <div className="sticker rounded-2xl bg-background p-8 rotate--1">
          <p className="font-display text-2xl text-chroma">Entry not found</p>
          <Link to="/journal" className="riso-btn-primary mt-6 inline-flex text-sm">
            Back to Journal
          </Link>
        </div>
      </section>
    );
  }

  const statusLabel = isFailed ? "Needs retry" : isDraft ? "Draft" : "Published";
  const statusTone = isFailed ? "pink" : isDraft ? "yellow" : "cyan";

  return (
    <>
      <ArchiveGeneratingOverlay
        open={regenerating}
        done={summaryDone}
        photoPreview={imageUrls[0]}
        journalPreview={archive.journal_text}
      />
      <GameGeneratingOverlay
        open={generatingGame}
        done={gameDone}
        photoPreview={imageUrls[photoIndex] ?? imageUrls[0]}
        hint={gameHint}
        suggestedTemplateId={suggestedTemplateId}
      />
      <TwinGeneratingOverlay open={generatingTwin} done={twinDone} archiveTitle={displayTitle} />

      <article className="journal-page mx-auto w-full max-w-[1140px] px-4 py-8 sm:py-12">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/journal"
            className="sticker-sm inline-flex items-center gap-1.5 rounded-full bg-background px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-riso-ink hover:bg-riso-yellow/40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All journals
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/twin"
              className="sticker-sm rounded-full bg-riso-violet/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-riso-ink hover:bg-riso-violet/25"
            >
              Twin →
            </Link>
            <Link
              to="/games/ai-create"
              className="sticker-sm rounded-full bg-riso-cyan/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-riso-ink hover:bg-riso-cyan/40"
            >
              AI Create →
            </Link>
          </div>
        </nav>

        <header className="mb-10 sm:mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">
            ▚ Trip log · Journal ▚
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <MetaPill tone={statusTone}>{statusLabel}</MetaPill>
            <MetaPill tone="ink">
              <Calendar className="h-3 w-3 text-riso-violet" />
              {formatLongDate(archive.created_at)}
            </MetaPill>
            {hasPhotos && (
              <MetaPill tone="yellow">
                {imageUrls.length} photo{imageUrls.length === 1 ? "" : "s"}
              </MetaPill>
            )}
            {hasExistingGame && (
              <MetaPill tone="pink">
                <Gamepad2 className="h-3 w-3" />
                Game ready
              </MetaPill>
            )}
          </div>

          <h1 className="journal-hero-title font-display text-riso-ink">
            <span className="text-chroma-lg block">{displayTitle}</span>
          </h1>

          {summary?.one_line_persona && (
            <blockquote className="journal-persona-quote mt-6 max-w-2xl rotate-1">
              <p className="font-hand text-xl sm:text-2xl text-riso-ink leading-snug">
                &ldquo;{summary.one_line_persona}&rdquo;
              </p>
            </blockquote>
          )}

          <div className="journal-pipeline mt-8">
            <div className="journal-pipeline-connector" aria-hidden />
            <div className="relative z-10 grid gap-6 sm:grid-cols-3 sm:gap-4">
              <PipelineStep n={1} label="Photos saved" done={hasPhotos || !!archive.journal_text} active={false} />
              <PipelineStep n={2} label="AI summary" done={hasSummary} active={canSummarize && !hasSummary} />
              <PipelineStep n={3} label="Digital twin" done={hasPersona} active={hasSummary && !hasPersona} />
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="space-y-10 min-w-0">
            {hasPhotos && (
              <section className="relative">
                <span className="washi-tape washi-tape-pink absolute -top-2 left-8 z-20 hidden sm:block" aria-hidden />
                <span className="washi-tape washi-tape-cyan absolute -top-1 right-12 z-20 hidden sm:block" aria-hidden />

                <div className="journal-polaroid">
                  <div className="journal-polaroid-frame relative">
                    <img
                      src={imageUrls[photoIndex]}
                      alt=""
                      className="aspect-[4/3] w-full object-cover journal-upload-photo sm:aspect-[16/10]"
                    />
                    {imageUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevPhoto}
                          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-riso-ink bg-riso-yellow p-2.5 shadow-pop-sm hover:bg-riso-pink hover:text-background transition-colors"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={nextPhoto}
                          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-riso-ink bg-riso-yellow p-2.5 shadow-pop-sm hover:bg-riso-pink hover:text-background transition-colors"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {displayTitle}
                    {imageUrls.length > 1 && (
                      <span className="text-riso-pink"> · {photoIndex + 1}/{imageUrls.length}</span>
                    )}
                  </p>
                </div>

                {imageUrls.length > 1 && (
                  <div className="journal-film-strip mt-2 max-w-3xl mx-auto">
                    {imageUrls.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        className={[
                          "journal-film-thumb",
                          i === photoIndex ? "journal-film-thumb-active" : "opacity-75 hover:opacity-100",
                        ].join(" ")}
                      >
                        <img src={url} alt="" className="h-14 w-14 object-cover sm:h-16 sm:w-16 journal-upload-photo" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="journal-scrapbook">
              <div className="journal-scrapbook-spine" aria-hidden />
              <div className="diary-paper pl-7 pr-5 py-6 sm:pl-9 sm:pr-8 sm:py-8">
                <p className="riso-eyebrow mb-4 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-yellow font-display text-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  Journal entry
                </p>
                {archive.journal_text ? (
                  <p className="font-hand text-xl sm:text-[1.65rem] whitespace-pre-wrap leading-relaxed text-riso-ink pl-1">
                    {archive.journal_text}
                  </p>
                ) : (
                  <p className="font-mono text-sm text-muted-foreground pl-1">No journal text — photos only.</p>
                )}
              </div>
            </section>

            {hasSummary && summary && (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <h2 className="riso-section-title mb-0">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-violet text-background">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    AI travel insights
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                    Decode lab · playable
                  </span>
                </div>

                <TravelInsightsPlayground
                  key={archive?.updated_at ?? id}
                  summary={summary}
                />
              </section>
            )}

            {!hasSummary && canSummarize && (
              <section className="sticker-sm rounded-2xl border-2 border-dashed border-riso-violet/40 bg-riso-violet/5 px-5 py-4 rotate--1">
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  <span className="text-riso-violet font-semibold uppercase tracking-wider text-[10px]">Optional · </span>
                  Tap <span className="text-riso-ink font-semibold">Generate summary</span> in the dock to unlock places, mood, timeline, and your digital twin.
                </p>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="journal-action-dock">
              <span className="journal-action-dock-watermark" aria-hidden>
                Go
              </span>
              <p className="riso-eyebrow relative z-10">Action dock</p>

              {hasExistingGame ? (
                <>
                  <button
                    type="button"
                    onClick={onPlayExistingGame}
                    disabled={playingGame || generatingGame}
                    className="riso-btn-primary w-full"
                  >
                    {playingGame ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Gamepad2 className="h-4 w-4" />
                    )}
                    {playingGame ? "Loading game…" : "Play your game"}
                  </button>
                  <button
                    type="button"
                    onClick={onRemixGame}
                    disabled={generatingGame || !hasPhotos}
                    className="riso-btn-secondary w-full"
                  >
                    {generatingGame ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Remix game · new style
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onMakeGame}
                  disabled={generatingGame || !hasPhotos}
                  className="riso-btn-primary w-full"
                >
                  {generatingGame ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gamepad2 className="h-4 w-4" />
                  )}
                  Make a game from this trip
                </button>
              )}
              {hasPhotos && (
                <label className="flex items-start gap-2.5 rounded-xl border border-riso-ink/10 bg-background/60 px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={varyGameplay}
                    onChange={(e) => setVaryGameplay(e.target.checked)}
                    disabled={generatingGame}
                    className="mt-0.5 h-4 w-4 accent-riso-pink"
                  />
                  <span className="text-left leading-snug">
                    <span className="font-display text-sm text-riso-ink">Mix it up</span>
                    <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
                      Different game engine, random photo — built for a fresh TikTok angle
                    </span>
                  </span>
                </label>
              )}
              {!hasPhotos && !hasExistingGame && (
                <p className="font-mono text-[10px] text-muted-foreground text-center">
                  Add photos to enable game generation
                </p>
              )}
              {hasExistingGame && linkedGame?.title && (
                <p className="font-mono text-[10px] text-muted-foreground text-center leading-relaxed">
                  {linkedGame.title} — remix for a new take
                </p>
              )}

              {canSummarize && (
                <button
                  type="button"
                  onClick={onRegenerateSummary}
                  disabled={regenerating}
                  className="riso-btn-ghost w-full text-sm"
                >
                  {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {hasSummary ? "Regenerate summary" : "Generate summary"}
                </button>
              )}

              {isReady && !hasPersona && (
                <button
                  type="button"
                  onClick={onGenerateTwin}
                  disabled={generatingTwin}
                  className="riso-btn-secondary w-full"
                >
                  {generatingTwin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCircle className="h-4 w-4" />}
                  Create digital twin
                </button>
              )}

              {hasPersona && (
                <Link to="/twin" className="riso-btn-ghost w-full text-center text-sm">
                  <Sparkles className="h-4 w-4" />
                  Open Twin
                </Link>
              )}

              <DeleteMemoryButton
                archiveId={archive.id}
                title={displayTitle}
                onDeleted={() => navigate("/journal")}
              />
            </div>

            <div className="journal-meta-card">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-riso-violet mb-3">Entry meta</p>
              <dl className="space-y-2.5 font-mono text-xs text-riso-ink">
                <div className="flex justify-between gap-2 border-b border-riso-ink/10 pb-2">
                  <dt className="text-muted-foreground uppercase tracking-wider">Created</dt>
                  <dd className="text-right">{formatLongDate(archive.created_at)}</dd>
                </div>
                {archive.updated_at !== archive.created_at && (
                  <div className="flex justify-between gap-2 border-b border-riso-ink/10 pb-2">
                    <dt className="text-muted-foreground uppercase tracking-wider">Updated</dt>
                    <dd className="text-right">{formatLongDate(archive.updated_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground uppercase tracking-wider">Status</dt>
                  <dd className="uppercase font-display tracking-wide text-riso-pink">{archive.status}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
};

export default ArchiveDetail;
