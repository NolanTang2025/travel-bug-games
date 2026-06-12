import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const STAGES = [
  { key: "photos", label: "Scanning photos", detail: "Pulling places and light from your snapshots" },
  { key: "journal", label: "Reading your journal", detail: "Finding rhythm, mood, and voice in your notes" },
  { key: "places", label: "Mapping the trip", detail: "Extracting cities, stops, and timeline beats" },
  { key: "persona", label: "Shaping your voice", detail: "One-line persona for your digital twin" },
  { key: "seal", label: "Sealing the archive", detail: "Saving summary to your travel memory" },
] as const;

const TIPS = [
  "Usually 15–30 seconds — more photos means a richer summary",
  "Specific journal notes help the AI nail mood and voice",
  "When ready, you can build your Twin from this archive",
  "Slow network? The bar may pause — that's normal",
];

type Props = {
  open: boolean;
  photoPreview?: string;
  journalPreview?: string;
  done?: boolean;
};

export function ArchiveGeneratingOverlay({
  open,
  photoPreview,
  journalPreview,
  done,
}: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
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
    }, 2800);

    const tipTimer = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4500);

    const clock = window.setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      clearInterval(stageTimer);
      clearInterval(tipTimer);
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
      setProgress((p) => {
        const cap = 92;
        if (p >= cap) return p;
        const target = Math.min(cap, ((stageIndex + 1) / STAGES.length) * cap + 6);
        const step = p < target ? 1.1 + stageIndex * 0.12 : 0.25;
        return Math.min(cap, p + step);
      });
    }, 120);

    return () => clearInterval(tick);
  }, [open, done, stageIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-riso-ink/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-gen-title"
    >
      <div className="sticker w-full max-w-md rounded-2xl bg-background p-6 sm:p-8 shadow-pop-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start gap-4 mb-6">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt=""
              className="h-20 w-16 object-cover border-2 border-riso-ink shrink-0 rotate-[-2deg]"
            />
          ) : (
            <div className="h-20 w-16 bg-riso-cyan/30 border-2 border-dashed border-riso-ink/30 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
              Travel archive · AI summary
            </p>
            <h2 id="archive-gen-title" className="font-display text-xl sm:text-2xl text-riso-ink leading-tight">
              Generating your summary
            </h2>
          </div>
        </div>

        <div className="mb-2 h-2 rounded-full bg-riso-ink/10 overflow-hidden">
          <div
            className="h-full bg-riso-cyan transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-6">
          <span>{Math.round(progress)}%</span>
          <span>{elapsed}s elapsed</span>
        </div>

        <ul className="space-y-3 mb-6">
          {STAGES.map((s, i) => {
            const active = i === stageIndex;
            const doneStage = i < stageIndex || done;
            return (
              <li
                key={s.key}
                className={[
                  "flex gap-3 rounded-lg px-3 py-2 transition-colors",
                  active ? "bg-riso-yellow/35" : doneStage ? "opacity-55" : "opacity-35",
                ].join(" ")}
              >
                <span className="mt-0.5 shrink-0">
                  {doneStage && !active ? (
                    <span className="text-riso-cyan font-mono text-xs">✓</span>
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-riso-pink" />
                  ) : (
                    <span className="inline-block w-4 h-4 rounded-full border border-riso-ink/25" />
                  )}
                </span>
                <div>
                  <p className="font-display text-sm uppercase tracking-wide text-riso-ink">{s.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {journalPreview?.trim() && (
          <p className="mb-4 font-hand text-base text-riso-ink/70 line-clamp-2 border-l-2 border-riso-cyan pl-3">
            &ldquo;{journalPreview.trim().slice(0, 100)}
            {journalPreview.length > 100 ? "…" : ""}&rdquo;
          </p>
        )}

        <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground leading-relaxed">
          <Sparkles className="h-3.5 w-3.5 text-riso-cyan shrink-0" />
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
