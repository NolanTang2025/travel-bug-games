import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { usePopBursts } from "./PopBurst";
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
    text: "A kid holds an empty jar up to the dark. 'Think they know my name?'",
    choices: [
      { label: "Help her catch one together", wonder: 30, line: "One lands. Her gasp is the whole summer." },
      { label: "Tell her they know everyone's", wonder: 18, line: "She believes you completely." },
    ],
  },
  {
    text: "Clouds gather. The last lights rise — or fade.",
    choices: [
      { label: "Stay until the rain starts", wonder: 20, line: "Wet sleeves. Worth it." },
      { label: "Run for the torii gate", wonder: 10, line: "Shelter smells like cedar and memory." },
    ],
  },
];

type Firefly = { id: number; x: number; y: number; vx: number; vy: number };
type RainDrop = { id: number; x: number; y: number; vy: number };

export function FireflyRPG({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [wonder, setWonder] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<"story" | "bridge" | "jar">("story");
  const [jarScore, setJarScore] = useState(0);
  const [jarMisses, setJarMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(18);
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [rain, setRain] = useState<RainDrop[]>([]);
  const [nextId, setNextId] = useState(0);
  const endedRef = useRef(false);
  const statsRef = useRef({ wonder: 0, jarScore: 0, jarMisses: 0 });
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => {
    statsRef.current = { wonder, jarScore, jarMisses };
  }, [wonder, jarScore, jarMisses]);

  const pickChoice = (c: SceneChoice) => {
    if (locked || paused) return;
    setLocked(true);
    setWonder((w) => w + c.wonder);
    setReply(c.line);
    setTimeout(() => {
      setReply(null);
      setLocked(false);
      if (step >= SCENES.length - 1) setPhase("bridge");
      else setStep((s) => s + 1);
    }, 2200);
  };

  useEffect(() => {
    if (phase !== "bridge") return;
    const t = setTimeout(() => setPhase("jar"), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const spawnFirefly = useCallback(() => {
    setNextId((n) => {
      const id = n + 1;
      setFireflies((prev) => [
        ...prev,
        {
          id,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 55,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.06,
        },
      ]);
      return id;
    });
  }, []);

  const spawnRain = useCallback(() => {
    setNextId((n) => {
      const id = n + 1;
      setRain((prev) => [
        ...prev,
        { id, x: 5 + Math.random() * 90, y: -5, vy: 0.35 + Math.random() * 0.2 },
      ]);
      return id;
    });
  }, []);

  useEffect(() => {
    if (phase !== "jar" || !active) return;
    spawnFirefly();
    spawnRain();
    const spawnF = setInterval(spawnFirefly, 850);
    const spawnR = setInterval(spawnRain, 1400);
    return () => {
      clearInterval(spawnF);
      clearInterval(spawnR);
    };
  }, [phase, active, spawnFirefly, spawnRain]);

  useEffect(() => {
    if (phase !== "jar" || !active) return;
    let raf = 0;
    const tick = () => {
      setFireflies((prev) =>
        prev.map((f) => {
          let { x, y, vx, vy } = f;
          x += vx;
          y += vy;
          if (x < 5 || x > 95) vx *= -1;
          if (y < 8 || y > 70) vy *= -1;
          return { ...f, x, y, vx, vy };
        }),
      );
      setRain((prev) => {
        const next: RainDrop[] = [];
        for (const drop of prev) {
          const y = drop.y + drop.vy;
          if (y > 92) {
            setJarMisses((m) => m + 1);
            burst(drop.x, 88, "miss", "bad");
            continue;
          }
          next.push({ ...drop, y });
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, active, burst]);

  useEffect(() => {
    if (phase !== "jar" || !active) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!endedRef.current) {
            endedRef.current = true;
            const s = statsRef.current;
            onEnd({ score: s.wonder + s.jarScore, misses: s.jarMisses });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, active, onEnd]);

  const catchFly = (id: number, x: number, y: number) => {
    setFireflies((prev) => prev.filter((f) => f.id !== id));
    setJarScore((s) => s + 12);
    burst(x, y, "+12");
  };

  if (phase === "story") {
    const scene = SCENES[step];
    return (
      <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 text-white">
        {!ready && <GameCountdown onDone={() => setReady(true)} />}

        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute text-lg animate-pulse"
              style={{
                left: `${8 + (i * 7) % 85}%`,
                top: `${15 + (i * 11) % 60}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              ✨
            </span>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="flex justify-center gap-2 mb-4">
            {SCENES.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full border border-white/40 transition-all ${
                  i === step ? "bg-riso-yellow scale-125" : i < step ? "bg-white/60" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70 mb-4 text-center">
            Scene {step + 1} / {SCENES.length} · RPG
          </p>

          <div
            key={step}
            className="sticker bg-background text-riso-ink p-6 rotate--1 animate-in fade-in slide-in-from-bottom-3 duration-400"
          >
            <p className="font-hand text-2xl leading-snug mb-6 text-riso-ink">{scene.text}</p>
            {reply ? (
              <p className="font-mono text-sm text-riso-violet italic border-l-2 border-riso-pink pl-3 animate-in fade-in duration-300">
                {reply}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {scene.choices.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    disabled={locked}
                    onClick={() => pickChoice(c)}
                    className="sticker-sm text-left px-4 py-3 font-mono text-sm text-riso-ink bg-riso-yellow hover:bg-riso-yellow/80 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
                  >
                    → {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 text-center font-mono text-xs opacity-60">Wonder · {wonder}</p>
        </div>
      </div>
    );
  }

  if (phase === "bridge") {
    return (
      <div className="relative w-full min-h-screen flex items-center justify-center p-6 text-white">
        <div className="sticker bg-background text-riso-ink p-8 max-w-sm text-center rotate-1 animate-in zoom-in-95 fade-in duration-500">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Act II · Jar catcher
          </p>
          <p className="font-hand text-3xl leading-snug">The story settles. Now fill the jar.</p>
          <p className="font-mono text-xs mt-4 text-riso-ink/70">Tap fireflies · let the rain pass</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden touch-none">
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Tap fireflies for points · rain drops cost you if they land"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `✨ ${jarScore}`, className: "bg-riso-yellow text-riso-ink" },
          { key: "miss", label: `🌧️ ${jarMisses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      {fireflies.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => catchFly(f.id, f.x, f.y)}
          className="absolute z-10 min-h-[48px] min-w-[48px] flex items-center justify-center text-3xl active:scale-125 transition-transform animate-pulse"
          style={{ left: `${f.x}%`, top: `${f.y}%`, transform: "translate(-50%, -50%)" }}
          aria-label="Catch firefly"
        >
          🪲
        </button>
      ))}

      {rain.map((drop) => (
        <span
          key={drop.id}
          className="absolute text-2xl pointer-events-none opacity-70 z-[5]"
          style={{ left: `${drop.x}%`, top: `${drop.y}%`, transform: "translate(-50%, -50%)" }}
        >
          💧
        </span>
      ))}

      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-6xl z-20 animate-[float_2s_ease-in-out_infinite]">
        🫙
      </div>
    </div>
  );
}
