/** 与 src/lib/pickTemplateFromHint.ts 关键词保持大致同步（服务端预选模板） */

const EXTRA_KEYWORDS: Record<string, string[]> = {
  forest_catch: ["森林", "公园", "徒步", "tree", "forest", "park", "green"],
  bamboo_path: ["竹", "bamboo", "江南"],
  beach_swipe: ["海", "滩", "beach", "ocean", "sea", "wave", "summer"],
  city_crosswalk: ["马路", "crosswalk", "shibuya", "tokyo", "city", "street"],
  market_swarm: ["市集", "market", "bazaar", "stall"],
  street_food: ["food", "ramen", "restaurant", "eat", "美食", "小吃"],
  temple_rhythm: ["寺", "temple", "庙"],
  shrine_bell: ["神社", "shrine", "鸟居"],
  rain_shield: ["雨", "rain", "umbrella"],
  metro_lane: ["地铁", "metro", "subway", "train", "轨道"],
  tram_collect: ["tram", "电车"],
  snow_shield: ["雪", "snow", "winter"],
  desert_snap: ["沙漠", "desert"],
  cafe_balance: ["咖啡", "coffee", "cafe", "café", "探店"],
  diary_quiz: ["日记", "回忆", "memory", "diary", "today", "felt", "笔记"],
  food_quiz: ["美食", "料理", "delicious", "taste", "好吃"],
  caption_fill: ["caption", "配文", "文案", "小红书"],
  journey_choice: ["选择", "choose", "or ", "if "],
  mood_fill: ["心情", "mood", "vibe", "feeling"],
};

const SCENES: Record<string, string[]> = {
  beach_swipe: ["beach", "coast", "海"],
  temple_rhythm: ["temple", "寺"],
  metro_lane: ["metro", "subway"],
  forest_catch: ["forest", "nature"],
};

export function pickTemplateFromHint(hint: string): string {
  const text = hint.trim();
  if (!text) return "forest_catch";

  let best = "forest_catch";
  let bestScore = 0;

  for (const [id, keywords] of Object.entries(EXTRA_KEYWORDS)) {
    let score = 0;
    const lower = text.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw) || lower.includes(kw.toLowerCase())) score += 2;
    }
    for (const scene of SCENES[id] ?? []) {
      if (text.includes(scene) || lower.includes(scene.toLowerCase())) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }

  if (bestScore === 0) {
    if (text.length > 80 || text.includes("今天") || lowerIncludes(text, "today")) return "diary_quiz";
    if (text.includes("?") || text.includes("？")) return "landmark_quiz";
    if (lowerIncludes(text, "travel") || lowerIncludes(text, "trip")) return "caption_fill";
  }

  return best;
}

function lowerIncludes(text: string, needle: string): boolean {
  return text.toLowerCase().includes(needle);
}
