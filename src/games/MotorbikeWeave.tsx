import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { usePopBursts } from "./PopBurst";
import { useGameLoop } from "./useGameLoop";
import { bumpCombo, difficultyRamp, resetCombo, spawnInterval } from "./gameUtils";
import { EditionPlayShell } from "./EditionPlayShell";
import { EditionSprite, editionSpriteSrc } from "./EditionSprite";
import type { EditionGameProps } from "./types";

type Bike = { id: number; x: number; y: number; vx: number; vy: number };
type Bowl = { id: number; x: number; y: number; ttl: number };

const GAME_SECONDS = 32;

export function MotorbikeWeave({ edition, onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [px, setPx] = useState(50);
  const [py, setPy] = useState(55);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [invincible, setInvincible] = useState(0);
  const [combo, setCombo] = useState(resetCombo);
  const keys = useRef<Set<string>>(new Set());
  const comboRef = useRef(resetCombo());
  const elapsedRef = useRef(0);
  const posRef = useRef({ x: 50, y: 55 });
  const invincibleRef = useRef(0);
  const idRef = useRef(0);
  const endedRef = useRef(false);
  const statsRef = useRef({ score: 0, misses: 0 });
  const bikeAccRef = useRef(0);
  const bowlAccRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => {
    posRef.current = { x: px, y: py };
  }, [px, py]);
  useEffect(() => {
    invincibleRef.current = invincible;
  }, [invincible]);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  const moveTo = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(18, Math.min(82, ((clientY - rect.top) / rect.height) * 100));
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
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeft, active, onEnd]);

  useGameLoop(active, (dt) => {
    const t = dt / 16.67;
    elapsedRef.current += dt;
    const ramp = difficultyRamp(elapsedRef.current, GAME_SECONDS * 1000);
    const k = keys.current;
    let { x, y } = posRef.current;
    const spd = 0.55;

    if (k.has("ArrowLeft") || k.has("a")) x -= spd * t;
    if (k.has("ArrowRight") || k.has("d")) x += spd * t;
    if (k.has("ArrowUp") || k.has("w")) y -= spd * t;
    if (k.has("ArrowDown") || k.has("s")) y += spd * t;
    x = Math.max(10, Math.min(90, x));
    y = Math.max(18, Math.min(82, y));
    posRef.current = { x, y };
    setPx(x);
    setPy(y);

    bikeAccRef.current += dt;
    if (bikeAccRef.current > spawnInterval(1100, ramp, 550)) {
      bikeAccRef.current = 0;
      idRef.current += 1;
      const edge = Math.floor(Math.random() * 4);
      let bx = 50, by = 50, bvx = 0, bvy = 0;
      const speed = 0.32 + Math.random() * 0.22;
      if (edge === 0) {
        bx = -8;
        by = 15 + Math.random() * 70;
        bvx = speed;
      } else if (edge === 1) {
        bx = 108;
        by = 15 + Math.random() * 70;
        bvx = -speed;
      } else if (edge === 2) {
        by = -8;
        bx = 15 + Math.random() * 70;
        bvy = speed;
      } else {
        by = 108;
        bx = 15 + Math.random() * 70;
        bvy = -speed;
      }
      setBikes((prev) => [...prev, { id: idRef.current, x: bx, y: by, vx: bvx, vy: bvy }]);
    }

    bowlAccRef.current += dt;
    if (bowlAccRef.current > spawnInterval(2200, ramp, 1200)) {
      bowlAccRef.current = 0;
      idRef.current += 1;
      setBowls((prev) => [
        ...prev,
        {
          id: idRef.current,
          x: 18 + Math.random() * 64,
          y: 22 + Math.random() * 56,
          ttl: 220,
        },
      ]);
    }

    setBikes((prev) => {
      const next: Bike[] = [];
      for (const b of prev) {
        const nx = b.x + b.vx * t;
        const ny = b.y + b.vy * t;
        if (nx < -18 || nx > 118 || ny < -18 || ny > 118) continue;
        if (invincibleRef.current <= 0 && Math.hypot(nx - x, ny - y) < 9) {
          comboRef.current = resetCombo();
          setCombo(resetCombo());
          setMisses((m) => m + 1);
          invincibleRef.current = 55;
          setInvincible(55);
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
        const ttl = bowl.ttl - t;
        if (ttl <= 0) continue;
        if (Math.hypot(bowl.x - x, bowl.y - y) < 12) {
          const cmb = bumpCombo(comboRef.current);
          comboRef.current = cmb;
          setCombo(cmb);
          const pts = 22 * cmb.multiplier;
          setScore((s) => s + pts);
          burst(bowl.x, bowl.y, `+${pts}`);
          continue;
        }
        next.push({ ...bowl, ttl });
      }
      return next;
    });

    setInvincible((i) => Math.max(0, i - t));
  });

  const phoSrc = editionSpriteSrc(edition, "target");
  const scooterSrc = editionSpriteSrc(edition, "obstacle");
  const walkerSrc = editionSpriteSrc(edition, "player");

  return (
    <EditionPlayShell edition={edition}>
    <div
      ref={containerRef}
      className="relative h-full overflow-hidden touch-none"
      onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
      onPointerDown={(e) => moveTo(e.clientX, e.clientY)}
    >
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="Move cursor/finger · collect phở · dodge bikes"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s`, className: "bg-black/40 backdrop-blur text-white" },
          { key: "score", label: `🍜 ${score}`, className: "bg-riso-yellow text-riso-ink" },
          {
            key: "combo",
            label: combo.count > 0 ? `×${combo.multiplier}` : "combo",
            className: "bg-riso-cyan/90 text-riso-ink",
          },
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
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: "translate(-50%, -50%)",
            opacity: Math.min(1, b.ttl / 80),
          }}
        >
          {phoSrc ? (
            <EditionSprite src={phoSrc} variant="target" size={48} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-riso-orange/60 bg-riso-orange/20">
              <span className="text-3xl">🍜</span>
            </div>
          )}
        </div>
      ))}

      {bikes.map((b) => (
        <div
          key={b.id}
          className="absolute pointer-events-none z-[8]"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {scooterSrc ? (
            <EditionSprite src={scooterSrc} variant="obstacle" size={44} />
          ) : (
            <span className="text-3xl sm:text-4xl">🏍️</span>
          )}
        </div>
      ))}

      <div
        className={`absolute z-30 ${invincible > 0 ? "opacity-50 animate-pulse" : ""}`}
        style={{
          left: `${px}%`,
          top: `${py}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {walkerSrc ? (
          <EditionSprite src={walkerSrc} variant="player" size={44} />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-riso-ink bg-background/90 shadow-pop-sm">
            <span className="text-2xl">🧍</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 z-40">
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
        <div className="sticker-sm bg-riso-orange/80 p-2 text-center text-[9px] font-mono text-riso-ink leading-tight">
          drag
          <br />
          move
        </div>
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
    </EditionPlayShell>
  );
}
