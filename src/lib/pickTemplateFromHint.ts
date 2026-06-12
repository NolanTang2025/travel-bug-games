import { GAME_TEMPLATES, getTemplate } from "@/games/templates/catalog";
import type { GameTemplateId } from "@/games/templates/types";

const EXTRA_KEYWORDS: Record<string, string[]> = {
  forest_catch: ["森林", "公园", "徒步", "树", "绿", "虫子", "虫", "热", "闷"],
  bamboo_path: ["竹", "江南", "古镇", "云栖", "竹径", "径", "竹林"],
  wildlife_snap: ["虫", "蚊子", "蝴蝶", "动物", "鸟"],
  beach_swipe: ["海", "滩", "沙滩", "夏日", "浪"],
  city_crosswalk: ["马路", "十字", "涩谷", "东京", "红绿灯"],
  market_swarm: ["市集", "市场", "小吃", "摊"],
  street_food: ["夜宵", "拉面", "ramen", "好吃", "餐厅"],
  temple_rhythm: ["寺", "庙", "钟"],
  shrine_bell: ["神社", "鸟居", "参拜"],
  rain_shield: ["雨", "梅雨", "伞"],
  metro_lane: ["地铁", "轨道", "站台"],
  tram_collect: ["电车", "缆车"],
  snow_shield: ["雪", "冬", "冷"],
  desert_snap: ["沙漠", "骆驼", "干"],
  cafe_balance: ["咖啡", "咖啡馆"],
  diary_quiz: ["日记", "回忆", "随笔", "记录"],
  food_quiz: ["美食", "料理", "吃"],
  caption_fill: ["配文", "朋友圈", "文案"],
  journey_choice: ["选择", "如果", "还是", "或者"],
  hostel_choice: ["青旅", "民宿", "旅舍"],
  mood_fill: ["心情", "感觉", "氛围"],
};

function scoreTemplate(hint: string, id: GameTemplateId): number {
  const tpl = getTemplate(id);
  let score = 0;
  const lower = hint.toLowerCase();
  for (const scene of tpl.scenes) {
    if (hint.includes(scene) || lower.includes(scene.toLowerCase())) score += 3;
  }
  for (const kw of EXTRA_KEYWORDS[id] ?? []) {
    if (hint.includes(kw) || lower.includes(kw.toLowerCase())) score += 2;
  }
  return score;
}

export function rankTemplates(hint: string): { id: GameTemplateId; score: number }[] {
  const text = hint.trim();
  return GAME_TEMPLATES.map((tpl) => ({ id: tpl.id, score: scoreTemplate(text, tpl.id) }))
    .sort((a, b) => b.score - a.score);
}

export function pickTemplateCandidates(hint: string, topN = 3): GameTemplateId[] {
  const ranked = rankTemplates(hint);
  const maxScore = ranked[0]?.score ?? 0;
  if (maxScore === 0) {
    const fallback = pickTemplateFromHint(hint);
    return [fallback, "diary_quiz", "journey_choice"].filter(
      (id, i, arr) => arr.indexOf(id) === i,
    ) as GameTemplateId[];
  }
  return ranked.slice(0, topN).map((r) => r.id);
}

/** Seed rotates among top-N scored templates (or wider pool for remix). */
export function pickTemplateWithVariation(
  hint: string,
  seed: number,
  options?: { topN?: number; widenPool?: boolean },
): GameTemplateId {
  const topN = options?.topN ?? 3;
  const ranked = rankTemplates(hint);
  const maxScore = ranked[0]?.score ?? 0;

  let pool: GameTemplateId[];
  if (maxScore === 0) {
    pool = options?.widenPool
      ? (["diary_quiz", "caption_fill", "journey_choice", "market_swarm", "forest_catch"] as GameTemplateId[])
      : [pickTemplateFromHint(hint)];
  } else if (options?.widenPool) {
    pool = ranked
      .filter((r, i) => i < Math.max(topN, 5) || r.score >= maxScore - 3)
      .map((r) => r.id);
  } else {
    pool = ranked.slice(0, topN).map((r) => r.id);
  }

  const unique = [...new Set(pool)];
  return unique[Math.abs(seed) % unique.length] ?? "forest_catch";
}

/** 本地根据日记关键词预选模板，减少 AI 在 48 个模板里搜索的时间 */
export function pickTemplateFromHint(hint: string): GameTemplateId {
  const text = hint.trim();
  if (!text) return "forest_catch";

  const ranked = rankTemplates(text);
  const best = ranked[0];
  if (!best || best.score === 0) {
    if (text.length > 80 || text.includes("今天") || text.includes("觉得")) return "diary_quiz";
    if (text.includes("?") || text.includes("？")) return "landmark_quiz";
    return "forest_catch";
  }

  return best.id;
}
