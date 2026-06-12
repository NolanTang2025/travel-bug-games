import { useCallback, useEffect, useRef, useState } from "react";
import { SCORE_PENALTY, usePenaltyFeedback } from "../../GamePenaltyFeedback";
import { usePopBursts } from "../../PopBurst";
import { useGameLoop } from "../../useGameLoop";
import { bumpCombo, difficultyRamp, resetCombo, spawnInterval } from "../../gameUtils";
import { getPenaltyCopy } from "@/lib/mnemoGameCopy";
import { GameShell, useGameTimer, type EngineProps } from "./shared";
import { GameCatchLane, GameJarSprite, GamePlayAtmosphere } from "../../GamePlayChrome";
import { GameSprite } from "../../GameSprite";

const LANES = [25, 50, 75];

/** Hold to advance during safe windows; release when danger hits */
export function HoldCrossEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const beat = spec.journeyBeat;
  const safeLabel = beat?.safeLabel ?? "GO";
  const dangerLabel = beat?.dangerLabel ?? "STOP";
  const treasure = beat?.treasure ?? "Finish line";

  const [ready, setReady] = useState(false);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [light, setLight] = useState<"walk" | "wait">("walk");
  const [hazards, setHazards] = useState<{ id: number; x: number; y: number; vy: number }[]>([]);
  const hazardId = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });
  const holdingRef = useRef(false);
  const lightRef = useRef<"walk" | "wait">("walk");
  const spawnAcc = useRef(0);
  const { punish, PenaltyLayer, shake, isStunned } = usePenaltyFeedback();
  const { burst, PopLayer } = usePopBursts();
  const villain = beat?.villain ?? "obstacles";
  const penaltyCooldown = useRef(0);
  const dangerHoldPenalized = useRef(false);

  const applyPenalty = useCallback(
    (kind: "danger" | "hit") => {
      const now = Date.now();
      if (now < penaltyCooldown.current) return;
      penaltyCooldown.current = now + 900;
      setMisses((m) => {
        statsRef.current.misses = m + 1;
        return m + 1;
      });
      setScore((s) => {
        const next = Math.max(0, s - SCORE_PENALTY);
        statsRef.current.score = next;
        return next;
      });
      setProgress(0);
      setHolding(false);
      holdingRef.current = false;
      burst(50, 52, `−${SCORE_PENALTY}`, "bad");
      const copy = getPenaltyCopy(spec);
      if (kind === "danger") {
        punish(`${dangerLabel} — don't force it`, `Wait for "${safeLabel}" before holding · ${copy.detail}`);
      } else {
        punish(`${villain} got you`, copy.detail);
      }
    },
    [burst, punish, safeLabel, dangerLabel, villain, spec],
  );

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);

  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);
  useEffect(() => {
    holdingRef.current = holding;
    if (!holding) dangerHoldPenalized.current = false;
  }, [holding]);
  useEffect(() => {
    lightRef.current = light;
  }, [light]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => setLight((l) => (l === "walk" ? "wait" : "walk")), 2600);
    return () => window.clearInterval(id);
  }, [ready]);

  useGameLoop(ready, (dt) => {
    if (lightRef.current === "wait") {
      spawnAcc.current += dt;
      if (spawnAcc.current > 320) {
        spawnAcc.current = 0;
        hazardId.current += 1;
        setHazards((h) => [
          ...h.slice(-14),
          { id: hazardId.current, x: 12 + Math.random() * 76, y: -8, vy: 0.35 + Math.random() * 0.2 },
        ]);
      }
    } else {
      spawnAcc.current = 0;
    }

    setHazards((prev) => {
      const next: typeof prev = [];
      let hit = false;
      for (const hz of prev) {
        const y = hz.y + hz.vy * (dt / 16.67);
        if (y > 105) continue;
        if (holdingRef.current && y > 42 && y < 62 && Math.abs(hz.x - 50) < 18) {
          hit = true;
          continue;
        }
        next.push({ ...hz, y });
      }
      if (hit) {
        applyPenalty("hit");
      }
      return next;
    });

    if (holdingRef.current && !isStunned()) {
      if (lightRef.current === "walk") {
        setProgress((p) => {
          const n = Math.min(100, p + dt * 0.045);
          if (n >= 100) {
            setScore((s) => {
              const next = s + 50;
              statsRef.current.score = next;
              return next;
            });
            burst(50, 48, "+50");
            return 0;
          }
          return n;
        });
      } else if (!dangerHoldPenalized.current) {
        dangerHoldPenalized.current = true;
        applyPenalty("danger");
      }
    }
  });

  return (
    <GameShell
      spec={spec}
      hint={spec.instruction}
      timeLeft={timeLeft}
      score={score}
      misses={misses}
      ready={ready}
      onReady={() => setReady(true)}
      photoPreview={photoPreview}
      albumPhotos={albumPhotos}
      showGoalStrip
    >
      <div className={shake ? "game-screen-shake h-full w-full" : "h-full w-full"}>
      <PenaltyLayer />
      <PopLayer />
      <div
        className={[
          "absolute top-[6.75rem] left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full font-display text-sm sm:text-base border-2 shadow-pop-sm transition-colors",
          light === "walk"
            ? "bg-emerald-500/95 text-white border-emerald-300/50"
            : "bg-rose-600/95 text-white border-rose-300/50 animate-pulse",
        ].join(" ")}
      >
        {light === "walk" ? safeLabel : dangerLabel}
      </div>

      <p className="absolute top-[32%] w-full text-center font-mono text-[10px] uppercase tracking-widest text-white/50">
        Chase {treasure}
      </p>

      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 w-[85%] max-w-sm">
        <div className="h-3 rounded-full bg-white/15 overflow-hidden border border-white/20">
          <div className="h-full bg-riso-yellow transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-white/50 uppercase tracking-wider">
          {Math.round(progress)}% to next checkpoint
        </p>
      </div>

      {hazards.map((hz) => (
        <span
          key={hz.id}
          className="absolute text-2xl sm:text-3xl pointer-events-none drop-shadow-md"
          style={{ left: `${hz.x}%`, top: `${hz.y}%`, transform: "translate(-50%, -50%)" }}
        >
          {spec.obstacleEmoji}
        </span>
      ))}

      <div
        className="absolute top-[56%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 transition-transform"
        style={{ transform: `translate(-50%, -50%) scale(${holding && light === "walk" ? 1.08 : 1})` }}
      >
        <span className="text-5xl sm:text-6xl drop-shadow-lg">{spec.targetEmoji}</span>
        {holding && light === "walk" && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-riso-yellow">+momentum</span>
        )}
      </div>

      <button
        type="button"
        disabled={isStunned()}
        className={[
          "absolute bottom-16 left-1/2 -translate-x-1/2 w-[min(220px,70vw)] py-5 rounded-full font-display text-lg border-2 border-riso-ink shadow-pop transition-colors",
          isStunned()
            ? "bg-riso-ink/40 text-white/50 cursor-not-allowed"
            : holding
              ? "bg-riso-yellow text-riso-ink active:scale-95"
              : "bg-riso-pink text-background active:scale-95",
        ].join(" ")}
        onPointerDown={() => {
          if (!isStunned()) setHolding(true);
        }}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
      >
        {isStunned() ? "Stunned…" : holding ? "Release to brake" : "Hold to advance"}
      </button>
      </div>
    </GameShell>
  );
}

