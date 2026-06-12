import type { AIGameTemplateSpec } from "@/games/templates/types";
import { isTextEngine } from "@/games/templates/types";

type Props = {
  spec: AIGameTemplateSpec;
  className?: string;
};

/** Tiny CSS-only preview — gives onboard a pulse before you play */
export function GameMechanicPreview({ spec, className = "" }: Props) {
  const text = isTextEngine(spec.engine);

  if (text) {
    return (
      <div className={`game-level-preview game-level-preview-quiz ${className}`} aria-hidden>
        <div className="game-level-preview-quiz-card game-level-preview-quiz-a">
          <span className="text-xl">?</span>
        </div>
        <div className="game-level-preview-quiz-card game-level-preview-quiz-b">
          <span className="text-lg">{spec.targetEmoji}</span>
        </div>
        <p className="game-level-preview-label font-mono text-[8px] uppercase tracking-widest text-white/55">
          Quiz mode
        </p>
      </div>
    );
  }

  return (
    <div className={`game-level-preview game-level-preview-arcade ${className}`} aria-hidden>
      <span className="game-level-preview-fall game-level-preview-good">{spec.targetEmoji}</span>
      <span className="game-level-preview-fall game-level-preview-bad">{spec.obstacleEmoji}</span>
      <span className="game-level-preview-fall game-level-preview-good game-level-preview-fall-2">
        {spec.targetEmoji}
      </span>
      <div className="game-level-preview-basket" />
      <p className="game-level-preview-label font-mono text-[8px] uppercase tracking-widest text-white/55">
        Arcade mode
      </p>
    </div>
  );
}
