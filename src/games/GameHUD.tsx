import { useEffect, useState } from "react";

type Pill = { key: string; label: string; className?: string };

export function GameHUD({
  hint,
  pills,
  onHintDismiss,
}: {
  hint?: string;
  pills: Pill[];
  onHintDismiss?: () => void;
}) {
  const [showHint, setShowHint] = useState(Boolean(hint));

  useEffect(() => {
    if (!hint) return;
    setShowHint(true);
    const t = setTimeout(() => {
      setShowHint(false);
      onHintDismiss?.();
    }, 5000);
    return () => clearTimeout(t);
  }, [hint, onHintDismiss]);

  const dismissHint = () => {
    setShowHint(false);
    onHintDismiss?.();
  };

  return (
    <>
      <div className="absolute top-16 left-0 right-0 z-30 flex justify-center gap-2 font-mono text-xs sm:text-sm flex-wrap px-2 pointer-events-none">
        {pills.map((p) => (
          <span
            key={p.key}
            className={`px-2.5 py-1 rounded-full shadow-pop-sm ${p.className ?? "bg-black/50 text-white"}`}
          >
            {p.label}
          </span>
        ))}
      </div>

      {hint && showHint && (
        <button
          type="button"
          onClick={dismissHint}
          className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-30 max-w-xs sm:max-w-md sticker-sm bg-background text-riso-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-500"
        >
          {hint}
        </button>
      )}
    </>
  );
}
