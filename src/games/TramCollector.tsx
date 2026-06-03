import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { useKeyboard, usePopBursts } from "./PopBurst";
import { useGameLoop } from "./useGameLoop";
import type { EditionGameProps } from "./types";

type Collectible = {
  id: number;
  x: number;
  y: number;
  vy: number;
  kind: "ticket" | "pigeon";
};

const GAME_SECONDS = 32;
const CATCH_Y = 78;
const CATCH_HALF_W = 14;

export function TramCollector({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [tramX, setTramX] = useState(50);
  const [items, setItems] = useState<Collectible[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [hitFlash, setHitFlash] = useState(false);
  const idRef = useRef(0);
  const tramRef = useRef(tramX);
  const statsRef = useRef({ score: 0, misses: 0 });
  const endedRef = useRef(false);
  const spawnAccRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => { tramRef.current = tramX; }, [tramX]);
  useEffect(() => { statsRef.current = { score, misses }; }, [score, misses]);

  const setTramFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setTramX(Math.max(14, Math.min(86, pct)));
  }, []);

  const nudge = useCallback((dir: -1 | 1) => {
    setTramX((x) => Math.max(14, Math.min(86, x + dir * 10)));
  }, []);

  useKeyboard(
    useCallback(
      (key) => {
        if (key === "ArrowLeft" || key === "a") nudge(-1);
        if (key === "ArrowRight" || key === "d") nudge(1);
      },
      [nudge],
    ),
    active,
  );

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      if (!endedRef.current) {
        endedRef.current = true;
        const s = statsRef.current;
        onEnd({ score: s.score, misses: s.misses });
      }
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeft, active, onEnd]);

  useGameLoop(active, (dt) => {
    const t = dt / 16.67;

    spawnAccRef.current += dt;
    if (spawnAccRef.current > 850) {
      spawnAccRef.current = 0;
      idRef.current += 1;
      const isTicket = Math.random() < 0.78;
      setItems((prev) => [
        ...prev,
        {
          id: idRef.current,
          x: 12 + Math.random() * 76,
          y: -6,
          vy: isTicket ? 0.42 + Math.random() * 0.12 : 0.55 + Math.random() * 0.15,
          kind: isTicket ? "ticket" : "pigeon",
        },
      ]);
    }

    setItems((prev) => {
      const next: Collectible[] = [];
      const tx = tramRef.current;

      for (const it of prev) {
        const y = it.y + it.vy * t;
        if (y > 108) {
          if (it.kind === "ticket") setMisses((m) => m + 1);
          continue;
        }

        if (y >= CATCH_Y - 6 && y <= CATCH_Y + 10) {
          if (Math.abs(it.x - tx) < CATCH_HALF_W) {
            if (it.kind === "ticket") {
              setScore((s) => s + 18);
              burst(it.x, CATCH_Y, "+18");
            } else {
              setMisses((m) => m + 1);
              setScore((s) => Math.max(0, s - 10));
              setHitFlash(true);
              window.setTimeout(() => setHitFlash(false), 280);
              burst(it.x, CATCH_Y, "bird!", "bad");
            }
            continue;
          }
        }
        next.push({ ...it, y });
      }
      return next;
    });
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden touch-none"
      onPointerMove={(e) => setTramFromClientX(e.clientX)}
      onPointerDown={(e) => setTramFromClientX(e.clientX)}
    >
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Move tram under tickets · avoid pigeons"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s`, className: "bg-black/40 backdrop-blur text-white" },
          { key: "score", label: `🎫 ${score}`, className: "bg-riso-yellow text-riso-ink" },
          { key: "miss", label: `🐦 ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      <div className="absolute inset-x-[12%] top-0 bottom-0 border-x-4 border-riso-ink/25 pointer-events-none" />

      <div
        className="absolute left-[12%] right-[12%] pointer-events-none z-[5] border-2 border-dashed border-riso-yellow/50 rounded-2xl bg-riso-yellow/10"
        style={{ top: `${CATCH_Y - 8}%`, height: "14%" }}
        aria-hidden
      />

      {items.map((it) => (
        <div
          key={it.id}
          className={`absolute text-4xl pointer-events-none z-10 ${
            it.kind === "ticket" ? "" : "opacity-90"
          }`}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {it.kind === "ticket" ? "🎫" : "🐦"}
        </div>
      ))}

      <div
        className={`absolute z-30 text-5xl sm:text-6xl transition-[left] duration-75 ${
          hitFlash ? "animate-pulse scale-110" : ""
        }`}
        style={{
          left: `${tramX}%`,
          top: `${CATCH_Y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        🚋
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-40 px-4">
        <button
          type="button"
          onPointerDown={() => nudge(-1)}
          className="sticker bg-background text-riso-ink px-10 py-4 font-display text-xl active:scale-95 min-h-[52px] min-w-[72px]"
        >
          ←
        </button>
        <button
          type="button"
          onPointerDown={() => nudge(1)}
          className="sticker bg-background text-riso-ink px-10 py-4 font-display text-xl active:scale-95 min-h-[52px] min-w-[72px]"
        >
          →
        </button>
      </div>
    </div>
  );
}
