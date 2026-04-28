import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import VinylRecord from "./VinylRecord";

export interface ActiveRecord {
  id: string;
  coverPhoto?: string | null;
  emoji?: string;
  labelBg?: string;
  title: string;
}

interface GramophonePlayerProps {
  activeRecord?: ActiveRecord | null;
  onPlayComplete?: () => void;
  className?: string;
}

export default function GramophonePlayer({
  activeRecord,
  onPlayComplete,
  className,
}: GramophonePlayerProps) {
  const [phase, setPhase] = useState<"idle" | "dropping" | "playing">("idle");
  const [showWaveform, setShowWaveform] = useState(false);

  useEffect(() => {
    if (!activeRecord) {
      setPhase("idle");
      setShowWaveform(false);
      return;
    }

    setPhase("dropping");
    const t1 = setTimeout(() => {
      setPhase("playing");
      setShowWaveform(true);
    }, 700);
    const t2 = setTimeout(() => {
      onPlayComplete?.();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeRecord?.id, onPlayComplete]);

  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.45, 0.75, 0.55, 0.95, 0.4];

  return (
    <div
      className={cn(
        "relative mx-auto flex flex-col items-center select-none",
        className
      )}
    >
      {/* Gramophone base */}
      <div className="gramophone-base w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] flex items-center justify-center">
        {/* Platter */}
        <div className="gramophone-platter w-[200px] h-[200px] sm:w-[230px] sm:h-[230px] flex items-center justify-center">
          {/* Record or empty state */}
          {activeRecord ? (
            <div
              className={cn(
                "transition-all duration-500",
                phase === "dropping" && "animate-vinyl-lift"
              )}
            >
              <VinylRecord
                coverPhoto={activeRecord.coverPhoto}
                emoji={activeRecord.emoji}
                labelBg={activeRecord.labelBg}
                size="lg"
                spinning={phase === "playing"}
                className="w-[180px] sm:w-[200px]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <svg
                  className="w-6 h-6 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="font-data text-[9px] uppercase tracking-[0.2em]">
                Place memory disc
              </span>
            </div>
          )}
        </div>

        {/* Tonearm */}
        <div
          className={cn(
            "gramophone-arm",
            phase === "playing" && "dropped"
          )}
        />

        {/* LED ring */}
        <div
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
            phase === "playing" ? "gramophone-led active" : "gramophone-led"
          )}
        />
      </div>

      {/* Waveform */}
      {showWaveform && (
        <div className="mt-4 flex items-end justify-center gap-[3px] h-8">
          {bars.map((h, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{
                height: `${h * 100}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Title below */}
      {activeRecord && phase === "playing" && (
        <p className="mt-3 font-data text-[10px] uppercase tracking-[0.18em] text-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
          Now playing · {activeRecord.title}
        </p>
      )}
    </div>
  );
}
