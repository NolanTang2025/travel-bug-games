import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";
import type { GameSpec } from "@/gamekit/gameSpec";
import { beep, clamp, vibrate } from "@/lib/gameFx";

type Pop = { id: number; x: number; y: number; isTarget: boolean; born: number; ttl: number };

export function PhotoTapTemplate({
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
  const [pops, setPops] = useState<Pop[]>([]);
  const idRef = useRef(0);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const spawnEvery = clamp(spec.params?.photoTap?.spawnEveryMs ?? 880, 450, 1600);
  const ttl = clamp(spec.params?.photoTap?.reactionWindowMs ?? 1400, 700, 2800);
  const lifeLossOnMiss = clamp(spec.params?.photoTap?.lifeLossOnMiss ?? 1, 0, 3);

  const start = () => {
    setScore(0);
    setMisses(0);
    setLives(3);
    setPops([]);
    setTimeLeft(spec.duration);
    setPhase("play");
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
    const id = setInterval(() => {
      const isTarget = Math.random() < 0.58;
      idRef.current += 1;
      const p: Pop = {
        id: idRef.current,
        x: 12 + Math.random() * 76,
        y: 18 + Math.random() * 58,
        isTarget,
        born: performance.now(),
        ttl,
      };
      setPops((prev) => [...prev, p].slice(-18));
    }, spawnEvery);
    return () => clearInterval(id);
  }, [phase, spawnEvery, ttl]);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const tick = (ts: number) => {
      setPops((prev) => {
        const next: Pop[] = [];
        for (const p of prev) {
          if (ts - p.born > p.ttl) {
            if (p.isTarget && spec.mechanic === "catch") {
              setMisses((m) => m + 1);
              if (lifeLossOnMiss > 0) {
                setLives((lv) => {
                  const n = lv - lifeLossOnMiss;
                  if (n <= 0) setPhase("over");
                  return Math.max(0, n);
                });
              }
              beep("tick");
              vibrate(35);
            }
          } else {
            next.push(p);
          }
        }
        return next;
      });
      if (phaseRef.current === "play") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, spec.mechanic, lifeLossOnMiss]);

  const onTapPop = useCallback(
    (p: Pop) => {
      if (phase !== "play") return;
      setPops((prev) => prev.filter((x) => x.id !== p.id));
      const isGood = spec.mechanic === "catch" ? p.isTarget : !p.isTarget;
      if (isGood) {
        setScore((s) => s + 12);
        beep("good");
        vibrate(15);
      } else {
        setScore((s) => s - 8);
        setLives((lv) => {
          const n = lv - 1;
          if (n <= 0) setPhase("over");
          return Math.max(0, n);
        });
        beep("bad");
        vibrate(60);
      }
    },
    [phase, spec.mechanic],
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {spec.photo ? (
        <img src={spec.photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-95" />
      ) : (
        <div className="absolute inset-0" style={{ background: spec.background }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55 pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <button onClick={onBack} className="text-white font-bold text-sm bg-black/40 px-3 py-2 rounded-full backdrop-blur">
          ← {spec.ui.newGame}
        </button>
        {phase === "play" && (
          <div className="flex gap-2 text-sm font-bold text-white">
            <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">⏱ {timeLeft}s</div>
            <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{score}</div>
            <div className="bg-white/15 px-3 py-1.5 rounded-full">❤ {lives}</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur mb-3">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{spec.ui.generatedBadge}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg">{spec.title}</h1>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2">{spec.tagline}</p>
          <p className="text-sm opacity-90 mb-8 max-w-sm drop-shadow-md">{howto}</p>
          <Button onClick={start} size="lg" className="bg-white text-foreground hover:bg-white/90 font-bold text-lg px-10 h-14 rounded-full shadow-glow">
            {spec.ui.play}
          </Button>
        </div>
      )}

      {phase === "play" &&
        pops.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onTapPop(p)}
            className="absolute z-20 text-5xl select-none active:scale-90 transition-transform drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] touch-manipulation"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {p.isTarget ? spec.targetEmoji : spec.obstacleEmoji}
          </button>
        ))}

      {phase === "over" && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur flex items-center justify-center p-6">
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
  );
}
