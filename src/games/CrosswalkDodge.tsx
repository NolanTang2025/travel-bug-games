import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { useKeyboard, usePopBursts } from "./PopBurst";
import { useGameLoop } from "./useGameLoop";
import type { EditionGameProps } from "./types";

const LANES = [20, 35, 50, 65, 80];
const CAR_EMOJI = "🚗";
const GAME_SECONDS = 35;

type Car = { id: number; lane: number; x: number; speed: number };

export function CrosswalkDodge({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [lane, setLane] = useState(2);
  const [cars, setCars] = useState<Car[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [crossings, setCrossings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [playerX, setPlayerX] = useState(6);
  const [invincible, setInvincible] = useState(0);
  const [crossFlash, setCrossFlash] = useState(false);
  const endedRef = useRef(false);
  const idRef = useRef(0);
  const laneRef = useRef(lane);
  const playerXRef = useRef(playerX);
  const invincibleRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });
  const spawnAccRef = useRef(0);
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { invincibleRef.current = invincible; }, [invincible]);
  useEffect(() => { statsRef.current = { score, misses }; }, [score, misses]);

  const moveLane = useCallback((dir: -1 | 1) => {
    setLane((l) => Math.max(0, Math.min(4, l + dir)));
  }, []);

  useKeyboard(
    useCallback(
      (key) => {
        if (key === "ArrowUp" || key === "w") moveLane(-1);
        if (key === "ArrowDown" || key === "s") moveLane(1);
      },
      [moveLane],
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
    if (spawnAccRef.current > 750) {
      spawnAccRef.current = 0;
      idRef.current += 1;
      setCars((prev) => [
        ...prev,
        {
          id: idRef.current,
          lane: Math.floor(Math.random() * 5),
          x: -14,
          speed: 0.45 + Math.random() * 0.35,
        },
      ]);
    }

    setCars((prev) => {
      const next: Car[] = [];
      for (const c of prev) {
        const x = c.x + c.speed * t;
        if (x > 118) continue;
        if (
          invincibleRef.current <= 0 &&
          Math.abs(x - playerXRef.current) < 10 &&
          c.lane === laneRef.current
        ) {
          setMisses((m) => m + 1);
          invincibleRef.current = 50;
          setInvincible(50);
          burst(playerXRef.current, LANES[laneRef.current], "hit!", "bad");
          continue;
        }
        next.push({ ...c, x });
      }
      return next;
    });

    setPlayerX((x) => {
      const nx = x + 0.14 * t;
      if (nx >= 90) {
        setCrossings((c) => c + 1);
        setScore((s) => s + 35);
        setCrossFlash(true);
        window.setTimeout(() => setCrossFlash(false), 350);
        burst(90, LANES[laneRef.current], "+35");
        return 6;
      }
      return nx;
    });

    setInvincible((i) => Math.max(0, i - t));
  });

  return (
    <div className="relative w-full min-h-[100dvh] h-[100dvh] bg-[#1a1030] overflow-hidden">
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="↑↓ change lane · reach the right side · dodge cars"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `${score} pts`, className: "bg-riso-yellow text-riso-ink" },
          { key: "cross", label: `🚶 ${crossings}`, className: "bg-riso-cyan/90 text-riso-ink" },
          { key: "miss", label: `✗ ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      {crossFlash && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-riso-cyan/25 animate-in fade-in duration-200" />
      )}

      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, white 0, white 36px, transparent 36px, transparent 72px)",
        }}
      />

      <div className="absolute left-[6%] top-0 bottom-0 w-[3px] bg-riso-yellow/40 z-[5]" />
      <div className="absolute right-[6%] top-0 bottom-0 w-[3px] bg-riso-cyan/50 z-[5]" />

      {LANES.map((y, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 transition-all duration-150 ${
            i === lane ? "h-[4px] bg-riso-yellow shadow-[0_0_12px_oklch(0.92_0.19_100)]" : "h-[1px] bg-white/15"
          }`}
          style={{ top: `${y}%` }}
        />
      ))}

      {cars.map((c) => (
        <div
          key={c.id}
          className="absolute text-4xl sm:text-5xl select-none pointer-events-none z-10"
          style={{
            left: `${c.x}%`,
            top: `${LANES[c.lane]}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {CAR_EMOJI}
        </div>
      ))}

      <div
        className={`absolute text-4xl z-30 game-lane-transition drop-shadow-lg ${
          invincible > 0 ? "opacity-60 animate-pulse" : ""
        }`}
        style={{
          left: `${playerX}%`,
          top: `${LANES[lane]}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        🚶
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-40 px-4">
        <button
          type="button"
          onPointerDown={() => moveLane(-1)}
          className="sticker flex-1 max-w-[140px] bg-background text-riso-ink py-4 font-display text-lg active:scale-95 min-h-[52px]"
        >
          ↑ Lane
        </button>
        <button
          type="button"
          onPointerDown={() => moveLane(1)}
          className="sticker flex-1 max-w-[140px] bg-background text-riso-ink py-4 font-display text-lg active:scale-95 min-h-[52px]"
        >
          ↓ Lane
        </button>
      </div>
    </div>
  );
}
