import { useEffect, useRef, useState } from "react";
import { GameCountdown } from "../../GameCountdown";
import { GameHUD } from "../../GameHUD";
import { GamePlayAtmosphere } from "../../GamePlayChrome";
import {
  JourneyBeatFlash,
  JourneyGoalStrip,
  JourneyPhotoBackdrop,
  useJourneyFlashes,
} from "../../JourneyBeatLayer";
import { MnemoLevelStamp } from "@/components/MnemoLevelStamp";
import type { AIGameTemplateSpec } from "../types";

export type EngineProps = {
  spec: AIGameTemplateSpec;
  onEnd: (r: { score: number; misses: number }) => void;
  photoPreview?: string;
  albumPhotos?: string[];
};

export function useGameTimer(active: boolean, duration: number, onEnd: () => void) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const endedRef = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    endedRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      if (!endedRef.current) {
        endedRef.current = true;
        onEnd();
      }
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [timeLeft, active, onEnd]);

  return timeLeft;
}

export function GameShell({
  spec,
  hint,
  timeLeft,
  score,
  misses,
  comboLabel,
  ready,
  onReady,
  photoPreview,
  albumPhotos,
  showGoalStrip = true,
  children,
}: {
  spec: AIGameTemplateSpec;
  hint: string;
  timeLeft: number;
  score: number;
  misses: number;
  comboLabel?: string;
  ready: boolean;
  onReady: () => void;
  photoPreview?: string;
  albumPhotos?: string[];
  showGoalStrip?: boolean;
  children: React.ReactNode;
}) {
  const beat = spec.journeyBeat;
  const { visible: flash, labelIndex } = useJourneyFlashes(ready, beat);
  const photos = albumPhotos?.length ? albumPhotos : photoPreview ? [photoPreview] : [];

  return (
    <div
      className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden touch-none"
      style={{ background: spec.background }}
    >
      <JourneyPhotoBackdrop photos={photos} tint={spec.background} />
      <GamePlayAtmosphere tint={spec.background} />
      {!ready && <GameCountdown onDone={onReady} />}
      <div className="absolute top-3 left-0 right-0 z-40 flex justify-center pointer-events-none opacity-40">
        <MnemoLevelStamp variant="play" className="text-white/45" />
      </div>
      <GameHUD
        hint={beat ? undefined : hint}
        pills={[
          { key: "time", label: `⏱ ${timeLeft}s` },
          { key: "score", label: `${score}`, className: "bg-riso-yellow text-riso-ink" },
          ...(comboLabel
            ? [{ key: "combo", label: comboLabel, className: "bg-riso-cyan/90 text-riso-ink" }]
            : []),
          { key: "miss", label: `miss ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />
      {beat && <JourneyBeatFlash beat={beat} visible={flash} labelIndex={labelIndex} />}
      {beat && showGoalStrip && <JourneyGoalStrip beat={beat} />}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
