import { useEffect, useState } from "react";

const STEPS = ["3", "2", "1", "Go!"] as const;

export function GameCountdown({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= STEPS.length) {
      onDone();
      return;
    }
    const delay = idx === STEPS.length - 1 ? 650 : 750;
    const t = setTimeout(() => setIdx((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [idx, onDone]);

  if (idx >= STEPS.length) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-riso-ink/40 backdrop-blur-sm pointer-events-none">
      <span
        key={idx}
        className="font-display text-6xl sm:text-8xl text-white drop-shadow-[4px_4px_0_var(--riso-pink)] animate-in zoom-in-50 fade-in duration-300"
      >
        {STEPS[idx]}
      </span>
    </div>
  );
}
