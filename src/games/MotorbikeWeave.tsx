import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { usePopBursts } from "./PopBurst";
import type { EditionGameProps } from "./types";

type Bike = { id: number; x: number; y: number; vx: number; vy: number };
type Bowl = { id: number; x: number; y: number; ttl: number };

export function MotorbikeWeave({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [px, setPx] = useState(50);
  const [py, setPy] = useState(50);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [invincible, setInvincible] = useState(0);
  const keys = useRef<Set<string>>(new Set());
  const posRef = useRef({ x: 50, y: 50 });
  const idRef = useRef(0);
  const endedRef = useRef(false);
  const statsRef = useRef({ score: 0, misses: 0 });
  const dragging = useRef(false);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => { posRef.current = { x: px, y: py }; }, [px, py]);
  useEffect(() => { statsRef.current = { score, misses }; }, [score, misses]);

  const moveTo = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const x = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(12, Math.min(88, ((clientY - rect.top) / rect.height) * 100));
    posRef.current = { x, y };
    setPx(x);
    setPy(y);
  }, []);

  const pressKey = useCallback((key: string) => keys.current.add(key), []);
  const releaseKey = useCallback((key: string) => keys.current.delete(key), []);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => keys.current.add(e.key);
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [active]);

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
    const spawnBike = setInterval(() => {
      idRef.current += 1;
      const edge = Math.floor(Math.random() * 4);
      let x = 50, y = 50, vx = 0, vy = 0;
      const speed = 0.25 + Math.random() * 0.2;
      if (edge === 0) { x = -5; y = 10 + Math.random() * 80; vx = speed; }
      else if (edge === 1) { x = 105; y = 10 + Math.random() * 80; vx = -speed; }
      else if (edge === 2) { y = -5; x = 10 + Math.random() * 80; vy = speed; }
      else { y = 105; x = 10 + Math.random() * 80; vy = -speed; }
      setBikes((prev) => [...prev, { id: idRef.current, x, y, vx, vy }]);
    }, 900);

    const spawnBowl = setInterval(() => {
      idRef.current += 1;
      setBowls((prev) => [
        ...prev,
        {
          id: idRef.current,
          x: 15 + Math.random() * 70,
          y: 15 + Math.random() * 70,
          ttl: 180,
        },
      ]);
    }, 2200);

    return () => {
      clearInterval(spawnBike);
      clearInterval(spawnBowl);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      const k = keys.current;
      let { x, y } = posRef.current;
      const spd = 0.45;
      if (k.has("ArrowLeft") || k.has("a")) x -= spd;
      if (k.has("ArrowRight") || k.has("d")) x += spd;
      if (k.has("ArrowUp") || k.has("w")) y -= spd;
      if (k.has("ArrowDown") || k.has("s")) y += spd;
      x = Math.max(8, Math.min(92, x));
      y = Math.max(12, Math.min(88, y));
      posRef.current = { x, y };
      setPx(x);
      setPy(y);

      setBikes((prev) => {
        const next: Bike[] = [];
        for (const b of prev) {
          const nx = b.x + b.vx;
          const ny = b.y + b.vy;
          if (nx < -15 || nx > 115 || ny < -15 || ny > 115) continue;
          if (invincible <= 0 && Math.hypot(nx - x, ny - y) < 7) {
            setMisses((m) => m + 1);
            setInvincible(50);
            burst(nx, ny, "crash!", "bad");
            continue;
          }
          next.push({ ...b, x: nx, y: ny });
        }
        return next;
      });

      setBowls((prev) => {
        const next: Bowl[] = [];
        for (const bowl of prev) {
          const ttl = bowl.ttl - 1;
          if (ttl <= 0) continue;
          if (Math.hypot(bowl.x - x, bowl.y - y) < 8) {
            setScore((s) => s + 20);
            burst(bowl.x, bowl.y, "+20");
            continue;
          }
          next.push({ ...bowl, ttl });
        }
        return next;
      });

      setInvincible((i) => Math.max(0, i - 1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, invincible, burst]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#f5e6d0] touch-none"
      onPointerDown={(e) => {
        dragging.current = true;
        moveTo(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerLeave={() => { dragging.current = false; }}
      onPointerMove={(e) => {
        if (!dragging.current && e.pointerType !== "mouse") return;
        if (e.pointerType === "mouse" && e.buttons === 0) return;
        moveTo(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      }}
    >
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Drag to move · collect phở · avoid bikes"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s`, className: "bg-black/40 backdrop-blur text-white" },
          { key: "score", label: `🍜 ${score}`, className: "bg-riso-orange text-riso-ink" },
          { key: "miss", label: `🏍️ ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 48px, oklch(0.5 0.05 40 / 0.15) 48px, oklch(0.5 0.05 40 / 0.15) 49px)",
        }}
      />

      {bowls.map((b) => (
        <div
          key={b.id}
          className="absolute text-4xl animate-pulse pointer-events-none"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: "translate(-50%, -50%)",
            opacity: Math.min(1, b.ttl / 60),
          }}
        >
          🍜
        </div>
      ))}

      {bikes.map((b) => (
        <div
          key={b.id}
          className="absolute text-3xl sm:text-4xl pointer-events-none"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          🏍️
        </div>
      ))}

      <div
        className={`absolute text-4xl z-20 pointer-events-none transition-opacity ${invincible > 0 ? "opacity-40 animate-pulse" : ""}`}
        style={{
          left: `${px}%`,
          top: `${py}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        🧍
      </div>

      <div className="absolute bottom-6 right-6 grid grid-cols-3 gap-1 z-30 sm:hidden">
        <div />
        <button
          type="button"
          className="sticker-sm bg-background text-riso-ink p-3 min-h-[44px] active:scale-95"
          onPointerDown={() => pressKey("ArrowUp")}
          onPointerUp={() => releaseKey("ArrowUp")}
          onPointerCancel={() => releaseKey("ArrowUp")}
        >
          ↑
        </button>
        <div />
        <button
          type="button"
          className="sticker-sm bg-background text-riso-ink p-3 min-h-[44px] active:scale-95"
          onPointerDown={() => pressKey("ArrowLeft")}
          onPointerUp={() => releaseKey("ArrowLeft")}
          onPointerCancel={() => releaseKey("ArrowLeft")}
        >
          ←
        </button>
        <div className="sticker-sm bg-riso-yellow p-3 text-center text-xs font-mono text-riso-ink">DRAG</div>
        <button
          type="button"
          className="sticker-sm bg-background text-riso-ink p-3 min-h-[44px] active:scale-95"
          onPointerDown={() => pressKey("ArrowRight")}
          onPointerUp={() => releaseKey("ArrowRight")}
          onPointerCancel={() => releaseKey("ArrowRight")}
        >
          →
        </button>
        <div />
        <button
          type="button"
          className="sticker-sm bg-background text-riso-ink p-3 min-h-[44px] active:scale-95"
          onPointerDown={() => pressKey("ArrowDown")}
          onPointerUp={() => releaseKey("ArrowDown")}
          onPointerCancel={() => releaseKey("ArrowDown")}
        >
          ↓
        </button>
        <div />
      </div>
    </div>
  );
}
