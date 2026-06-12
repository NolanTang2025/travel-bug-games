import { useCallback, useEffect, useRef, useState } from "react";
import { SCORE_PENALTY } from "../../GamePenaltyFeedback";
import { useKeyboard, usePopBursts } from "../../PopBurst";
import { useGameLoop } from "../../useGameLoop";
import { bumpCombo, difficultyRamp, resetCombo, spawnInterval } from "../../gameUtils";
import type { GameEngine } from "../types";
import { GameShell, useGameTimer, type EngineProps } from "./shared";
import { GameSprite } from "../../GameSprite";

type Item = { id: number; x: number; y: number; vy: number; vx: number; isTarget: boolean; w: number };
const CATCHER_Y = 82;
/** Item center must land inside this vertical band (matches basket height). */
const CATCH_Y_MIN = CATCHER_Y - 4;
const CATCH_Y_MAX = CATCHER_Y + 3;
/** Horizontal half-width (%). Obstacles need a tighter line-up than targets. */
const CATCH_TARGET_RX = 6.5;
const CATCH_OBSTACLE_RX = 3.8;

function catchesBasket(itemX: number, itemY: number, basketX: number, isTarget: boolean) {
  if (itemY < CATCH_Y_MIN || itemY > CATCH_Y_MAX) return false;
  const rx = isTarget ? CATCH_TARGET_RX : CATCH_OBSTACLE_RX;
  return Math.abs(itemX - basketX) < rx;
}

