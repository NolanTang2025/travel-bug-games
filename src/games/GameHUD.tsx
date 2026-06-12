import { useEffect, useState } from "react";
import { isEmbedMode } from "@/lib/embedMode";

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
  const embed =
    typeof window !== "undefined" && isEmbedMode(window.location.search);

  useEffect(() => {
    if (!hint) return;
    setShowHint(true);
    const t = setTimeout(() => {
      setShowHint(false);
      onHintDismiss?.();
    }, 4500);
    return () => clearTimeout(t);
  }, [hint, onHintDismiss]);

  const dismissHint = () => {
    setShowHint(false);
    onHintDismiss?.();
  };

  return (
    <>
      <div
        className={[
          "game-hud-bar absolute left-3 right-3 z-30 pointer-events-none",
          embed ? "top-[3.75rem]" : "top-3",
        ].join(" ")}
      >
        <div className="game-hud-inner">
          {pills.map((p) => (
            <span key={p.key} className={`game-hud-pill ${p.className ?? ""}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {hint && showHint && (
        <button
          type="button"
          onClick={dismissHint}
          className={[
            "absolute left-1/2 z-30 max-w-[min(92vw,22rem)] -translate-x-1/2 pointer-events-auto",
            "game-hud-hint animate-in fade-in slide-in-from-top-2 duration-500",
            embed ? "top-[6.5rem]" : "top-14",
          ].join(" ")}
        >
          {hint}
        </button>
      )}
    </>
  );
}
