import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";
import type { GameSpec } from "@/gamekit/gameSpec";
import { beep, clamp, vibrate } from "@/lib/gameFx";

type Entity = { id: number; lane: 0 | 1 | 2; y: number; isTarget: boolean };

const LANES = 3;
/** Entities crossing this row are resolved against the player lane */
const PLAYER_ROW = 82;

export function RunnerTemplate({
  spec,
  howto,
  onBack,
}: {
  spec: GameSpec;
  howto: string;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "play" | "over">("intro");
  const [timeLeft, setTimeLeft] = useState(spec.duration);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [lives, setLives] = useState(3);
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [entities, setEntities] = useState<Entity[]>([]);
  const idRef = useRef(0);
  const phaseRef = useRef(phase);
  const laneRef = useRef<0 | 1 | 2>(1);
  const gameStartRef = useRef(0);

  const speedBase = spec.params?.runner?.scrollSpeed ?? 38;
  const spawnMs = clamp(spec.params?.runner?.spawnEveryMs ?? 720, 400, 1600);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  const start = () => {
    setScore(0);
    setMisses(0);
    setLives(3);
    setLane(1);
    laneRef.current = 1;
    setEntities([]);
    setTimeLeft(spec.duration);
    setPhase("play");
    gameStartRef.current = performance.now();
  };

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const sp = setInterval(() => {
      const isTarget = Math.random() < 0.55;
      const laneN = Math.floor(Math.random() * LANES) as 0 | 1 | 2;
      idRef.current += 1;
      const e: Entity = { id: idRef.current, lane: laneN, y: -8, isTarget };
      setEntities((prev) => [...prev, e]);
    }, spawnMs);
    return () => clearInterval(sp);
  }, [phase, spawnMs]);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const tick = () => {
      if (phaseRef.current !== "play") return;
      const elapsed = (performance.now() - gameStartRef.current) / 1000;
      const ramp = 1 + elapsed / Math.max(10, spec.duration * 1.2);
      const sp = speedBase * ramp;

      setEntities((prev) => {
        const laneNow = laneRef.current;
        const next: Entity[] = [];
        for (const e of prev) {
          const ny = e.y + sp * 0.02;
          if (ny > 106) {
            if (e.isTarget && spec.mechanic === "catch") {
              setMisses((m) => m + 1);
              setLives((lv) => {
                const n = lv - 1;
                if (n <= 0) queueMicrotask(() => setPhase("over"));
                return Math.max(0, n);
              });
              beep("bad");
              vibrate(40);
            }
            continue;
          }
          const crossed = e.y < PLAYER_ROW && ny >= PLAYER_ROW && e.lane === laneNow;
          if (crossed) {
            const isGood = spec.mechanic === "catch" ? e.isTarget : !e.isTarget;
            if (isGood) {
              setScore((s) => s + 14);
              beep("good");
              vibrate(12);
            } else {
              setScore((s) => s - 6);
              setLives((lv) => {
                const n = lv - 1;
                if (n <= 0) queueMicrotask(() => setPhase("over"));
                return Math.max(0, n);
              });
              beep("bad");
              vibrate(55);
            }
            continue;
          }
          next.push({ ...e, y: ny });
        }
        return next;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, spec.duration, spec.mechanic, speedBase]);

  const steer = useCallback((dir: -1 | 1) => {
    setLane((l) => {
      const n = clamp(l + dir, 0, 2) as 0 | 1 | 2;
      laneRef.current = n;
      return n;
    });
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") steer(-1);
      if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") steer(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, steer]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: spec.background }}>
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-white/90 font-bold text-sm bg-black/30 px-3 py-2 rounded-full">
          ← {spec.ui.newGame}
        </button>
        {phase === "play" && (
          <div className="flex gap-2 text-sm font-bold text-white">
            <div className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">⏱ {timeLeft}s</div>
            <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{score}</div>
            <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full">✗ {misses}</div>
            <div className="bg-white/15 px-3 py-1.5 rounded-full">❤ {lives}</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white">
          {spec.photo && (
            <img src={spec.photo} alt="" className="w-32 h-32 rounded-2xl object-cover shadow-card mb-6 border-4 border-white/30" />
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur mb-3">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{spec.ui.generatedBadge}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg">{spec.title}</h1>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2">{spec.tagline}</p>
          <p className="text-sm opacity-85 mb-8 max-w-sm">{howto}</p>
          <Button onClick={start} size="lg" className="bg-white text-foreground hover:bg-white/90 font-bold text-lg px-10 h-14 rounded-full shadow-glow">
            {spec.ui.play}
          </Button>
        </div>
      )}

      {(phase === "play" || phase === "over") && (
        <div className="relative min-h-screen flex flex-col">
          <div className="relative flex-1 mx-4 mt-16 mb-40 rounded-3xl border border-white/20 bg-black/30 overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-3 opacity-40">
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>

            <div
              className="absolute left-2 right-2 border-t border-dashed border-white/35 pointer-events-none"
              style={{ top: `${PLAYER_ROW}%` }}
            />

            {entities.map((e) => (
              <div
                key={e.id}
                className="absolute text-4xl pointer-events-none select-none drop-shadow-lg"
                style={{
                  left: `${16.66 + e.lane * 33.33}%`,
                  top: `${e.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {e.isTarget ? spec.targetEmoji : spec.obstacleEmoji}
              </div>
            ))}

            <div
              className="absolute text-5xl transition-all duration-100 ease-out select-none"
              style={{
                left: `${16.66 + lane * 33.33}%`,
                top: `${PLAYER_ROW}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              🧍
            </div>
          </div>

          {phase === "play" && (
            <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-2 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent">
              <button
                type="button"
                className="flex-1 h-16 rounded-2xl bg-white/15 text-white font-black text-lg border border-white/25 active:scale-[0.98]"
                onClick={() => steer(-1)}
              >
                ◀
              </button>
              <button
                type="button"
                className="flex-1 h-16 rounded-2xl bg-white/15 text-white font-black text-lg border border-white/25 active:scale-[0.98]"
                onClick={() => steer(1)}
              >
                ▶
              </button>
            </div>
          )}

          {phase === "over" && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur flex items-center justify-center p-6">
              <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-sm w-full text-center shadow-card">
                <h2 className="text-3xl font-black mb-1">{spec.ui.timeUp}</h2>
                <p className="text-muted-foreground mb-6">{spec.title}</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">{spec.ui.score}</div>
                    <div className="text-2xl font-black">{score}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">{spec.ui.misses}</div>
                    <div className="text-2xl font-black">{misses}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={start} className="flex-1 gap-2">
                    <RotateCcw className="h-4 w-4" /> {spec.ui.replay}
                  </Button>
                  <Link to="/games/ai-create" className="flex-1">
                    <Button variant="outline" className="w-full">{spec.ui.newPhoto}</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
