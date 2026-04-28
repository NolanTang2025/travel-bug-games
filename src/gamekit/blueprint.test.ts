import { describe, expect, it } from "vitest";
import { compileBlueprintToGameSpec, gameBlueprintV1Schema } from "@/gamekit/blueprint";

describe("compileBlueprintToGameSpec", () => {
  const minimalUi = {
    introHowTo: "Tap",
    play: "Go",
    timeUp: "End",
    score: "Pts",
    misses: "Miss",
    replay: "Again",
    newPhoto: "New",
    newGame: "Exit",
    generatedBadge: "AI",
  };

  it("maps lane_runner to runner template", () => {
    const bp = gameBlueprintV1Schema.parse({
      schemaVersion: 1,
      engine: "lane_runner",
      meta: { title: "Run", tagline: "Go", durationSec: 30 },
      visuals: {
        backgroundCss: "linear-gradient(180deg,#000,#111)",
        targetEmoji: "⭐",
        obstacleEmoji: "💀",
        mechanic: "catch",
      },
      ui: minimalUi,
    });
    const spec = compileBlueprintToGameSpec(bp, { photo: "" });
    expect(spec.templateId).toBe("runner");
  });

  it("maps photo_reaction to photoTap template", () => {
    const bp = gameBlueprintV1Schema.parse({
      schemaVersion: 1,
      engine: "photo_reaction",
      meta: { title: "Snap", tagline: "Tap", durationSec: 25 },
      visuals: {
        backgroundCss: "linear-gradient(180deg,#000,#111)",
        targetEmoji: "📷",
        obstacleEmoji: "❌",
      },
      tuning: { reactionWindowMs: 900 },
      ui: minimalUi,
    });
    const spec = compileBlueprintToGameSpec(bp, { photo: "data:image/png;base64,x" });
    expect(spec.templateId).toBe("photoTap");
    expect(spec.params?.photoTap?.reactionWindowMs).toBe(900);
  });
});
