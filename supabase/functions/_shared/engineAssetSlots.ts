/** Structural slots per engine — LLM fills creative prompts; we don't hardcode art. */
export function assetSlotsForEngine(engine: string): { role: string; hint: string }[] {
  switch (engine) {
    case "drag_jar":
      return [
        { role: "target", hint: "collectible that falls into the jar — glowing, cute, trip-specific" },
        { role: "obstacle", hint: "thing that ruins the catch if it lands in the jar" },
      ];
    case "falling_catch":
      return [
        { role: "target", hint: "treasure to catch in the basket" },
        { role: "obstacle", hint: "thing to dodge while catching" },
      ];
    case "falling_swarm":
      return [{ role: "target", hint: "tap-to-collect swarm item — reads at small size" }];
    case "falling_tap_clear":
      return [
        { role: "obstacle", hint: "tap away before it hits" },
        { role: "target", hint: "optional bonus — do NOT tap" },
      ];
    case "hold_crosswalk":
      return [
        { role: "player", hint: "avatar crossing — can stylize from a person in the trip photo" },
        { role: "obstacle", hint: "danger when crossing (vehicle, crowd, etc.)" },
      ];
    case "lanes_vertical":
    case "tram_sides":
      return [
        { role: "target", hint: "lane collectible" },
        { role: "obstacle", hint: "lane hazard" },
      ];
    case "shutter_snap":
      return [{ role: "target", hint: "subject that pops into the viewfinder frame" }];
    case "photo_pop":
      return [{ role: "target", hint: "flash pop-up to tap — iconic trip detail" }];
    case "swipe_wind":
      return [
        { role: "target", hint: "reward when swiping the right direction" },
        { role: "obstacle", hint: "punish wrong swipe" },
      ];
    case "rhythm_tap":
      return [{ role: "target", hint: "rhythm lane icon — bold silhouette" }];
    default:
      return [];
  }
}

export function isTextEngine(engine: string): boolean {
  return engine.startsWith("text_");
}
