import { useEffect, useRef, useState } from "react";
import { JournalAlbumBackdrop } from "./JournalAlbumBackdrop";
import type { JourneyBeat } from "./templates/types";
import { JOURNEY_FLASH_LABELS } from "@/lib/mnemoGameCopy";

/** Periodic memory flashes during gameplay — bottom toast, never stacks with HUD */
export function useJourneyFlashes(active: boolean, beat?: JourneyBeat, intervalMs = 16000) {
  const [visible, setVisible] = useState(false);
  const [labelIndex, setLabelIndex] = useState(0);
  const flashCount = useRef(0);

  useEffect(() => {
    if (!active || !beat?.moment) {
      setVisible(false);
      setLabelIndex(0);
      flashCount.current = 0;
      return;
    }
    const show = () => {
      setLabelIndex(flashCount.current);
      flashCount.current += 1;
      setVisible(true);
    };
    const first = window.setTimeout(show, 9000);
    const loop = window.setInterval(show, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
  }, [active, beat?.moment, intervalMs]);

  useEffect(() => {
    if (!visible) return;
    const hide = window.setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(hide);
  }, [visible]);

  return { visible, labelIndex };
}

export function JourneyPhotoBackdrop({
  photo,
  photos,
  tint,
}: {
  photo?: string;
  photos?: string[];
  tint?: string;
}) {
  const list = photos?.length ? photos : photo ? [photo] : [];
  return <JournalAlbumBackdrop photos={list} mode="play" tint={tint} />;
}

export function JourneyBeatFlash({
  beat,
  visible,
  labelIndex = 0,
}: {
  beat: JourneyBeat;
  photo?: string;
  visible: boolean;
  labelIndex?: number;
}) {
  if (!visible) return null;

  const moment = beat.moment.trim();
  const clipped = moment.length > 72 ? `${moment.slice(0, 72)}…` : moment;
  const label = JOURNEY_FLASH_LABELS[labelIndex % JOURNEY_FLASH_LABELS.length];

  return (
    <div
      className="pointer-events-none absolute left-3 right-3 bottom-[10.5rem] z-[25] flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="status"
    >
      <div className="max-w-[min(100%,280px)] rounded-xl border border-white/25 bg-black/55 backdrop-blur-md px-3 py-2.5 shadow-lg">
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-riso-cyan mb-1">{label}</p>
        <p className="font-mono text-sm leading-snug text-white line-clamp-2 tracking-wide">&ldquo;{clipped}&rdquo;</p>
      </div>
    </div>
  );
}

export function JourneyGoalStrip({ beat }: { beat: JourneyBeat }) {
  return (
    <div className="pointer-events-none absolute bottom-[7.25rem] left-0 right-0 z-20 flex justify-center px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm border border-white/10">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">CATCH</span>
        <span className="font-display text-sm text-riso-yellow">{beat.treasure}</span>
        <span className="text-white/30 hidden sm:inline">·</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">DODGE</span>
        <span className="font-display text-sm text-riso-pink">{beat.villain}</span>
      </div>
    </div>
  );
}
