import type { AIGameTemplateSpec } from "./types";
import { FallingEngine } from "./engines/FallingEngine";
import {
  DragJarEngine,
  HoldCrossEngine,
  LanesEngine,
  PhotoPopEngine,
  RhythmEngine,
  ShutterEngine,
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
  const common = { spec, onEnd, photoPreview, albumPhotos };
  switch (spec.engine) {
    case "falling_catch":
    case "falling_swarm":
    case "falling_tap_clear":
      return <FallingEngine {...common} mode={spec.engine} />;
    case "hold_crosswalk":
      return <HoldCrossEngine {...common} />;
    case "drag_jar":
      return <DragJarEngine {...common} />;
    case "lanes_vertical":
      return <LanesEngine {...common} />;
    case "shutter_snap":
      return <ShutterEngine {...common} />;
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
