import { useCallback, useEffect, useRef, useState } from "react";
import { GameCountdown } from "./GameCountdown";
import { GameHUD } from "./GameHUD";
import { useKeyboard, usePopBursts } from "./PopBurst";
import { useGameLoop } from "./useGameLoop";
import { bumpCombo, difficultyRamp, resetCombo, spawnInterval } from "./gameUtils";
import { EditionPlayShell } from "./EditionPlayShell";
import { EditionSprite, editionSpriteSrc } from "./EditionSprite";
import type { EditionGameProps } from "./types";

const LANES = [20, 35, 50, 65, 80];
const GAME_SECONDS = 40;
const LIGHT_CYCLE_MS = 6000;

type Car = { id: number; lane: number; x: number; speed: number };

export function CrosswalkDodge({ edition, onEnd, paused = false }: EditionGameProps) {
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
  const [holding, setHolding] = useState(false);
  const [combo, setCombo] = useState(resetCombo);
  const [lightPhase, setLightPhase] = useState<"walk" | "wait">("walk");
  const endedRef = useRef(false);
  const elapsedRef = useRef(0);
  const comboRef = useRef(resetCombo());
  const holdingRef = useRef(false);
  const lightRef = useRef<"walk" | "wait">("walk");
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
  useEffect(() => { holdingRef.current = holding; }, [holding]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { lightRef.current = lightPhase; }, [lightPhase]);

  useEffect(() => {
    if (!active) return;
    const flip = () =>
      setLightPhase((p) => {
        const next = p === "walk" ? "wait" : "walk";
        lightRef.current = next;
        return next;
      });
    const id = window.setInterval(flip, LIGHT_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [active]);

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
    elapsedRef.current += dt;
    const ramp = difficultyRamp(elapsedRef.current, GAME_SECONDS * 1000);

    spawnAccRef.current += dt;
    const spawnMs = lightRef.current === "wait" ? spawnInterval(520, ramp, 280) : 1400;
    if (spawnAccRef.current > spawnMs) {
      spawnAccRef.current = 0;
      idRef.current += 1;
      const lane = Math.floor(Math.random() * 5);
      setCars((prev) => [
        ...prev,
        {
          id: idRef.current,
          lane,
          x: -14,
          speed: 0.5 + ramp * 0.35 + Math.random() * 0.2,
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
          Math.abs(x - playerXRef.current) < 12 &&
          c.lane === laneRef.current
        ) {
          comboRef.current = resetCombo();
          setCombo(resetCombo());
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

    const canSprint = lightRef.current === "walk" || holdingRef.current;
    const speed = canSprint ? 0.22 + ramp * 0.12 : 0.06;

    setPlayerX((x) => {
      const nx = x + speed * t;
      if (nx >= 92) {
        setCrossings((c) => c + 1);
        const cmb = bumpCombo(comboRef.current);
        comboRef.current = cmb;
        setCombo(cmb);
        const pts = 30 * cmb.multiplier;
        setScore((s) => s + pts);
        setCrossFlash(true);
        window.setTimeout(() => setCrossFlash(false), 350);
        burst(90, LANES[laneRef.current], `+${pts}`);
        return 5;
      }
      return nx;
    });

    setInvincible((i) => Math.max(0, i - t));
  });

  const carSrc = editionSpriteSrc(edition, "obstacle");
  const playerSrc = editionSpriteSrc(edition, "player");

  return (
    <EditionPlayShell edition={edition}>
      <div className="relative h-full overflow-hidden">
      {!ready && <GameCountdown onDone={() => setReady(true)} />}
      <PopLayer />

      <div
        className={`absolute top-12 left-1/2 -translate-x-1/2 z-20 sticker-sm px-4 py-1 font-mono text-[10px] uppercase tracking-widest ${
          lightPhase === "walk" ? "bg-riso-lime text-riso-ink" : "bg-riso-pink text-background"
        }`}
      >
        {lightPhase === "walk" ? "🟢 Walk — cross now" : "🔴 Wait — cars incoming"}
      </div>

      <GameHUD
        hint="↑↓ lane · hold CROSS to sprint · green light = safe"
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `${score} pts`, className: "bg-riso-yellow text-riso-ink" },
          {
            key: "combo",
            label: combo.count > 0 ? `×${combo.multiplier}` : "combo",
            className: "bg-riso-cyan/90 text-riso-ink",
          },
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
          className="absolute select-none pointer-events-none z-10"
          style={{
            left: `${c.x}%`,
            top: `${LANES[c.lane]}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {carSrc ? (
            <EditionSprite src={carSrc} variant="obstacle" size={52} />
          ) : (
            <span className="text-4xl sm:text-5xl">🚗</span>
          )}
        </div>
      ))}

      <div
        className={`absolute z-30 game-lane-transition drop-shadow-lg ${
          invincible > 0 ? "opacity-60 animate-pulse" : ""
        }`}
        style={{
          left: `${playerX}%`,
          top: `${LANES[lane]}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {playerSrc ? (
          <EditionSprite src={playerSrc} variant="player" size={48} />
        ) : (
          <span className="text-4xl">🚶</span>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-40 px-3">
        <button
          type="button"
          onPointerDown={() => moveLane(-1)}
          className="sticker flex-1 max-w-[100px] bg-background text-riso-ink py-4 font-display text-sm active:scale-95 min-h-[52px]"
        >
          ↑
        </button>
        <button
          type="button"
          onPointerDown={() => {
            holdingRef.current = true;
            setHolding(true);
          }}
          onPointerUp={() => {
            holdingRef.current = false;
            setHolding(false);
          }}
          onPointerCancel={() => {
            holdingRef.current = false;
            setHolding(false);
          }}
          className={`sticker flex-[1.4] max-w-[160px] py-4 font-display text-sm uppercase tracking-wider active:scale-95 min-h-[52px] ${
            holding ? "bg-riso-lime text-riso-ink" : "bg-riso-yellow text-riso-ink"
          }`}
        >
          {holding ? "Crossing…" : "Hold · Cross"}
        </button>
        <button
          type="button"
          onPointerDown={() => moveLane(1)}
          className="sticker flex-1 max-w-[100px] bg-background text-riso-ink py-4 font-display text-sm active:scale-95 min-h-[52px]"
        >
          ↓
        </button>
      </div>
      </div>
    </EditionPlayShell>
  );
}