/** 拖动罐子收集 */
export function DragJarEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [cx, setCx] = useState(50);
  const [items, setItems] = useState<{ id: number; x: number; y: number; vy: number; bad: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(resetCombo);
  const idRef = useRef(0);
  const cxRef = useRef(50);
  const spawnRef = useRef(0);
  const elapsedRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const { burst, PopLayer } = usePopBursts();

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);

  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  const move = useCallback((clientX: number) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(15, Math.min(85, ((clientX - r.left) / r.width) * 100));
    cxRef.current = x;
    setCx(x);
  }, []);

  useGameLoop(ready, (dt) => {
    elapsedRef.current += dt;
    const ramp = difficultyRamp(elapsedRef.current, spec.duration * 1000);
    spawnRef.current += dt;
    if (spawnRef.current > spawnInterval(700, ramp, 320)) {
      spawnRef.current = 0;
      idRef.current += 1;
      setItems((p) => [
        ...p,
        { id: idRef.current, x: 15 + Math.random() * 70, y: -5, vy: 0.4 + ramp * 0.2, bad: Math.random() < 0.3 },
      ]);
    }
    const x = cxRef.current;
    setItems((prev) => {
      const next: typeof prev = [];
      let miss = 0;
      for (const it of prev) {
        const y = it.y + it.vy * (dt / 16.67);
        if (y > 88) {
          if (!it.bad) miss += 1;
          continue;
        }
        if (y > 68 && Math.abs(it.x - x) < 12) {
          if (it.bad) {
            setMisses((m) => m + 1);
            burst(it.x, y, "!", "bad");
          } else {
            const c = bumpCombo(combo);
            setCombo(c);
            setScore((s) => s + 12 * c.multiplier);
            burst(it.x, y, `+${12 * c.multiplier}`);
          }
          continue;
        }
        next.push({ ...it, y });
      }
      if (miss) setMisses((m) => m + miss);
      return next;
    });
  });

  return (
    <div ref={boxRef} onPointerMove={(e) => move(e.clientX)} onPointerDown={(e) => move(e.clientX)}>
      <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
        <PopLayer />
        <GameCatchLane topPercent={64} heightPercent={18} />
        {items.map((it) => (
          <div
            key={it.id}
            className="absolute z-10 pointer-events-none"
            style={{ left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%,-50%)" }}
          >
            <GameSprite
              spec={spec}
              role={it.bad ? "obstacle" : "target"}
              albumPhotos={albumPhotos}
              emoji={it.bad ? spec.obstacleEmoji : spec.targetEmoji}
              size={it.bad ? 44 : 52}
            />
          </div>
        ))}
        <div className="absolute z-20 transition-[left] duration-75 ease-out" style={{ left: `${cx}%`, top: "72%", transform: "translate(-50%,-50%)" }}>
          <GameJarSprite size="md" />
        </div>
        <p className="game-play-footer-hint">{spec.instruction}</p>
      </GameShell>
    </div>
  );
}

