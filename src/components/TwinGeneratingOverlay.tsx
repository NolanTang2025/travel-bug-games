import { useEffect, useState } from "react";
import { Loader2, Sparkles, UserCircle } from "lucide-react";

const STAGES = [
  { key: "read", label: "Reading your archive", detail: "Places, mood, and voice from your summary" },
  { key: "voice", label: "Shaping your voice", detail: "Tone, phrases, and how you sound in chat" },
  { key: "persona", label: "Building persona", detail: "Display name, bio, and Slack draft instructions" },
  { key: "save", label: "Activating twin", detail: "Saving as your active digital twin" },
] as const;

type Props = {
  open: boolean;
  done?: boolean;
  archiveTitle?: string;
};

export function TwinGeneratingOverlay({ open, done, archiveTitle }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setStageIndex(0);
      setProgress(0);
      setElapsed(0);
      return;
    }
    const stageTimer = window.setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2200);
    const clock = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stageTimer);
      clearInterval(clock);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (done) {
      setProgress(100);
      setStageIndex(STAGES.length - 1);
      return;
    }
    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(92, p + 1.4));
    }, 140);
    return () => clearInterval(tick);
  }, [open, done]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-riso-ink/75 backdrop-blur-sm p-4">
      <div className="sticker w-full max-w-md rounded-2xl bg-background p-6 sm:p-8 shadow-pop-lg">
        <div className="flex items-center gap-3 mb-6">
          <UserCircle className="h-10 w-10 text-riso-violet shrink-0" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Mnemo Twin
            </p>
            <h2 className="font-display text-xl text-riso-ink">Creating your digital twin</h2>
            {archiveTitle && (
              <p className="font-hand text-lg text-riso-ink/70 truncate">{archiveTitle}</p>
            )}
          </div>
        </div>

        <div className="mb-2 h-2 rounded-full bg-riso-ink/10 overflow-hidden">
          <div className="h-full bg-riso-violet transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mb-5 font-mono text-[10px] text-muted-foreground flex justify-between">
          <span>{Math.round(progress)}%</span>
          <span>{elapsed}s</span>
        </p>

        <ul className="space-y-2 mb-4">
          {STAGES.map((s, i) => {
            const active = i === stageIndex;
            const finished = i < stageIndex || done;
            return (
              <li
                key={s.key}
                className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-riso-yellow/35" : finished ? "opacity-50" : "opacity-30"}`}
              >
                {active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-riso-pink shrink-0" />
                ) : (
                  <span className="w-4 text-center text-riso-cyan">{finished ? "✓" : "·"}</span>
                )}
                <span className="font-display uppercase text-xs">{s.label}</span>
              </li>
            );
          })}
        </ul>

        <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-riso-violet shrink-0" />
          Usually 10–20 seconds
        </p>
      </div>
    </div>
  );
}
