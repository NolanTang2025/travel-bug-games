import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { usePopBursts } from "./PopBurst";
import { useGameLoop } from "./useGameLoop";
import type { EditionGameProps } from "./types";

type SceneChoice = { label: string; wonder: number; line: string };

const SCENES: { text: string; choices: SceneChoice[] }[] = [
  {
    text: "An old man sits on the riverbank. Fireflies pulse in the reeds like slow breathing.",
    choices: [
      { label: "Ask him why they come back every year", wonder: 25, line: "He smiles. 'Same reason we do.'" },
      { label: "Sit beside him in silence", wonder: 15, line: "The river answers for both of you." },
    ],
  },
  {
    text: "A kid holds an empty jar. 'Think they know my name?'",
    choices: [
      { label: "Help her catch one together", wonder: 30, line: "One lands. Her gasp is the whole summer." },
      { label: "Tell her they know everyone's", wonder: 18, line: "She believes you completely." },
    ],
  },
];

type Firefly = { id: number; x: number; y: number; vx: number; vy: number };
type RainDrop = { id: number; x: number; y: number; vy: number };

const JAR_SECONDS = 28;

export function FireflyRPG({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [wonder, setWonder] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<"story" | "jar">("story");
  const [jarScore, setJarScore] = useState(0);
  const [jarMisses, setJarMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(JAR_SECONDS);
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [rain, setRain] = useState<RainDrop[]>([]);
  const idRef = useRef(0);
  const endedRef = useRef(false);
  const statsRef = useRef({ wonder: 0, jarScore: 0, jarMisses: 0 });
  const spawnAccRef = useRef(0);
  const rainAccRef = useRef(0);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => {
    statsRef.current = { wonder, jarScore, jarMisses };
  }, [wonder, jarScore, jarMisses]);

  const startJar = useCallback(() => {
    setPhase("jar");
    setTimeLeft(JAR_SECONDS);
    setFireflies([]);
    setRain([]);
    setJarScore(0);
    setJarMisses(0);
    endedRef.current = false;
    idRef.current = 0;
    spawnAccRef.current = 0;
    rainAccRef.current = 0;
  }, []);

  const pickChoice = (c: SceneChoice) => {
    if (locked || paused) return;
    setLocked(true);
    setWonder((w) => w + c.wonder);
    setReply(c.line);
    window.setTimeout(() => {
      setReply(null);
      setLocked(false);
      setStep((s) => {
        if (s >= SCENES.length - 1) {
          startJar();
          return s;
        }
        return s + 1;
      });
    }, 1400);
  };

  const spawnFirefly = useCallback(() => {
    idRef.current += 1;
    const id = idRef.current;
    setFireflies((prev) => [
      ...prev,
      {
        id,
        x: 12 + Math.random() * 76,
        y: 15 + Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.018,
        vy: (Math.random() - 0.5) * 0.014,
      },
    ]);
  }, []);

  const spawnRain = useCallback(() => {
    idRef.current += 1;
    setRain((prev) => [
      ...prev,
      { id: idRef.current, x: 8 + Math.random() * 84, y: -4, vy: 0.11 + Math.random() * 0.06 },
    ]);
  }, []);

  useGameLoop(phase === "jar" && active, (dt) => {
    const t = dt / 16.67;

    spawnAccRef.current += dt;
    if (spawnAccRef.current > 700) {
      spawnAccRef.current = 0;
      spawnFirefly();
    }

    rainAccRef.current += dt;
    if (rainAccRef.current > 2200) {
      rainAccRef.current = 0;
      spawnRain();
    }

    setFireflies((prev) =>
      prev.map((f) => {
        let { x, y, vx, vy } = f;
        x += vx * t;
        y += vy * t;
        if (x < 8 || x > 92) vx *= -1;
        if (y < 12 || y > 68) vy *= -1;
        return { ...f, x, y, vx, vy };
      }),
    );

    setRain((prev) => {
      const next: RainDrop[] = [];
      for (const drop of prev) {
        const y = drop.y + drop.vy * t;
        if (y > 94) continue;
        next.push({ ...drop, y });
      }
      return next;
    });
  });

  useEffect(() => {
    if (phase !== "jar" || !active) return;
    spawnFirefly();
    const timer = window.setInterval(() => {
      setTimeLeft((sec) => {
        if (sec <= 1) {
          window.clearInterval(timer);
          if (!endedRef.current) {
            endedRef.current = true;
            const s = statsRef.current;
            onEnd({ score: s.wonder + s.jarScore, misses: s.jarMisses });
          }
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, active, onEnd]);

  const catchFly = (id: number, x: number, y: number) => {
    if (phase !== "jar" || !active) return;
    setFireflies((prev) => prev.filter((f) => f.id !== id));
    setJarScore((s) => s + 15);
    burst(x, y, "+15");
  };

  if (phase === "story") {
    const scene = SCENES[step];
    return (
      <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center p-6 text-white">
        {!ready && <GameCountdown onDone={() => setReady(true)} />}

        <div className="relative z-10 w-full max-w-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70 mb-4 text-center">
            Scene {step + 1} / {SCENES.length}
          </p>
          <div className="sticker bg-background text-riso-ink p-6 rotate--1">
            <p className="font-hand text-2xl leading-snug mb-6 text-riso-ink">{scene.text}</p>
            {reply ? (
              <p className="font-mono text-sm text-riso-violet italic border-l-2 border-riso-pink pl-3">{reply}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {scene.choices.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    disabled={locked}
                    onClick={() => pickChoice(c)}
                    className="sticker-sm text-left px-4 py-3 font-mono text-sm text-riso-ink bg-riso-yellow hover:bg-riso-yellow/80 active:scale-[0.98] transition-all disabled:opacity-50 min-h-[48px]"
                  >
                    → {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 items-center">
            <p className="font-mono text-xs opacity-60">Wonder · {wonder}</p>
            <button
              type="button"
              onClick={startJar}
              className="font-mono text-[10px] uppercase tracking-widest text-white/70 underline underline-offset-4 hover:text-white"
            >
              Skip to jar catcher →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden">
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Tap glowing fireflies · drag jar zone to catch"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `✨ ${jarScore + wonder}`, className: "bg-riso-yellow text-riso-ink" },
          { key: "miss", label: `miss ${jarMisses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      {fireflies.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => catchFly(f.id, f.x, f.y)}
          className="absolute z-20 flex items-center justify-center rounded-full bg-riso-yellow/20 border-2 border-riso-yellow/60 shadow-[0_0_20px_oklch(0.92_0.19_100/0.5)] active:scale-125 transition-transform"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: 56,
            height: 56,
            transform: "translate(-50%, -50%)",
          }}
          aria-label="Catch firefly"
        >
          <span className="text-3xl animate-pulse">🪲</span>
        </button>
      ))}

      {rain.map((drop) => (
        <span
          key={drop.id}
          className="absolute text-xl pointer-events-none opacity-50 z-[5]"
          style={{ left: `${drop.x}%`, top: `${drop.y}%`, transform: "translate(-50%, -50%)" }}
        >
          💧
        </span>
      ))}

      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-6xl z-10 pointer-events-none">
        🫙
      </div>
      <p className="absolute bottom-[4%] left-0 right-0 text-center font-mono text-[9px] uppercase tracking-widest text-white/50 z-10">
        Tap the lights — rain is just atmosphere
      </p>
    </div>
  );
}
