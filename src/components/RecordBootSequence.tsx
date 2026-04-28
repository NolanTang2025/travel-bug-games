import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import VinylRecord from "./VinylRecord";

interface RecordBootSequenceProps {
  coverPhoto?: string | null;
  emoji?: string;
  labelBg?: string;
  title?: string;
  onComplete?: () => void;
  className?: string;
}

export default function RecordBootSequence({
  coverPhoto,
  emoji,
  labelBg,
  title = "Loading...",
  onComplete,
  className,
}: RecordBootSequenceProps) {
  const [phase, setPhase] = useState<"fade-in" | "arm-drop" | "spin" | "typing" | "fade-out">("fade-in");
  const [typedTitle, setTypedTitle] = useState("");
  const hasCompleted = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase("arm-drop"), 400));
    timers.push(setTimeout(() => setPhase("spin"), 1100));
    timers.push(setTimeout(() => setPhase("typing"), 1800));
    timers.push(setTimeout(() => setPhase("fade-out"), 3200 + title.length * 60));
    timers.push(
      setTimeout(() => {
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onComplete?.();
        }
      }, 3800 + title.length * 60)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete, title]);

  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedTitle(title.slice(0, i));
      if (i >= title.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [phase, title]);

  const bars = [0.35, 0.6, 0.9, 0.5, 0.8, 0.4, 0.95, 0.55, 0.75, 0.45, 0.85, 0.5, 0.7, 0.4];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-700",
        phase === "fade-out" && "opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 16% 42%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 16% 42%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Record */}
        <div
          className={cn(
            "transition-all duration-700",
            phase === "fade-in" && "scale-90 opacity-0",
            phase !== "fade-in" && "scale-100 opacity-100"
          )}
        >
          <div className="relative">
            <VinylRecord
              coverPhoto={coverPhoto}
              emoji={emoji}
              labelBg={labelBg}
              size="lg"
              spinning={phase === "spin" || phase === "typing" || phase === "fade-out"}
              className="w-[220px] sm:w-[260px]"
            />

            {/* Tonearm overlay for boot sequence */}
            <div
              className={cn(
                "absolute top-[5%] right-[10%] w-1.5 rounded-full origin-top transition-transform duration-700",
                "bg-gradient-to-b from-neutral-400 to-neutral-500 shadow-md"
              )}
              style={{
                height: "45%",
                transform:
                  phase === "arm-drop" || phase === "spin" || phase === "typing" || phase === "fade-out"
                    ? "rotate(28deg)"
                    : "rotate(0deg)",
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-neutral-400 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Waveform */}
        {(phase === "spin" || phase === "typing" || phase === "fade-out") && (
          <div className="mt-6 flex items-end justify-center gap-[3px] h-6">
            {bars.map((h, i) => (
              <div
                key={i}
                className="waveform-bar"
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Typing title */}
        {phase === "typing" && (
          <div className="mt-5 font-data text-sm sm:text-base text-foreground tracking-wide">
            <span className="text-primary">{typedTitle}</span>
            <span className="animate-pulse text-primary">_</span>
          </div>
        )}

        {phase === "fade-out" && typedTitle && (
          <div className="mt-5 font-data text-sm sm:text-base text-primary tracking-wide">
            {typedTitle}
          </div>
        )}
      </div>
    </div>
  );
}
