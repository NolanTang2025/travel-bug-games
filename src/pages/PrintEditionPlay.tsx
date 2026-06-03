import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pause } from "lucide-react";
import { EditionJournal } from "@/components/EditionJournal";
import { getEditionById } from "@/data/printEditions";
import { saveJournalRun } from "@/lib/journalStorage";
import type { GameEndResult } from "@/games/types";

const gameLoaders = {
  rpg: lazy(() => import("@/games/FireflyRPG").then((m) => ({ default: m.FireflyRPG }))),
  frogger: lazy(() => import("@/games/CrosswalkDodge").then((m) => ({ default: m.CrosswalkDodge }))),
  collector: lazy(() => import("@/games/TramCollector").then((m) => ({ default: m.TramCollector }))),
  arena: lazy(() => import("@/games/MotorbikeWeave").then((m) => ({ default: m.MotorbikeWeave }))),
};

const PrintEditionPlay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const edition = id ? getEditionById(id) : undefined;

  const [phase, setPhase] = useState<"intro" | "play" | "paused" | "over">("intro");
  const [result, setResult] = useState<GameEndResult>({ score: 0, misses: 0 });
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    if (!edition) navigate("/");
  }, [edition, navigate]);

  const handleEnd = useCallback(
    (r: GameEndResult) => {
      setResult(r);
      setPhase("over");
      if (edition) saveJournalRun(edition.id, r.score, r.misses);
    },
    [edition],
  );

  const start = () => {
    setResult({ score: 0, misses: 0 });
    setPlayKey((k) => k + 1);
    setPhase("play");
  };

  if (!edition) return null;

  const spec = edition.game;
  const GameComponent = gameLoaders[spec.type];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: spec.background }}>
      {phase !== "play" && phase !== "paused" && (
        <div className="absolute top-0 left-0 right-0 z-30 p-4">
          <Link
            to="/"
            className="sticker-sm inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm font-display uppercase tracking-wide text-riso-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Editions
          </Link>
        </div>
      )}

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-500">
          <div className="relative mb-6 w-full max-w-md rotate--1">
            <div className="sticker bg-background p-2 pb-4 overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={edition.coverPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <img src={edition.coverArt} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-hard-light" />
              </div>
              <p className="font-hand text-xl text-riso-ink mt-2">{edition.city}</p>
            </div>
          </div>
          <span className="sticker-sm bg-background text-riso-ink font-mono text-[10px] uppercase tracking-[0.25em] px-3 py-1 mb-3 rotate--1">
            {spec.genre}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70 mb-4">
            Vol. {edition.n} · Print Edition
          </span>
          <h1 className="font-display text-4xl md:text-6xl mb-2 drop-shadow-lg max-w-lg leading-[0.95]">
            {spec.title}
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-80 mb-4">
            {edition.city} · {edition.dateStamp.split(" · ")[0]}
          </p>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2 font-mono">{spec.tagline}</p>
          <p className="font-hand text-xl max-w-sm opacity-90 mb-2">{edition.teaser}</p>
          <p className="text-sm opacity-75 mb-6 max-w-md">{edition.blurb}</p>
          <div className="sticker-sm bg-background text-riso-ink font-mono text-xs px-4 py-2 mb-8 max-w-sm rotate-1">
            {spec.controls}
          </div>
          <button
            type="button"
            onClick={start}
            className="sticker bg-background text-riso-ink font-display uppercase tracking-wider text-lg px-10 py-4 rounded-full hover:bg-riso-yellow active:scale-[0.98] transition-all min-h-[48px]"
          >
            Play edition →
          </button>
        </div>
      )}

      {(phase === "play" || phase === "paused") && (
        <>
          <div className="absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-start pointer-events-none">
            <button
              type="button"
              onClick={() => setPhase("paused")}
              className="sticker-sm pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm font-display uppercase tracking-wide text-riso-ink min-h-[44px] active:scale-95 transition-transform"
              aria-label="Pause game"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          </div>

          <div className={phase === "paused" ? "pointer-events-none opacity-40 blur-[1px]" : ""}>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
              <GameComponent key={playKey} edition={edition} onEnd={handleEnd} paused={phase === "paused"} />
            </Suspense>
          </div>

          {phase === "paused" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-riso-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="sticker bg-background text-riso-ink p-8 max-w-sm w-full text-center rotate--1">
                <p className="font-display text-2xl uppercase tracking-wide mb-2">Paused</p>
                <p className="font-mono text-xs text-muted-foreground mb-6">{spec.title}</p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase("play")}
                    className="sticker bg-riso-yellow text-riso-ink font-display uppercase tracking-wider px-6 py-3 rounded-full active:scale-[0.98] transition-transform min-h-[48px]"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("intro")}
                    className="sticker-sm bg-background text-riso-ink font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-full active:scale-[0.98] transition-transform min-h-[44px]"
                  >
                    Leave edition
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "over" && (
        <>
          <div className="min-h-screen opacity-30 pointer-events-none" style={{ background: spec.background }} />
          <EditionJournal
            edition={edition}
            score={result.score}
            misses={result.misses}
            onReplay={start}
          />
        </>
      )}
    </div>
  );
};

export default PrintEditionPlay;
