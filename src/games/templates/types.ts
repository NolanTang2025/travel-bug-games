export type GameEngine =
  | "falling_catch"
  | "falling_swarm"
  | "falling_tap_clear"
  | "hold_crosswalk"
  | "drag_jar"
  | "lanes_vertical"
  | "shutter_snap"
  | "swipe_wind"
  | "rhythm_tap"
  | "tram_sides"
  | "photo_pop"
  | "text_quiz"
  | "text_fill"
  | "text_order"
  | "text_choice";

/** 选择题 / 填空（options + correctIndex） */
export type TextRoundQuiz = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

/** 拼词排序 */
export type TextRoundOrder = {
  prompt: string;
  tiles: string[];
};

export type TextRound = TextRoundQuiz | TextRoundOrder;

export function isTextRoundOrder(r: TextRound): r is TextRoundOrder {
  return "tiles" in r && Array.isArray((r as TextRoundOrder).tiles);
}

export function isTextEngine(engine: GameEngine): boolean {
  return engine.startsWith("text_");
}

export type GameTemplateId =
  | "forest_catch"
  | "bamboo_path"
  | "beach_swipe"
  | "coast_wind"
  | "city_crosswalk"
  | "urban_hold"
  | "night_firefly"
  | "garden_jar"
  | "market_swarm"
  | "street_food"
  | "temple_rhythm"
  | "shrine_bell"
  | "rain_shield"
  | "storm_clear"
  | "metro_lane"
  | "train_rush"
  | "tram_collect"
  | "harbor_tram"
  | "motorbike_sides"
  | "alley_weave"
  | "snow_shield"
  | "winter_clear"
  | "desert_snap"
  | "mirage_photo"
  | "festival_swarm"
  | "lantern_rain"
  | "cafe_balance"
  | "coffee_rhythm"
  | "museum_snap"
  | "gallery_pop"
  | "mountain_hold"
  | "summit_flag"
  | "river_drag"
  | "lake_catch"
  | "wildlife_snap"
  | "safari_pop"
  | "diary_quiz"
  | "landmark_quiz"
  | "food_quiz"
  | "caption_fill"
  | "diary_fill"
  | "mood_fill"
  | "itinerary_order"
  | "taste_order"
  | "journey_choice"
  | "detour_choice"
  | "hostel_choice"
  | "market_bargain";

export type GameTemplateDef = {
  id: GameTemplateId;
  engine: GameEngine;
  nameZh: string;
  scenes: string[];
  defaultTarget: string;
  defaultObstacle: string;
  defaultBg: string;
  defaultInstruction: string;
  duration: number;
  defaultTextRounds?: TextRound[];
};

/** AI-extracted highlight from the trip — woven into UI and mechanics */
export type JourneyBeat = {
  headline: string;
  moment: string;
  twist: string;
  villain: string;
  treasure: string;
  safeLabel?: string;
  dangerLabel?: string;
  /** End-screen player title — Gen-Z flavored */
  runEpithet?: string;
  /** One line from Mnemo brand voice */
  mnemoQuip?: string;
  /** Ready-to-paste TikTok / Reels / Story caption */
  shareCaption?: string;
};

export type GameAssetRole = "target" | "obstacle" | "player" | "prop";

export type GameAssetStatus = "ready" | "needs_upload" | "fallback_photo" | "fallback_emoji";

export type GameAssetSpec = {
  role: GameAssetRole;
  displayName: string;
  imagePrompt?: string;
  referencePhotoIndex?: number | null;
  needsUserPhoto?: boolean;
  uploadTease?: string;
  mood?: string;
  status?: GameAssetStatus;
  spriteUrl?: string;
};

export type AIGameTemplateSpec = {
  templateId: GameTemplateId;
  engine: GameEngine;
  title: string;
  tagline: string;
  targetEmoji: string;
  obstacleEmoji: string;
  background: string;
  duration: number;
  instruction: string;
  textRounds?: TextRound[];
  journeyBeat?: JourneyBeat;
  gameAssets?: GameAssetSpec[];
  targetSpriteUrl?: string;
  obstacleSpriteUrl?: string;
  playerSpriteUrl?: string;
  assetRunId?: string;
};