export function FallingEngine({ spec, onEnd, mode, photoPreview, albumPhotos }: EngineProps & { mode: GameEngine }) {
  const playMode =
    mode === "falling_swarm" ? "swarm" : mode === "falling_tap_clear" ? "tap_dodge" : "catch";

  const [ready, setReady] = useState(false);
  const [playerX, setPlayerX] = useState(50);
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(resetCombo);
  const idRef = useRef(0);
  const playerRef = useRef(50);
  const comboRef = useRef(resetCombo());
  const spawnAccRef = useRef(0);
  const elapsedRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { burst, PopLayer } = usePopBursts();
  const active = ready;

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(active, spec.duration, finish);

  useEffect(() => {
    statsRef.current = { score, misses };
    comboRef.current = combo;
  }, [score, misses, combo]);

  const movePlayer = useCallback((clientX: number) => {
    if (playMode === "swarm") return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(12, Math.min(88, ((clientX - rect.left) / rect.width) * 100));
    playerRef.current = x;
    setPlayerX(x);
  }, [playMode]);

  const nudge = useCallback((dir: -1 | 1) => {
    if (playMode === "swarm") return;
    setPlayerX((x) => {
      const nx = Math.max(12, Math.min(88, x + dir * 8));
      playerRef.current = nx;
      return nx;
    });
  }, [playMode]);

  const tapItem = useCallback(
    (id: number) => {
      setItems((prev) => {
        const it = prev.find((i) => i.id === id);
        if (!it) return prev;
        if (playMode === "swarm") {
          if (it.isTarget) {
            const c = bumpCombo(comboRef.current);
            comboRef.current = c;
            setCombo(c);
            const pts = 10 * c.multiplier;
            setScore((s) => s + pts);
            burst(it.x, it.y, `+${pts}`);
          } else {
            comboRef.current = resetCombo();
            setCombo(resetCombo());
            setMisses((m) => m + 1);
            burst(it.x, it.y, "×", "bad");
          }
          return prev.filter((i) => i.id !== id);
        }
        if (playMode === "tap_dodge" && !it.isTarget) {
          const c = bumpCombo(comboRef.current);
          comboRef.current = c;
          setCombo(c);
          setScore((s) => s + 14 * c.multiplier);
          burst(it.x, it.y, `+${14 * c.multiplier}`);
          return prev.filter((i) => i.id !== id);
        }
        return prev;
      });
    },
    [playMode, burst],
  );

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

  useGameLoop(active, (dt) => {
    elapsedRef.current += dt;
    const ramp = difficultyRamp(elapsedRef.current, spec.duration * 1000);
    const t = dt / 16.67;
    spawnAccRef.current += dt;
    const swarm = playMode === "swarm";
    const interval = spawnInterval(swarm ? 520 : 900, ramp, swarm ? 220 : 420);
    if (spawnAccRef.current > interval) {
      spawnAccRef.current = 0;
      idRef.current += 1;
      const isTarget =
        playMode === "tap_dodge" ? Math.random() < 0.25
        : swarm ? Math.random() < 0.82
        : Math.random() < 0.78 - ramp * 0.1;
      setItems((prev) => [
        ...prev,
        {
          id: idRef.current,
          x: 10 + Math.random() * 80,
          y: -8,
          vy: (0.3 + ramp * 0.35) * (swarm ? 1.2 : 1),
          vx: swarm ? (Math.random() - 0.5) * 0.08 : 0,
          isTarget,
          w: swarm ? 44 : 50,
        },
      ]);
    }

    const px = playerRef.current;
    setItems((prev) => {
      const next: Item[] = [];
      let miss = 0;
      for (const it of prev) {
        const y = it.y + it.vy * t;
        const x = Math.max(5, Math.min(95, it.x + it.vx * t));
        if (y > 105) {
          if (playMode === "catch" && it.isTarget) miss += 1;
          if (playMode === "tap_dodge" && !it.isTarget) miss += 1;
          continue;
        }
        if (playMode === "catch") {
          if (catchesBasket(x, y, px, it.isTarget)) {
            if (it.isTarget) {
              const c = bumpCombo(comboRef.current);
              comboRef.current = c;
              setCombo(c);
              setScore((s) => s + 12 * c.multiplier);
              burst(x, y, `+${12 * c.multiplier}`);
            } else {
              comboRef.current = resetCombo();
              setCombo(resetCombo());
              setMisses((m) => m + 1);
              setScore((s) => Math.max(0, s - SCORE_PENALTY));
              burst(x, y, `−${SCORE_PENALTY}`, "bad");
            }
            continue;
          }
        }
        next.push({ ...it, y, x });
      }
      if (miss) {
        comboRef.current = resetCombo();
        setCombo(resetCombo());
        setMisses((m) => m + miss);
        setScore((s) => Math.max(0, s - SCORE_PENALTY * miss));
        burst(px, CATCHER_Y, `−${SCORE_PENALTY * miss}`, "bad");
      }
      return next;
    });
  });

  const hint = spec.instruction;
  const showBasket = playMode === "catch";

  return (
    <div ref={containerRef} onPointerMove={(e) => movePlayer(e.clientX)} onPointerDown={(e) => movePlayer(e.clientX)}>
      <GameShell
        spec={spec}
        hint={hint}
        timeLeft={timeLeft}
        score={score}
        misses={misses}
        comboLabel={combo.count > 0 ? `×${combo.multiplier}` : undefined}
        ready={ready}
        onReady={() => setReady(true)}
        photoPreview={photoPreview}
        albumPhotos={albumPhotos}
      >
        <PopLayer />
        {showBasket && (
          <div
            className="absolute pointer-events-none z-[5] border-2 border-dashed border-white/35 rounded-2xl"
            style={{
              left: `${playerX - CATCH_TARGET_RX}%`,
              width: `${CATCH_TARGET_RX * 2}%`,
              top: `${CATCH_Y_MIN - 1}%`,
              height: `${CATCH_Y_MAX - CATCH_Y_MIN + 2}%`,
            }}
          />
        )}
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (playMode !== "catch") tapItem(it.id);
            }}
            className={`absolute z-10 flex items-center justify-center ${playMode !== "catch" ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              width: it.w,
              height: it.w,
              transform: "translate(-50%, -50%)",
              fontSize: it.w * 0.7,
              background: "transparent",
              border: "none",
            }}
          >
            {it.isTarget ? (
              <GameSprite
                spec={spec}
                role="target"
                albumPhotos={albumPhotos}
                emoji={spec.targetEmoji}
                size={it.w}
              />
            ) : (
              <GameSprite
                spec={spec}
                role="obstacle"
                albumPhotos={albumPhotos}
                emoji={spec.obstacleEmoji}
                size={it.w}
              />
            )}
          </button>
        ))}
        {showBasket && (
          <div
            className="absolute z-30 flex h-16 w-16 items-center justify-center rounded-full border-2 border-riso-ink bg-background/95 pointer-events-none"
            style={{ left: `${playerX}%`, top: `${CATCHER_Y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="text-3xl">🧺</span>
          </div>
        )}
        {playMode !== "swarm" && (
          <div className="absolute bottom-4 left-0 right-0 z-40 flex justify-center gap-3 px-4">
            <button type="button" onPointerDown={() => nudge(-1)} className="sticker flex-1 max-w-[120px] bg-background py-4 font-display text-lg min-h-[52px]">←</button>
            <button type="button" onPointerDown={() => nudge(1)} className="sticker flex-1 max-w-[120px] bg-background py-4 font-display text-lg min-h-[52px]">→</button>
          </div>
        )}
      </GameShell>
    </div>
  );
}
