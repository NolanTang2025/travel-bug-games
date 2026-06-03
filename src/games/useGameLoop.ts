import { useEffect, useRef } from "react";

/** Delta-time game loop (ms capped to avoid huge jumps after tab blur). */
export function useGameLoop(active: boolean, onTick: (dt: number) => void) {
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      tickRef.current(dt);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
