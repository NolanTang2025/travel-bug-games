import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { useKeyboard, usePopBursts } from "./PopBurst";
import type { EditionGameProps } from "./types";

const LANES = [18, 34, 50, 66, 82];
const CAR_EMOJI = "🚗";

type Car = { id: number; lane: number; x: number; speed: number };

export function CrosswalkDodge({ onEnd, paused = false }: EditionGameProps) {
  const [ready, setReady] = useState(false);
  const [lane, setLane] = useState(2);
  const [cars, setCars] = useState<Car[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [crossings, setCrossings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playerX, setPlayerX] = useState(8);
  const [invincible, setInvincible] = useState(0);
  const [crossFlash, setCrossFlash] = useState(false);
  const endedRef = useRef(false);
  const idRef = useRef(0);
  const laneRef = useRef(lane);
  const playerXRef = useRef(playerX);
  const statsRef = useRef({ score: 0, misses: 0 });
  const { burst, PopLayer } = usePopBursts();
  const active = ready && !paused;

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
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
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, active, onEnd]);

  useEffect(() => {
    if (!active) return;
    const spawn = setInterval(() => {
      idRef.current += 1;
      const laneIdx = Math.floor(Math.random() * 5);
      setCars((prev) => [
        ...prev,
        { id: idRef.current, lane: laneIdx, x: -12, speed: 0.35 + Math.random() * 0.25 },
      ]);
    }, 1100);
    return () => clearInterval(spawn);
  }, [ready]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      setCars((prev) => {
        const next: Car[] = [];
        for (const c of prev) {
          const x = c.x + c.speed;
          if (x > 115) continue;
          if (
            invincible <= 0 &&
            Math.abs(x - playerXRef.current) < 9 &&
            c.lane === laneRef.current
          ) {
            setMisses((m) => m + 1);
            setInvincible(45);
            burst(playerXRef.current, LANES[laneRef.current], "ouch!", "bad");
            continue;
          }
          next.push({ ...c, x });
        }
        return next;
      });

      setPlayerX((x) => {
        if (x >= 88) {
          setCrossings((c) => c + 1);
          setScore((s) => s + 30);
          setCrossFlash(true);
          setTimeout(() => setCrossFlash(false), 400);
          burst(88, LANES[laneRef.current], "+30");
          return 8;
        }
        return x + 0.06;
      });

      setInvincible((i) => Math.max(0, i - 1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, invincible, burst]);

  return (
    <div className="relative w-full h-screen bg-[#1a1030] overflow-hidden touch-none">
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <GameHUD
        hint="↑↓ switch lane · you auto-walk east · dodge cars"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `${score} pts`, className: "bg-riso-yellow text-riso-ink" },
          { key: "cross", label: `🚶 ${crossings}`, className: "bg-riso-cyan/90 text-riso-ink" },
          { key: "miss", label: `✗ ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />

      {crossFlash && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-riso-cyan/20 animate-in fade-in duration-200" />
      )}

      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, white 0, white 40px, transparent 40px, transparent 80px)",
        }}
      />

      {LANES.map((y, i) => (
        <div
          key={i}
          className={`absolute left-0 right-0 h-[2px] transition-colors duration-200 ${
            i === lane ? "bg-riso-yellow/60 h-[3px]" : "bg-white/10"
          }`}
          style={{ top: `${y}%` }}
        />
      ))}

      {cars.map((c) => (
        <div
          key={c.id}
          className="absolute text-4xl sm:text-5xl select-none pointer-events-none"
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
        className={`absolute text-4xl z-20 game-lane-transition ${invincible > 0 ? "opacity-50 animate-pulse" : ""}`}
        style={{
          left: `${playerX}%`,
          top: `${LANES[lane]}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        🚶
      </div>

      {/* Mobile: tap upper/lower half to switch lanes */}
      <button
        type="button"
        aria-label="Move up one lane"
        className="absolute inset-x-0 top-0 h-[45%] z-10 sm:hidden active:bg-white/5 transition-colors"
        onPointerDown={() => moveLane(-1)}
      />
      <button
        type="button"
        aria-label="Move down one lane"
        className="absolute inset-x-0 bottom-0 h-[45%] z-10 sm:hidden active:bg-white/5 transition-colors"
        onPointerDown={() => moveLane(1)}
      />

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30 sm:hidden pointer-events-none">
        <span className="sticker-sm bg-background/90 text-riso-ink px-4 py-2 font-display text-sm">↑ lane</span>
        <span className="sticker-sm bg-background/90 text-riso-ink px-4 py-2 font-display text-sm">↓ lane</span>
      </div>
    </div>
  );
}
