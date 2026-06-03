import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { useKeyboard, usePopBursts } from "./PopBurst";
import type { EditionGameProps } from "./types";

type Collectible = {
  id: number;
  x: number;
  y: number;
  vy: number;
  kind: "ticket" | "pigeon";
};

export function TramCollector({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [tramX, setTramX] = useState(50);
  const [items, setItems] = useState<Collectible[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hitFlash, setHitFlash] = useState(false);
  const idRef = useRef(0);
  const tramRef = useRef(tramX);
  const statsRef = useRef({ score: 0, misses: 0 });
  const endedRef = useRef(false);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => { tramRef.current = tramX; }, [tramX]);
  useEffect(() => { statsRef.current = { score, misses }; }, [score, misses]);

  const setTramFromClientX = useCallback((clientX: number, rect: DOMRect) => {
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setTramX(Math.max(12, Math.min(88, pct)));
  }, []);

  const nudge = useCallback((dir: -1 | 1) => {
    setTramX((x) => Math.max(12, Math.min(88, x + dir * 8)));
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
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, active, onEnd]);

  useEffect(() => {
    if (!active) return;
    const spawn = setInterval(() => {
      idRef.current += 1;
      const isTicket = Math.random() < 0.72;
      setItems((prev) => [
        ...prev,
        {
          id: idRef.current,
          x: 8 + Math.random() * 84,
          y: -5,
          vy: isTicket ? 0.07 + Math.random() * 0.04 : 0.1 + Math.random() * 0.05,
          kind: isTicket ? "ticket" : "pigeon",
        },
      ]);
    }, 750);
    return () => clearInterval(spawn);
  }, [ready]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      setItems((prev) => {
        const next: Collectible[] = [];
        for (const it of prev) {
          const y = it.y + it.vy;
          if (y > 105) continue;

          const tramY = 82;
          if (y >= tramY - 4 && y <= tramY + 8) {
            if (Math.abs(it.x - tramRef.current) < 11) {
              if (it.kind === "ticket") {
                setScore((s) => s + 15);
                burst(it.x, tramY, "+15");
              } else {
                setMisses((m) => m + 1);
                setScore((s) => Math.max(0, s - 8));
                setHitFlash(true);
                setTimeout(() => setHitFlash(false), 300);
                burst(it.x, tramY, "bird!", "bad");
              }
              continue;
            }
          }
          next.push({ ...it, y });
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, burst]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden touch-none"
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" && e.buttons === 0) return;
        setTramFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
      }}
    >
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Move tram under falling tickets · dodge pigeons"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s`, className: "bg-black/40 backdrop-blur text-white" },
          { key: "score", label: `🎫 ${score}`, className: "bg-riso-yellow text-riso-ink" },
          { key: "miss", label: `🐦 ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      <div className="absolute inset-x-[15%] top-0 bottom-0 border-x-4 border-riso-ink/30 pointer-events-none" />
      <div className="absolute inset-x-0 top-[20%] h-1 bg-riso-ink/20 pointer-events-none" />
      <div className="absolute inset-x-0 top-[45%] h-1 bg-riso-ink/20 pointer-events-none" />

      {/* Catch zone */}
      <div
        className="absolute left-[12%] right-[12%] bottom-[8%] h-16 border-2 border-dashed border-riso-ink/25 rounded-full pointer-events-none z-[5]"
        aria-hidden
      />

      {items.map((it) => (
        <div
          key={it.id}
          className="absolute text-4xl pointer-events-none"
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
        className={`absolute z-20 text-5xl sm:text-6xl transition-[left] duration-75 ${hitFlash ? "animate-pulse scale-110" : ""}`}
        style={{
          left: `${tramX}%`,
          bottom: "10%",
          transform: "translateX(-50%)",
        }}
      >
        🚋
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-30 sm:hidden">
        <button
          type="button"
          onPointerDown={() => nudge(-1)}
          className="sticker bg-background text-riso-ink px-8 py-3 font-display text-xl active:scale-95 transition-transform min-h-[48px] min-w-[48px]"
        >
          ←
        </button>
        <button
          type="button"
          onPointerDown={() => nudge(1)}
          className="sticker bg-background text-riso-ink px-8 py-3 font-display text-xl active:scale-95 transition-transform min-h-[48px] min-w-[48px]"
        >
          →
        </button>
      </div>
    </div>
  );
}
