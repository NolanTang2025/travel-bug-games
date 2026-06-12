import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Copy, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGameEmbedFlags } from "@/lib/embedMode";
import {
  hasUpvotedCommunityGame,
  loadCommunityGameSession,
  upvoteCommunityGame,
} from "@/lib/communityGamesApi";
import { getPublicGamePlayUrl } from "@/lib/publicPlayUrl";
import { GameLevelIntro } from "@/components/GameLevelIntro";
import { GameplayTutorial } from "@/components/GameplayTutorial";
import { TemplateArena } from "@/games/templates/TemplateArena";
import { JournalAlbumBackdrop } from "@/games/JournalAlbumBackdrop";
import { resolveSpec } from "@/games/templates/catalog";
import type { AIGameTemplateSpec } from "@/games/templates/types";
import { isTextEngine } from "@/games/templates/types";
import { getTemplate } from "@/games/templates/catalog";
import { getGameplayGuide } from "@/lib/gameplayGuide";
import { buildRunRecap, buildShareCaption, copyShareCaption } from "@/lib/mnemoGameCopy";
import { resolvePlayPhotos } from "@/lib/resolvePlayPhotos";
import { MnemoLevelStamp } from "@/components/MnemoLevelStamp";

type PlayNavState = { reload?: number; photos?: string[] } | null;

const FALLBACK_TEMPLATE = getTemplate("bamboo_path");

const FALLBACK: AIGameTemplateSpec = {
  templateId: FALLBACK_TEMPLATE.id,
  engine: FALLBACK_TEMPLATE.engine,
  title: "zen trail derailed",
  tagline: "not me getting a bug convention on a healing walk",
  targetEmoji: FALLBACK_TEMPLATE.defaultTarget,
  obstacleEmoji: FALLBACK_TEMPLATE.defaultObstacle,
  background: FALLBACK_TEMPLATE.defaultBg,
  duration: FALLBACK_TEMPLATE.duration,
  instruction: "dodge the bad, catch the good — your journal made it law",
};

type Phase = "intro" | "tutorial" | "play" | "over";

type GameSession = {
  photos?: string[];
  photo?: string;
  hint?: string;
  archiveId?: string;
  communityGameId?: string;
  memeTrendId?: string;
  source?: string;
};

function readSession(): GameSession {
  try {
    return JSON.parse(sessionStorage.getItem("ai_game") || "{}") as GameSession;
  } catch {
    return {};
  }
}

function isPlaySource(session: GameSession): boolean {
  return session.source === "instagram" || session.source === "xiaohongshu" || session.source === "screenshot";
}

function hydrateFromSession(): {
  session: GameSession;
  spec: AIGameTemplateSpec;
  communityGameId?: string;
} | null {
  const raw = sessionStorage.getItem("ai_game");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const session = parsed as GameSession;
    return {
      session,
      spec: resolveSpec(parsed),
      communityGameId:
        typeof parsed.communityGameId === "string" ? parsed.communityGameId : undefined,
    };
  } catch {
    return { session: {}, spec: FALLBACK, communityGameId: undefined };
  }
}

const AIGamePlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { embed, immersive } = useGameEmbedFlags(location.search);
  const { gameId: routeGameId } = useParams<{ gameId?: string }>();
  const { user } = useAuth();
  const [spec, setSpec] = useState<AIGameTemplateSpec | null>(null);
  const [session, setSession] = useState<GameSession>({});
  const [communityGameId, setCommunityGameId] = useState<string | undefined>();
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteBusy, setUpvoteBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState({ score: 0, misses: 0 });
  const [playKey, setPlayKey] = useState(0);

  const playReload =
    (location.state as { reload?: number } | null)?.reload ?? null;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setSpec(null);
      if (!immersive) setPhase("intro");

      if (routeGameId) {
        const existing = readSession();
        const needsFetch =
          existing.communityGameId !== routeGameId || !sessionStorage.getItem("ai_game");
        if (needsFetch) {
          const ok = await loadCommunityGameSession(routeGameId);
          if (cancelled) return;
          if (!ok) {
            toast.error("Game not found — it may have been removed");
            navigate("/");
            return;
          }
        }
      } else if (!sessionStorage.getItem("ai_game")) {
        if (import.meta.env.DEV) {
          setSession({ source: "ai-create" });
          setSpec(FALLBACK);
          return;
        }
        const s = readSession();
        const src = s.source;
        navigate(
          isPlaySource(s) ? "/play" : src === "viral-trend" ? "/trends" : "/games/ai-create",
        );
        return;
      }

      const hydrated = hydrateFromSession();
      if (cancelled || !hydrated) {
        navigate(routeGameId ? "/" : "/games/ai-create");
        return;
      }

      const gameId = hydrated.communityGameId ?? routeGameId;
      setSession(hydrated.session);
      setCommunityGameId(gameId);
      setSpec(hydrated.spec);

      if (gameId && window.location.pathname !== `/games/play/${gameId}`) {
        navigate(`/games/play/${gameId}`, { replace: true });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [navigate, playReload, routeGameId, immersive]);

  useEffect(() => {
    if (!communityGameId || !user) {
      setUpvoted(false);
      return;
    }
    void hasUpvotedCommunityGame(communityGameId).then(setUpvoted);
  }, [communityGameId, user]);

  const onUpvote = async () => {
    if (!communityGameId || upvoted || upvoteBusy) return;
    if (!user) {
      toast.message("Sign in to upvote community levels");
      return;
    }
    setUpvoteBusy(true);
    const ok = await upvoteCommunityGame(communityGameId);
    if (ok) {
      setUpvoted(true);
      toast.success("Upvoted — thanks");
    }
    setUpvoteBusy(false);
  };

  const navPhotos = useMemo(() => {
    const raw = (location.state as PlayNavState)?.photos;
    return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === "string" && p.length > 0) : [];
  }, [location.state]);

  const photos = useMemo(
    () => resolvePlayPhotos(communityGameId ?? routeGameId, session, navPhotos),
    [communityGameId, routeGameId, session, navPhotos],
  );

  const startPlay = () => {
    setResult({ score: 0, misses: 0 });
    setPlayKey((k) => k + 1);
    setPhase("play");
  };

  useEffect(() => {
    if (spec && immersive) startPlay();
  }, [spec, immersive]);

  const playUrl = communityGameId ? getPublicGamePlayUrl(communityGameId) : undefined;

  const shareCaption = useMemo(
    () => (spec ? buildShareCaption(spec, { playUrl }) : ""),
    [spec, playUrl],
  );

  const onCopyShare = async () => {
    if (!spec) return;
    const ok = await copyShareCaption(spec, { playUrl });
    toast[ok ? "success" : "error"](ok ? "Caption copied — paste to TikTok / Ins" : "Couldn't copy — try again");
  };

  if (!spec) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="sticker rounded-2xl bg-background px-8 py-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-riso-pink" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Loading level…
          </p>
        </div>
      </div>
    );
  }

  const beat = spec.journeyBeat;
  const guide = getGameplayGuide(spec);
  const fromPlay = isPlaySource(session);
  const fromTrend = session.source === "viral-trend";
  const backTo = session.archiveId
    ? `/archive/${session.archiveId}`
    : fromTrend
      ? session.memeTrendId
        ? `/trends?trend=${session.memeTrendId}`
        : "/trends"
      : fromPlay
        ? "/play"
        : session.source === "ai-create" || session.source === "ai-remix"
          ? "/games/ai-create"
          : "/journal";
  const backLabel = session.archiveId
    ? "Journal"
    : fromTrend
      ? "Trends"
      : fromPlay
        ? "Play"
        : session.source === "ai-create" || session.source === "ai-remix"
          ? "Create"
          : "Journal";
  const engineLabel = isTextEngine(spec.engine) ? "Journal quiz" : "Arcade level";
  const recap = phase === "over" ? buildRunRecap(result, spec) : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {phase === "play" ? (
        <TemplateArena
          key={playKey}
          spec={spec}
          photoPreview={photos[0]}
          albumPhotos={photos}
          onEnd={(r) => {
            setResult(r);
            setPhase("over");
          }}
        />
      ) : (
        <>
          {phase !== "tutorial" && (
            <JournalAlbumBackdrop photos={photos} mode="intro" tint={spec.background} />
          )}

          {phase !== "play" && !embed && (
            <div className="absolute top-0 left-0 right-0 z-50 p-4">
              <Link
                to={backTo}
                className="sticker-sm inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 font-display text-xs uppercase tracking-wider text-riso-ink"
              >
                ← {backLabel}
              </Link>
            </div>
          )}

          {phase === "intro" && (
            <GameLevelIntro
              spec={spec}
              beat={beat}
              photos={photos}
              shareCaption={shareCaption}
              engineLabel={engineLabel}
              compact={embed}
              onCopyShare={() => void onCopyShare()}
              onTutorial={() => setPhase("tutorial")}
              onSkip={startPlay}
            />
          )}

          {phase === "tutorial" && (
            <GameplayTutorial
              spec={spec}
              guide={guide}
              photos={photos}
              onStart={startPlay}
              onBack={() => setPhase("intro")}
            />
          )}

          {phase === "over" && (
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center text-white">
              <div className="w-full max-w-md">
                {photos[0] && (
                  <img
                    src={photos[0]}
                    alt=""
                    className="mx-auto mb-6 h-28 w-24 object-cover border-2 border-white/50 shadow-pop rotate-[-2deg]"
                  />
                )}
                <div className="mb-3">
                  <MnemoLevelStamp variant="over" className="text-white/60" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50 mb-2">
                  Run complete
                </p>
                {recap && (
                  <>
                    <h2 className="font-display text-3xl sm:text-4xl mb-1 drop-shadow-lg leading-tight">
                      {recap.headline}
                    </h2>
                    <p className="font-hand text-xl text-riso-yellow mb-3">{recap.epithet}</p>
                    <p className="font-mono text-base mb-4 text-white/85">{recap.statsLine}</p>
                    <p className="font-mono text-xs text-white/65 mb-6 leading-relaxed">{recap.mnemoLine}</p>
                  </>
                )}

                {recap?.moment && (
                  <div className="sticker rounded-2xl bg-background text-riso-ink p-5 mb-5 text-left shadow-pop-lg">
                    <p className="riso-eyebrow mb-2">You played this line</p>
                    <p className="font-hand text-xl leading-snug">&ldquo;{recap.moment}&rdquo;</p>
                  </div>
                )}

                {shareCaption && (
                  <button
                    type="button"
                    onClick={() => void onCopyShare()}
                    className="sticker inline-flex items-center justify-center gap-2 bg-riso-cyan/90 text-riso-ink px-6 py-3 font-display uppercase tracking-wide mb-5 w-full"
                  >
                    <Copy className="h-4 w-4" />
                    Copy caption for Story
                  </button>
                )}

                <div className="flex flex-col gap-3">
                  {communityGameId && (
                    <button
                      type="button"
                      onClick={() => void onUpvote()}
                      disabled={upvoted || upvoteBusy}
                      className={[
                        "sticker inline-flex items-center justify-center gap-2 px-6 py-3 font-display uppercase tracking-wide",
                        upvoted ? "bg-riso-pink/30 text-riso-ink" : "bg-riso-pink text-background",
                      ].join(" ")}
                    >
                      <Heart className={`h-4 w-4 ${upvoted ? "fill-current" : ""}`} />
                      {upvoted ? "Upvoted" : upvoteBusy ? "Saving…" : "Upvote this run"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startPlay}
                    className="sticker bg-riso-yellow text-riso-ink px-6 py-3 font-display uppercase tracking-wide"
                  >
                    Play again
                  </button>
                  <Link
                    to={backTo}
                    className="sticker bg-background text-riso-ink px-6 py-3 font-display uppercase tracking-wide"
                  >
                    ← {backLabel}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIGamePlay;
