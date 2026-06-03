import type { PrintEdition } from "@/data/printEditions";

export type EditionGameType = "rpg" | "frogger" | "collector" | "arena";

export type GameEndResult = {
  score: number;
  misses: number;
};

export type EditionGameProps = {
  edition: PrintEdition;
  onEnd: (result: GameEndResult) => void;
  paused?: boolean;
};

export type EditionGameMeta = {
  type: EditionGameType;
  title: string;
  tagline: string;
  background: string;
  duration: number;
  controls: string;
  genre: string;
};
