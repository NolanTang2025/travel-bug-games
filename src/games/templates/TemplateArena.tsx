import type { AIGameTemplateSpec } from "./types";
import { normalizePlayEngine } from "./types";
import { FallingEngine } from "./engines/FallingEngine";
import {
  DragJarEngine,
  HoldCrossEngine,
  LanesEngine,
  PhotoPopEngine,
  RhythmEngine,
  SwipeWindEngine,
  TramSidesEngine,
} from "./engines/AltEngines";
import { TextChoiceEngine, TextFillEngine, TextOrderEngine, TextQuizEngine } from "./engines/TextEngines";

export type { AIGameTemplateSpec as AIGameSpec };

export function TemplateArena({
  spec,
  onEnd,
  photoPreview,
  albumPhotos,
}: {
  spec: AIGameTemplateSpec;
  onEnd: (result: { score: number; misses: number }) => void;
  photoPreview?: string;
  albumPhotos?: string[];
}) {
  const playEngine = normalizePlayEngine(spec.engine);
  const common = { spec, onEnd, photoPreview, albumPhotos };
  switch (playEngine) {
    case "falling_catch":
    case "falling_swarm":
    case "falling_tap_clear":
      return (
        <FallingEngine
          {...common}
          mode={
            spec.engine === "falling_swarm"
              ? "falling_swarm"
              : spec.engine === "falling_tap_clear"
                ? "falling_tap_clear"
                : "falling_catch"
          }
        />
      );
    case "hold_crosswalk":
      return <HoldCrossEngine {...common} />;
    case "drag_jar":
      return <DragJarEngine {...common} />;
    case "lanes_vertical":
      return <LanesEngine {...common} />;
    case "swipe_wind":
      return <SwipeWindEngine {...common} />;
    case "rhythm_tap":
      return <RhythmEngine {...common} />;
    case "tram_sides":
      return <TramSidesEngine {...common} />;
    case "photo_pop":
      return <PhotoPopEngine {...common} />;
    case "text_quiz":
      return <TextQuizEngine {...common} />;
    case "text_fill":
      return <TextFillEngine {...common} />;
    case "text_order":
      return <TextOrderEngine {...common} />;
    case "text_choice":
      return <TextChoiceEngine {...common} />;
    default:
      return <FallingEngine {...common} mode="falling_catch" />;
  }
}