/** 三轨道换道 */
export function LanesEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [lane, setLane] = useState(1);
  const [obs, setObs] = useState<{ id: number; lane: number; y: number; vy: number; good: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(0);
  const spawnRef = useRef(0);
  const elapsedRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useGameLoop(ready, (dt) => {
    elapsedRef.current += dt;
    const ramp = difficultyRamp(elapsedRef.current, spec.duration * 1000);
    spawnRef.current += dt;
    if (spawnRef.current > spawnInterval(800, ramp, 380)) {
      spawnRef.current = 0;
      idRef.current += 1;
      const good = Math.random() < 0.55;
      setObs((p) => [...p, { id: idRef.current, lane: Math.floor(Math.random() * 3), y: -5, vy: 0.45 + ramp * 0.25, good }]);
    }
    setObs((prev) => {
      const next: typeof prev = [];
      let miss = 0;
      for (const o of prev) {
        const y = o.y + o.vy * (dt / 16.67);
        if (y > 95) {
          if (o.good && o.lane === lane) miss += 1;
          continue;
        }
        if (y > 75 && y < 90 && o.lane === lane) {
          if (o.good) setScore((s) => s + 18);
          else {
            miss += 1;
            setMisses((m) => m + 1);
          }
          continue;
        }
        next.push({ ...o, y });
      }
      if (miss) setMisses((m) => m + miss);
      return next;
    });
  });

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      <div className="absolute inset-x-[10%] top-[20%] bottom-[22%] flex justify-between pointer-events-none opacity-30">
        {LANES.map((l) => (
          <div key={l} className="w-px h-full bg-white" style={{ marginLeft: l === 25 ? 0 : undefined }} />
        ))}
      </div>
      {obs.map((o) => (
        <span key={o.id} className="absolute text-3xl" style={{ left: `${LANES[o.lane]}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)" }}>
          {o.good ? spec.targetEmoji : spec.obstacleEmoji}
        </span>
      ))}
      <div className="absolute text-4xl z-20" style={{ left: `${LANES[lane]}%`, top: "82%", transform: "translate(-50%,-50%)" }}>🧍</div>
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30 px-4">
        {[0, 1, 2].map((i) => (
          <button key={i} type="button" onClick={() => setLane(i)} className={`sticker flex-1 py-4 font-display text-lg ${lane === i ? "bg-riso-yellow" : "bg-background/80"}`}>
            {i === 0 ? "←" : i === 2 ? "→" : "·"}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/** 目标经过中央取景框时点击 */
export function ShutterEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [targetX, setTargetX] = useState(20);
  const [dir, setDir] = useState(1);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState(false);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useGameLoop(ready, (dt) => {
    setTargetX((x) => {
      let nx = x + dir * dt * 0.04;
      if (nx > 88) {
        setDir(-1);
        nx = 88;
      }
      if (nx < 12) {
        setDir(1);
        nx = 12;
      }
      return nx;
    });
  });

  const snap = () => {
    if (targetX >= 38 && targetX <= 62) {
      setScore((s) => s + 22);
      statsRef.current.score += 22;
      setFlash(true);
      setTimeout(() => setFlash(false), 120);
    } else {
      setMisses((m) => m + 1);
      statsRef.current.misses += 1;
    }
  };

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      <div className="absolute left-[30%] right-[30%] top-[25%] bottom-[35%] border-4 border-white/70 rounded-lg pointer-events-none" />
      <span className="absolute text-5xl transition-opacity" style={{ left: `${targetX}%`, top: "48%", transform: "translate(-50%,-50%)", opacity: flash ? 0.3 : 1 }}>
        {spec.targetEmoji}
      </span>
      <button type="button" onClick={snap} className="absolute bottom-16 left-1/2 -translate-x-1/2 px-10 py-5 rounded-full bg-background font-display text-xl border-2 border-riso-ink">
        📷 SHUTTER
      </button>
    </GameShell>
  );
}

/** 风向箭头，点对应方向 */
export function SwipeWindEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [cue, setCue] = useState<"left" | "right">("left");
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timer, setTimer] = useState(0);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      setCue(Math.random() < 0.5 ? "left" : "right");
      setTimer(0);
    }, 1400);
    return () => window.clearInterval(id);
  }, [ready]);

  useGameLoop(ready, (dt) => {
    setTimer((t) => t + dt);
  });

  const answer = (side: "left" | "right") => {
    if (timer > 1200) {
      setMisses((m) => m + 1);
      statsRef.current.misses += 1;
      return;
    }
    if (side === cue) {
      setScore((s) => s + 16);
      statsRef.current.score += 16;
    } else {
      setMisses((m) => m + 1);
      statsRef.current.misses += 1;
    }
    setCue(Math.random() < 0.5 ? "left" : "right");
    setTimer(0);
  };

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      <p className="absolute top-28 w-full text-center text-6xl">{cue === "left" ? "←" : "→"}</p>
      <p className="absolute top-[42%] w-full text-center text-5xl">{spec.obstacleEmoji}</p>
      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-6 px-6">
        <button type="button" onClick={() => answer("left")} className="sticker flex-1 py-5 text-2xl bg-background">←</button>
        <button type="button" onClick={() => answer("right")} className="sticker flex-1 py-5 text-2xl bg-background">→</button>
      </div>
    </GameShell>
  );
}

/** 三列节奏点击 */
export function RhythmEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [lit, setLit] = useState(1);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => setLit(Math.floor(Math.random() * 3)), 900);
    return () => window.clearInterval(id);
  }, [ready]);

  const tap = (col: number) => {
    if (col === lit) {
      setScore((s) => s + 14);
      statsRef.current.score += 14;
    } else {
      setMisses((m) => m + 1);
      statsRef.current.misses += 1;
    }
  };

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      <div className="absolute left-[12%] right-[12%] top-[30%] flex justify-between gap-4">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            className={`flex-1 aspect-square rounded-2xl border-2 text-4xl flex items-center justify-center ${lit === i ? "bg-riso-yellow border-riso-ink scale-105" : "bg-white/10 border-white/30"}`}
          >
            {spec.targetEmoji}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/** 上下移动接靠边奖励 */
export function TramSidesEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [py, setPy] = useState(50);
  const [bonus, setBonus] = useState<{ id: number; side: "l" | "r"; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(0);
  const spawnRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useGameLoop(ready, (dt) => {
    spawnRef.current += dt;
    if (spawnRef.current > 1100) {
      spawnRef.current = 0;
      idRef.current += 1;
      const side = Math.random() < 0.5 ? "l" : "r";
      setBonus((p) => [...p, { id: idRef.current, side, y: -5 }]);
    }
    setBonus((prev) => {
      const next: typeof prev = [];
      let miss = 0;
      for (const b of prev) {
        const y = b.y + 0.35 * (dt / 16.67);
        if (y > 100) {
          miss += 1;
          continue;
        }
        const match = (b.side === "l" && py < 40) || (b.side === "r" && py > 60);
        if (y > 70 && y < 95 && match) {
          setScore((s) => s + 20);
          continue;
        }
        next.push({ ...b, y });
      }
      if (miss) setMisses((m) => m + miss);
      return next;
    });
  });

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      {bonus.map((b) => (
        <span key={b.id} className="absolute text-3xl" style={{ left: b.side === "l" ? "12%" : "88%", top: `${b.y}%`, transform: "translate(-50%,-50%)" }}>
          {spec.targetEmoji}
        </span>
      ))}
      <div className="absolute text-4xl z-20" style={{ left: "50%", top: `${py}%`, transform: "translate(-50%,-50%)" }}>🚃</div>
      <div className="absolute bottom-8 left-0 right-0 flex flex-col gap-3 px-8 z-30">
        <button type="button" onClick={() => setPy((y) => Math.max(15, y - 12))} className="sticker py-3 bg-background font-display">↑</button>
        <button type="button" onClick={() => setPy((y) => Math.min(85, y + 12))} className="sticker py-3 bg-background font-display">↓</button>
      </div>
    </GameShell>
  );
}

/** 随机位置弹出，限时点击 */
export function PhotoPopEngine({ spec, onEnd, photoPreview, albumPhotos }: EngineProps) {
  const [ready, setReady] = useState(false);
  const [pop, setPop] = useState<{ id: number; x: number; y: number; ttl: number } | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const idRef = useRef(0);
  const accRef = useRef(0);
  const statsRef = useRef({ score: 0, misses: 0 });

  const finish = useCallback(() => onEnd(statsRef.current), [onEnd]);
  const timeLeft = useGameTimer(ready, spec.duration, finish);
  useEffect(() => {
    statsRef.current = { score, misses };
  }, [score, misses]);

  useGameLoop(ready, (dt) => {
    accRef.current += dt;
    if (!pop && accRef.current > 600) {
      accRef.current = 0;
      idRef.current += 1;
      setPop({ id: idRef.current, x: 20 + Math.random() * 60, y: 25 + Math.random() * 45, ttl: 900 });
    }
    if (pop) {
      setPop((p) => {
        if (!p) return null;
        const ttl = p.ttl - dt;
        if (ttl <= 0) {
          setMisses((m) => m + 1);
          statsRef.current.misses += 1;
          return null;
        }
        return { ...p, ttl };
      });
    }
  });

  const tapPop = () => {
    if (pop) {
      setScore((s) => s + 18);
      statsRef.current.score += 18;
      setPop(null);
      accRef.current = 0;
    }
  };

  return (
    <GameShell spec={spec} hint={spec.instruction} timeLeft={timeLeft} score={score} misses={misses} ready={ready} onReady={() => setReady(true)} photoPreview={photoPreview} albumPhotos={albumPhotos}>
      {pop && (
        <div
          className="absolute z-20 animate-pulse"
          style={{ left: `${pop.x}%`, top: `${pop.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <GameSprite
            spec={spec}
            role="target"
            albumPhotos={albumPhotos}
            emoji={spec.targetEmoji}
            size={72}
            onClick={tapPop}
            label="Catch flash"
          />
        </div>
      )}
      {!pop && <p className="absolute top-1/2 w-full text-center font-mono text-white/60 text-sm">Waiting for a pop…</p>}
    </GameShell>
  );
}
