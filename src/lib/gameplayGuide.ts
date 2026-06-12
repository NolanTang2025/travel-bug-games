import type { AIGameTemplateSpec } from "@/games/templates/types";
import { buildGameplayGuide } from "@/lib/mnemoGameCopy";

export type GameplayStep = {
  title: string;
  body: string;
  emoji?: string;
};

export type GameplayGuide = {
  title: string;
  summary: string;
  steps: GameplayStep[];
  winCondition: string;
  penalty: string;
};

export function getGameplayGuide(spec: AIGameTemplateSpec): GameplayGuide {
  return buildGameplayGuide(spec);
}
