import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import type { GameplayGuide } from "@/lib/gameplayGuide";
import type { AIGameTemplateSpec } from "@/games/templates/types";
import { isTextEngine } from "@/games/templates/types";
import { JournalAlbumBackdrop } from "@/games/JournalAlbumBackdrop";
import { GameMechanicPreview } from "@/components/GameMechanicPreview";
import { MnemoLevelStamp } from "@/components/MnemoLevelStamp";
import { MNEMO_PRESS } from "@/lib/mnemoGameCopy";
import { formatTemplateId } from "@/lib/formatTemplateId";

type Props = {
  spec: AIGameTemplateSpec;
  guide: GameplayGuide;
  photos: string[];
  onStart: () => void;
  onBack: () => void;
};

const STEP_ACCENTS = ["game-level-step-cyan", "game-level-step-pink", "game-level-step-yellow", "game-level-step-violet"] as const;

export function GameplayTutorial({ spec, guide, photos, onStart, onBack }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const durationLabel = isTextEngine(spec.engine)
    ? `${spec.textRounds?.length ?? 3} rounds`
    : `${spec.duration}s`;

  const step = guide.steps[stepIdx];
  const canPrev = stepIdx > 0;
  const canNext = stepIdx < guide.steps.length - 1;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <JournalAlbumBackdrop photos={photos} mode="panel" tint={spec.background} />
      <div className="game-level-grain pointer-events-none" aria-hidden />
      <div className="game-level-scanlines pointer-events-none" aria-hidden />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-16 pb-32 sm:px-6 sm:py-20">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <div className="game-level-onboard-header game-level-rise text-center mb-5">
            <MnemoLevelStamp variant="tutorial" className="text-white/65 mb-2" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-riso-cyan/90 mb-2">
              Briefing · {formatTemplateId(spec.templateId)}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight mb-2 drop-shadow-lg">
              <span className="text-chroma">{guide.title}</span>
            </h2>
            <p className="font-mono text-base sm:text-lg text-white/88 max-w-md mx-auto leading-snug tracking-wide">
              {guide.summary}
            </p>
          </div>

          {/* Progress */}
          <div className="game-level-progress game-level-rise mb-5" style={{ animationDelay: "50ms" }}>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-white/55 mb-2">
              <span>Step {stepIdx + 1} / {guide.steps.length}</span>
              <span>{durationLabel}</span>
            </div>
            <div className="game-level-progress-track">
              <div
                className="game-level-progress-fill"
                style={{ width: `${((stepIdx + 1) / guide.steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {guide.steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIdx(i)}
                  className={[
                    "h-2 rounded-full transition-all",
                    i === stepIdx ? "w-6 bg-riso-pink" : "w-2 bg-white/30 hover:bg-white/50",
                  ].join(" ")}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="game-level-onboard-bento game-level-rise mb-5 grid gap-3 sm:grid-cols-[9rem_1fr]" style={{ animationDelay: "90ms" }}>
            <GameMechanicPreview spec={spec} className="mx-auto sm:mx-0 w-full max-w-[9rem]" />
            {photos.length > 0 && (
              <div className="game-level-filmstrip">
                {photos.slice(0, 5).map((src, i) => (
                  <div
                    key={src}
                    className="game-level-film-frame"
                    style={{ rotate: `${(i % 2 === 0 ? -2 : 2) + i}deg` }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <span className="game-level-film-sprocket" aria-hidden />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step card — carousel */}
          {step && (
            <div
              className={[
                "game-level-step-card game-level-rise",
                STEP_ACCENTS[stepIdx % STEP_ACCENTS.length],
              ].join(" ")}
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex items-start gap-4">
                <span className="game-level-step-num font-display text-lg shrink-0">
                  {step.emoji ?? stepIdx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base uppercase tracking-wide text-riso-ink">{step.title}</p>
                  <p className="mt-2 text-sm sm:text-base text-riso-ink/80 leading-relaxed">{step.body}</p>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t border-riso-ink/10">
                <button
                  type="button"
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  disabled={!canPrev}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-riso-ink/60 disabled:opacity-30 hover:text-riso-ink transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setStepIdx((i) => Math.min(guide.steps.length - 1, i + 1))}
                  disabled={!canNext}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-riso-pink disabled:opacity-30 hover:text-riso-pink/80 transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="game-level-bento game-level-rise mt-5 grid gap-3 sm:grid-cols-2" style={{ animationDelay: "160ms" }}>
            <div className="game-level-bento-cell game-level-bento-goal">
              <p className="font-mono text-[10px] uppercase tracking-wider text-riso-cyan flex items-center gap-1 mb-1.5 font-semibold">
                <Trophy className="h-3 w-3" /> Goal
              </p>
              <p className="text-sm text-riso-ink/85 leading-relaxed">{guide.winCondition}</p>
            </div>
            <div className="game-level-bento-cell game-level-bento-whiff">
              <p className="font-mono text-[10px] uppercase tracking-wider text-riso-pink flex items-center gap-1 mb-1.5 font-semibold">
                <AlertTriangle className="h-3 w-3" /> Whiff
              </p>
              <p className="text-sm text-riso-ink/85 leading-relaxed">{guide.penalty}</p>
            </div>
          </div>

          <p
            className="game-level-instruction game-level-rise mt-4 text-sm text-riso-ink/88 leading-relaxed"
            style={{ animationDelay: "200ms" }}
          >
            <span className="font-display text-riso-pink uppercase tracking-wide text-xs">{MNEMO_PRESS} · </span>
            {spec.instruction}
          </p>
        </div>
      </div>

      <div className="game-level-dock">
        <div className="game-dock-panel">
          <p className="game-dock-label">Mnemo · {MNEMO_PRESS}</p>
          <button type="button" onClick={onStart} className="game-dock-primary game-level-play-btn">
            Play · {durationLabel}
          </button>
          <button type="button" onClick={onBack} className="game-dock-ghost">
            ← Back to cover
          </button>
        </div>
      </div>
    </div>
  );
}
