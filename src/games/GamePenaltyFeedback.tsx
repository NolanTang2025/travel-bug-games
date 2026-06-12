import { useCallback, useRef, useState } from "react";

export const SCORE_PENALTY = 25;
export const STUN_MS = 1100;

type PenaltyState = {
  message: string;
  detail: string;
  until: number;
};

export function usePenaltyFeedback() {
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [banner, setBanner] = useState<PenaltyState | null>(null);
  const stunUntilRef = useRef(0);

  const isStunned = useCallback(() => Date.now() < stunUntilRef.current, []);

  const punish = useCallback((message: string, detail: string) => {
    stunUntilRef.current = Date.now() + STUN_MS;
    setShake(true);
    setFlash(true);
    setBanner({ message, detail, until: Date.now() + 1600 });
    window.setTimeout(() => setShake(false), 420);
    window.setTimeout(() => setFlash(false), 380);
    window.setTimeout(() => setBanner(null), 1650);
  }, []);

  const PenaltyLayer = () => (
    <>
      {flash && (
        <div
          className="pointer-events-none absolute inset-0 z-[60] bg-rose-600/35 animate-in fade-in duration-150"
          aria-hidden
        />
      )}
      {banner && (
        <div className="pointer-events-none absolute inset-x-4 top-[9.5rem] z-[55] flex justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-2xl border-2 border-riso-ink bg-background px-4 py-3 shadow-pop-lg max-w-sm text-center">
            <p className="font-display text-base uppercase tracking-wide text-riso-pink">{banner.message}</p>
            <p className="mt-1 font-mono text-[11px] text-riso-ink/80">{banner.detail}</p>
          </div>
        </div>
      )}
    </>
  );

  return { punish, PenaltyLayer, shake, isStunned, stunUntilRef };
}
