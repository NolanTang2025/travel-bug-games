import { pickTemplateFromHint } from "./pickTemplateHint.ts";

/** Keep in sync with src/games/templates/catalog.ts template ids */
export const TEMPLATE_IDS = [
  "forest_catch", "bamboo_path", "beach_swipe", "coast_wind", "city_crosswalk", "urban_hold",
  "night_firefly", "garden_jar", "market_swarm", "street_food", "temple_rhythm", "shrine_bell",
  "rain_shield", "storm_clear", "metro_lane", "train_rush", "tram_collect", "harbor_tram",
  "motorbike_sides", "alley_weave", "snow_shield", "winter_clear", "desert_snap", "mirage_photo",
  "festival_swarm", "lantern_rain", "cafe_balance", "coffee_rhythm", "museum_snap", "gallery_pop",
  "mountain_hold", "summit_flag", "river_drag", "lake_catch", "wildlife_snap", "safari_pop",
  "diary_quiz", "landmark_quiz", "food_quiz", "caption_fill", "diary_fill", "mood_fill",
  "itinerary_order", "taste_order", "journey_choice", "detour_choice", "hostel_choice", "market_bargain",
] as const;

const KEYWORD_SCORES: Record<string, string[]> = {
  forest_catch: ["森林", "公园", "徒步", "tree", "forest", "park", "green", "虫子", "虫", "热", "闷", "hike"],
  bamboo_path: ["竹", "bamboo", "江南", "古镇", "竹径", "竹林"],
  beach_swipe: ["海", "滩", "beach", "ocean", "sea", "wave", "summer", "沙滩"],
  coast_wind: ["海岸", "风", "coast", "wind", "cliff"],
  city_crosswalk: ["马路", "crosswalk", "shibuya", "tokyo", "city", "street", "十字", "红绿灯"],
  urban_hold: ["城市", "urban", "downtown", "霓虹"],
  night_firefly: ["萤火虫", "firefly", "night", "夜"],
  garden_jar: ["花园", "garden", "jar", "庭院"],
  market_swarm: ["市集", "market", "bazaar", "stall", "市场", "小吃"],
  street_food: ["food", "ramen", "restaurant", "eat", "美食", "小吃", "夜宵", "拉面"],
  temple_rhythm: ["寺", "temple", "庙", "钟"],
  shrine_bell: ["神社", "shrine", "鸟居"],
  rain_shield: ["雨", "rain", "umbrella", "梅雨"],
  storm_clear: ["storm", "风暴", "雷"],
  metro_lane: ["地铁", "metro", "subway", "train", "轨道", "站台"],
  train_rush: ["火车", "rail", "rush"],
  tram_collect: ["tram", "电车", "缆车"],
  harbor_tram: ["harbor", "港口", "码头"],
  motorbike_sides: ["摩托", "motorbike", "scooter"],
  alley_weave: ["巷", "alley", "胡同"],
  snow_shield: ["雪", "snow", "winter", "冬"],
  winter_clear: ["winter", "cold", "冰"],
  desert_snap: ["沙漠", "desert", "干"],
  mirage_photo: ["mirage", "绿洲"],
  festival_swarm: ["festival", "节日", "灯会"],
  lantern_rain: ["灯笼", "lantern"],
  cafe_balance: ["咖啡", "coffee", "cafe", "café", "探店"],
  coffee_rhythm: ["latte", "espresso", "咖啡馆"],
  museum_snap: ["museum", "博物馆", "展"],
  gallery_pop: ["gallery", "画廊", "展"],
  mountain_hold: ["山", "mountain", "登山"],
  summit_flag: ["summit", "山顶", "峰"],
  river_drag: ["河", "river", "漂流"],
  lake_catch: ["湖", "lake"],
  wildlife_snap: ["wildlife", "动物", "鸟", "虫", "蝴蝶"],
  safari_pop: ["safari", "动物园"],
  diary_quiz: ["日记", "回忆", "memory", "diary", "today", "felt", "笔记", "随笔"],
  landmark_quiz: ["地标", "landmark", "景点"],
  food_quiz: ["美食", "料理", "delicious", "taste", "好吃"],
  caption_fill: ["caption", "配文", "文案", "小红书"],
  diary_fill: ["填空", "fill"],
  mood_fill: ["心情", "mood", "vibe", "feeling", "氛围"],
  itinerary_order: ["行程", "itinerary", "路线"],
  taste_order: ["口味", "taste"],
  journey_choice: ["选择", "choose", "or ", "if ", "还是"],
  detour_choice: ["绕路", "detour"],
  hostel_choice: ["青旅", "hostel", "民宿"],
  market_bargain: ["砍价", "bargain"],
};

function scoreTemplate(hint: string, id: string): number {
  const lower = hint.toLowerCase();
  let score = 0;
  for (const kw of KEYWORD_SCORES[id] ?? []) {
    if (hint.includes(kw) || lower.includes(kw.toLowerCase())) score += 2;
  }
  return score;
}

export function rankTemplates(hint: string): { id: string; score: number }[] {
  const text = hint.trim();
  return TEMPLATE_IDS.map((id) => ({ id, score: scoreTemplate(text, id) }))
    .sort((a, b) => b.score - a.score);
}

/** Pick from top N scored templates; seed rotates choice. widenPool adds near-ties for remix. */
export function pickTemplateWithVariation(
  hint: string,
  seed: number,
  options?: { topN?: number; widenPool?: boolean },
): string {
  const topN = options?.topN ?? 3;
  const widen = options?.widenPool ?? false;
  const ranked = rankTemplates(hint);
  const maxScore = ranked[0]?.score ?? 0;

  let pool: string[];
  if (maxScore === 0) {
    pool = widen
      ? ["diary_quiz", "caption_fill", "journey_choice", "market_swarm", "forest_catch"]
      : [pickTemplateFromHint(hint)];
  } else if (widen) {
    pool = ranked
      .filter((r, i) => i < Math.max(topN, 5) || r.score >= maxScore - 3)
      .map((r) => r.id);
  } else {
    pool = ranked.slice(0, topN).map((r) => r.id);
  }

  const unique = [...new Set(pool)];
  const idx = Math.abs(seed) % unique.length;
  return unique[idx] ?? "forest_catch";
}
