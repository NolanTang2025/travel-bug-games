import { GAME_TEMPLATES } from "@/games/templates/catalog";
import type { CommunityGameCard } from "@/lib/communityGamesApi";

export type CommunityGameVisual = {
  coverUrl: string | null;
  gradient: string;
  emoji: string;
};

export function communityGameVisual(game: CommunityGameCard): CommunityGameVisual {
  const template = GAME_TEMPLATES.find((t) => t.id === game.template_id);
  return {
    coverUrl: game.coverUrl,
    gradient: template?.defaultBg ?? "linear-gradient(145deg, oklch(0.92 0.12 60), oklch(0.78 0.20 340))",
    emoji: template?.defaultTarget ?? "🎮",
  };
}
