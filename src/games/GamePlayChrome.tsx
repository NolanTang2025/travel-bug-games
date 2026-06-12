/** Shared in-game visuals — jar catcher, catch lane, atmosphere. */

export function GamePlayAtmosphere({ tint }: { tint?: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        style={{
          background:
            tint ??
            "radial-gradient(ellipse 120% 80% at 50% 0%, oklch(0.45 0.14 280 / 0.55), transparent 55%), radial-gradient(ellipse 90% 60% at 50% 100%, oklch(0.22 0.06 260 / 0.85), oklch(0.12 0.04 250))",
        }}
      />
      <div className="game-play-vignette pointer-events-none absolute inset-0 z-[1]" />
      <div className="game-play-stars pointer-events-none absolute inset-0 z-[1]" aria-hidden />
    </>
  );
}

export function GameCatchLane({ topPercent = 70, heightPercent = 18 }: { topPercent?: number; heightPercent?: number }) {
  return (
    <div
      className="game-catch-lane pointer-events-none absolute left-[8%] right-[8%] z-[5]"
      style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
    >
      <div className="game-catch-lane-glow" />
      <div className="game-catch-lane-inner" />
    </div>
  );
}

export function GameJarSprite({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <div className={size === "lg" ? "game-jar game-jar-lg" : "game-jar game-jar-md"} aria-hidden>
      <div className="game-jar-lid" />
      <div className="game-jar-neck" />
      <div className="game-jar-glass">
        <div className="game-jar-shine" />
        <div className="game-jar-glow" />
      </div>
    </div>
  );
}

export function GameFlyTarget({
  emoji,
  size = 56,
  onClick,
  label,
}: {
  emoji: string;
  size?: number;
  onClick?: () => void;
  label?: string;
}) {
  const body = (
    <span className="game-fly-target-emoji">{emoji}</span>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="game-fly-target inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={label ?? "Catch"}
      >
        {body}
      </button>
    );
  }
  return (
    <span
      className="game-fly-target game-fly-target-static inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {body}
    </span>
  );
}
