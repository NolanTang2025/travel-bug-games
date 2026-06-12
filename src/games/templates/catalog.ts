import type { GameTemplateDef, GameTemplateId, TextRound } from "./types";
import { isTextEngine } from "./types";
import { GENERIC_CHOICE, GENERIC_FILL, GENERIC_ORDER, GENERIC_QUIZ } from "./textDefaults";
import {
  coerceArray,
  normalizeGameText,
  normalizeJourneyBeatFields,
} from "@/lib/gameTextNormalize";

export const GAME_TEMPLATES: GameTemplateDef[] = [
  { id: "forest_catch", engine: "falling_catch", nameZh: "Forest Catch", scenes: ["森林", "徒步", "公园", "竹林"], defaultTarget: "🍃", defaultObstacle: "🕸️", defaultBg: "linear-gradient(180deg, #1a3d2e, #0d1f17)", defaultInstruction: "Move the basket to catch the good stuff", duration: 38 },
  { id: "bamboo_path", engine: "falling_catch", nameZh: "Bamboo Stroll", scenes: ["竹林", "江南", "古镇", "阴凉"], defaultTarget: "🎋", defaultObstacle: "🐛", defaultBg: "linear-gradient(180deg, #2d5a3f, #1a3328)", defaultInstruction: "Move along the path and catch falling leaves", duration: 36 },
  { id: "beach_swipe", engine: "swipe_wind", nameZh: "Sea Breeze", scenes: ["海滩", "海边", "沙滩", "夏日"], defaultTarget: "🐚", defaultObstacle: "🌊", defaultBg: "linear-gradient(180deg, #5eb8e8, #1a6a9e)", defaultInstruction: "Swipe with the arrow to block the waves", duration: 35 },
  { id: "coast_wind", engine: "swipe_wind", nameZh: "Coastal Wind", scenes: ["海岸", "礁石", "吹风", "潮湿"], defaultTarget: "🦀", defaultObstacle: "💨", defaultBg: "linear-gradient(180deg, #7ec8e3, #2d6a8a)", defaultInstruction: "Slide with the wind to push back the salt spray", duration: 34 },
  { id: "city_crosswalk", engine: "hold_crosswalk", nameZh: "Crosswalk", scenes: ["城市", "十字路口", "东京", "涩谷"], defaultTarget: "🚶", defaultObstacle: "🚗", defaultBg: "linear-gradient(180deg, #4a4a5a, #1a1a28)", defaultInstruction: "Hold on green, release on red", duration: 40 },
  { id: "urban_hold", engine: "hold_crosswalk", nameZh: "Urban Crossing", scenes: ["都市", "通勤", "马路", "高楼"], defaultTarget: "🛂", defaultObstacle: "🚌", defaultBg: "linear-gradient(180deg, #3d4a5c, #222833)", defaultInstruction: "Hold only when it's safe to cross", duration: 38 },
  { id: "night_firefly", engine: "drag_jar", nameZh: "Firefly Hunt", scenes: ["夜晚", "河边", "萤火虫", "夏季"], defaultTarget: "✨", defaultObstacle: "🌧️", defaultBg: "linear-gradient(180deg, #1e2a4a, #0a1020)", defaultInstruction: "Drag the jar to catch glowing dots", duration: 36 },
  { id: "garden_jar", engine: "drag_jar", nameZh: "Garden Lights", scenes: ["庭院", "花园", "浪漫", "安静"], defaultTarget: "🌙", defaultObstacle: "🦇", defaultBg: "linear-gradient(180deg, #2a1f3d, #120a1a)", defaultInstruction: "Move the jar to collect floating glow", duration: 34 },
  { id: "market_swarm", engine: "falling_swarm", nameZh: "Market Rush", scenes: ["市集", "小吃", "烟火气", "排队"], defaultTarget: "🥟", defaultObstacle: "🔥", defaultBg: "linear-gradient(180deg, #e8a84a, #8b4518)", defaultInstruction: "Tap fast to grab the food", duration: 32 },
  { id: "street_food", engine: "falling_swarm", nameZh: "Street Food", scenes: ["夜宵", "路边摊", "美食", "香"], defaultTarget: "🍜", defaultObstacle: "🌶️", defaultBg: "linear-gradient(180deg, #ff9a5c, #c44d2a)", defaultInstruction: "Tap the dishes as they fall", duration: 33 },
  { id: "temple_rhythm", engine: "rhythm_tap", nameZh: "Temple Bells", scenes: ["寺庙", "神社", "钟声", "京都"], defaultTarget: "🔔", defaultObstacle: "😶", defaultBg: "linear-gradient(180deg, #8b3a2a, #3d1810)", defaultInstruction: "Tap the lit column when it glows", duration: 36 },
  { id: "shrine_bell", engine: "rhythm_tap", nameZh: "Shrine Rhythm", scenes: ["神社", "参拜", "传统", "鸟居"], defaultTarget: "⛩️", defaultObstacle: "👻", defaultBg: "linear-gradient(180deg, #c45c4a, #5c2018)", defaultInstruction: "Follow the beat and wake the target", duration: 35 },
  { id: "rain_shield", engine: "falling_tap_clear", nameZh: "Rain Clear", scenes: ["下雨", "梅雨", "潮湿", "伞"], defaultTarget: "🌈", defaultObstacle: "💧", defaultBg: "linear-gradient(180deg, #6a7a8a, #2a3540)", defaultInstruction: "Tap to knock away hazard drops", duration: 34 },
  { id: "storm_clear", engine: "falling_tap_clear", nameZh: "Storm Dodge", scenes: ["暴雨", "台风", "雷", "乌云"], defaultTarget: "☂️", defaultObstacle: "⚡", defaultBg: "linear-gradient(180deg, #3a4555, #1a2030)", defaultInstruction: "Tap lightning, not the rainbow", duration: 33 },
  { id: "metro_lane", engine: "lanes_vertical", nameZh: "Metro Switch", scenes: ["地铁", "轨道", "通勤", "站台"], defaultTarget: "🎫", defaultObstacle: "🧳", defaultBg: "linear-gradient(180deg, #2a3a5a, #141c2e)", defaultInstruction: "Switch lanes to dodge obstacles", duration: 38 },
  { id: "train_rush", engine: "lanes_vertical", nameZh: "Train Sprint", scenes: ["火车", "铁路", "旅行", "月台"], defaultTarget: "🚆", defaultObstacle: "⏰", defaultBg: "linear-gradient(180deg, #4a5a6a, #252d38)", defaultInstruction: "Switch tracks to collect tickets", duration: 36 },
  { id: "tram_collect", engine: "tram_sides", nameZh: "Tram Line", scenes: ["电车", "轨道", "里斯本", "山坡"], defaultTarget: "🎟️", defaultObstacle: "🛑", defaultBg: "linear-gradient(180deg, #f0c060, #6a5020)", defaultInstruction: "Move up/down to collect station rewards", duration: 37 },
  { id: "harbor_tram", engine: "tram_sides", nameZh: "Harbor Cable", scenes: ["港口", "缆车", "码头", "船"], defaultTarget: "⚓", defaultObstacle: "🌫️", defaultBg: "linear-gradient(180deg, #6a9ab8, #2a4a62)", defaultInstruction: "Move along the track to collect anchors", duration: 35 },
  { id: "motorbike_sides", engine: "tram_sides", nameZh: "Moto Weave", scenes: ["摩托", "巷弄", "河内", "东南亚"], defaultTarget: "🏍️", defaultObstacle: "🐕", defaultBg: "linear-gradient(180deg, #e8b86d, #5a4020)", defaultInstruction: "Move up/down to dodge alley obstacles", duration: 36 },
  { id: "alley_weave", engine: "lanes_vertical", nameZh: "Alley Dash", scenes: ["小巷", "老城", "步行", "石板路"], defaultTarget: "📸", defaultObstacle: "🛵", defaultBg: "linear-gradient(180deg, #8a7a6a, #3a3228)", defaultInstruction: "Switch lanes to dodge speeding vehicles", duration: 37 },
  { id: "snow_shield", engine: "falling_tap_clear", nameZh: "Snow Sweep", scenes: ["雪", "冬季", "寒冷", "滑雪"], defaultTarget: "⛄", defaultObstacle: "❄️", defaultBg: "linear-gradient(180deg, #d8e8f0, #7a98b0)", defaultInstruction: "Tap to clear snow blocks", duration: 34 },
  { id: "winter_clear", engine: "falling_catch", nameZh: "Snowfield Catch", scenes: ["雪原", "北国", "手套", "白"], defaultTarget: "🧣", defaultObstacle: "🧊", defaultBg: "linear-gradient(180deg, #e8f4ff, #98b8d0)", defaultInstruction: "Move to catch warm items, dodge ice", duration: 36 },
  { id: "desert_snap", engine: "shutter_snap", nameZh: "Desert Snap", scenes: ["沙漠", "干旱", "骆驼", "热浪"], defaultTarget: "🐪", defaultObstacle: "🌪️", defaultBg: "linear-gradient(180deg, #e8c070, #a06828)", defaultInstruction: "Tap to shoot when the target is in frame", duration: 35 },
  { id: "mirage_photo", engine: "shutter_snap", nameZh: "Mirage Shot", scenes: ["荒漠", "绿洲", "幻影", "远"], defaultTarget: "🌴", defaultObstacle: "☀️", defaultBg: "linear-gradient(180deg, #f0d090, #c08030)", defaultInstruction: "Align the viewfinder, then tap", duration: 34 },
  { id: "festival_swarm", engine: "falling_swarm", nameZh: "Lantern Tap", scenes: ["节日", "灯会", "元宵", "夜"], defaultTarget: "🏮", defaultObstacle: "💥", defaultBg: "linear-gradient(180deg, #8b2020, #2a0808)", defaultInstruction: "Tap fast to light lanterns", duration: 32 },
  { id: "lantern_rain", engine: "falling_swarm", nameZh: "Sky Lanterns", scenes: ["天灯", "许愿", "浪漫", "夜空"], defaultTarget: "🎐", defaultObstacle: "🎆", defaultBg: "linear-gradient(180deg, #1a2040, #0a0e20)", defaultInstruction: "Tap floating lanterns", duration: 33 },
  { id: "cafe_balance", engine: "rhythm_tap", nameZh: "Coffee Rhythm", scenes: ["咖啡", "咖啡馆", "休闲", "午后"], defaultTarget: "☕", defaultObstacle: "📱", defaultBg: "linear-gradient(180deg, #6f4e37, #3a2818)", defaultInstruction: "Tap on beat for the perfect pull", duration: 34 },
  { id: "coffee_rhythm", engine: "rhythm_tap", nameZh: "Latte Beat", scenes: ["拉花", "甜品", "慢生活", "坐"], defaultTarget: "🍰", defaultObstacle: "⏳", defaultBg: "linear-gradient(180deg, #a08060, #504030)", defaultInstruction: "Tap the lit slot when it glows", duration: 33 },
  { id: "museum_snap", engine: "shutter_snap", nameZh: "Museum Shutter", scenes: ["博物馆", "展览", "艺术", "静"], defaultTarget: "🖼️", defaultObstacle: "🚫", defaultBg: "linear-gradient(180deg, #4a4a55, #252530)", defaultInstruction: "Shoot when the exhibit is centered", duration: 35 },
  { id: "gallery_pop", engine: "photo_pop", nameZh: "Gallery Pop", scenes: ["画廊", "拍照", "打卡", "建筑"], defaultTarget: "📷", defaultObstacle: "👥", defaultBg: "linear-gradient(180deg, #e8e4dc, #989088)", defaultInstruction: "Tap the best angle when it pops up", duration: 32 },
  { id: "mountain_hold", engine: "hold_crosswalk", nameZh: "Summit Push", scenes: ["登山", "山顶", "高原", "喘"], defaultTarget: "🚩", defaultObstacle: "🪨", defaultBg: "linear-gradient(180deg, #6a8a9a, #2a4050)", defaultInstruction: "Hold during safe stretches to climb", duration: 40 },
  { id: "summit_flag", engine: "hold_crosswalk", nameZh: "Flag Moment", scenes: ["峰顶", "旗帜", "成就", "云"], defaultTarget: "🏔️", defaultObstacle: "🌫️", defaultBg: "linear-gradient(180deg, #90b0c8, #405868)", defaultInstruction: "Hold forward when the view is clear", duration: 38 },
  { id: "river_drag", engine: "drag_jar", nameZh: "Creek Glow", scenes: ["溪流", "玩水", "清凉", "石头"], defaultTarget: "💎", defaultObstacle: "🐟", defaultBg: "linear-gradient(180deg, #4a9a8a, #1a5048)", defaultInstruction: "Drag the net to catch surface light", duration: 36 },
  { id: "lake_catch", engine: "falling_catch", nameZh: "Lakeside Catch", scenes: ["湖", "倒影", "露营", "静水"], defaultTarget: "🦢", defaultObstacle: "🍂", defaultBg: "linear-gradient(180deg, #5a9ab0, #2a5a68)", defaultInstruction: "Move to catch gifts on the water", duration: 37 },
  { id: "wildlife_snap", engine: "shutter_snap", nameZh: "Wildlife Snap", scenes: ["动物", "观鸟", "森林", "国家公园"], defaultTarget: "🦌", defaultObstacle: "📯", defaultBg: "linear-gradient(180deg, #3d6a40, #1a3820)", defaultInstruction: "Shutter when the animal is in frame", duration: 35 },
  { id: "safari_pop", engine: "photo_pop", nameZh: "Savanna Pop", scenes: ["草原", "safari", "开阔", "远观"], defaultTarget: "🦁", defaultObstacle: "🌾", defaultBg: "linear-gradient(180deg, #c8b060, #6a7830)", defaultInstruction: "Tap instantly when it appears", duration: 33 },
  { id: "diary_quiz", engine: "text_quiz", nameZh: "Travel Quiz", scenes: ["日记", "回忆", "随笔", "记录"], defaultTarget: "📔", defaultObstacle: "❓", defaultBg: "linear-gradient(180deg, #5a6a7a, #2a3540)", defaultInstruction: "Pick the answer that fits your trip best", duration: 0, defaultTextRounds: GENERIC_QUIZ },
  { id: "landmark_quiz", engine: "text_quiz", nameZh: "Landmark Quiz", scenes: ["地标", "建筑", "打卡", "名胜"], defaultTarget: "🏛️", defaultObstacle: "🗺️", defaultBg: "linear-gradient(180deg, #8a7a6a, #3a3228)", defaultInstruction: "Answer a quick question about the landmark", duration: 0, defaultTextRounds: GENERIC_QUIZ },
  { id: "food_quiz", engine: "text_quiz", nameZh: "Food Quiz", scenes: ["美食", "餐厅", "好吃", "料理"], defaultTarget: "🍽️", defaultObstacle: "🌶️", defaultBg: "linear-gradient(180deg, #e8a060, #8b4020)", defaultInstruction: "Pick what matches your taste buds", duration: 0, defaultTextRounds: GENERIC_QUIZ },
  { id: "caption_fill", engine: "text_fill", nameZh: "Caption Fill", scenes: ["配文", "朋友圈", "文案", "发帖"], defaultTarget: "✍️", defaultObstacle: "⌨️", defaultBg: "linear-gradient(180deg, #6a5a8a, #2a2040)", defaultInstruction: "Tap words to finish your travel caption", duration: 0, defaultTextRounds: GENERIC_FILL },
  { id: "diary_fill", engine: "text_fill", nameZh: "Diary Fill", scenes: ["日记", "手账", "笔记", "心情"], defaultTarget: "📝", defaultObstacle: "🖊️", defaultBg: "linear-gradient(180deg, #4a5a6a, #1a2838)", defaultInstruction: "Fill the blanks in your diary entry", duration: 0, defaultTextRounds: GENERIC_FILL },
  { id: "mood_fill", engine: "text_fill", nameZh: "Mood Fill", scenes: ["心情", "感受", "氛围", "情绪"], defaultTarget: "💭", defaultObstacle: "😶", defaultBg: "linear-gradient(180deg, #7a6a9a, #3a2850)", defaultInstruction: "Pick words for the air and mood right now", duration: 0, defaultTextRounds: GENERIC_FILL },
  { id: "itinerary_order", engine: "text_order", nameZh: "Trip Sentence", scenes: ["行程", "路线", "计划", "攻略"], defaultTarget: "🗓️", defaultObstacle: "⏰", defaultBg: "linear-gradient(180deg, #5a8a9a, #2a4858)", defaultInstruction: "Tap words in order to build a trip line", duration: 0, defaultTextRounds: GENERIC_ORDER },
  { id: "taste_order", engine: "text_order", nameZh: "Taste Sentence", scenes: ["味觉", "小吃", "招牌", "排队"], defaultTarget: "👅", defaultObstacle: "🔥", defaultBg: "linear-gradient(180deg, #d08050, #6a3018)", defaultInstruction: "Arrange words into a flavor line", duration: 0, defaultTextRounds: GENERIC_ORDER },
  { id: "journey_choice", engine: "text_choice", nameZh: "Trip Fork", scenes: ["选择", "分叉", "冒险", "偶遇"], defaultTarget: "🛤️", defaultObstacle: "🤔", defaultBg: "linear-gradient(180deg, #4a6a5a, #1a3028)", defaultInstruction: "Pick your branch of the journey", duration: 0, defaultTextRounds: GENERIC_CHOICE },
  { id: "detour_choice", engine: "text_choice", nameZh: "Detour Pick", scenes: ["绕路", "小巷", "迷路", "探索"], defaultTarget: "🧭", defaultObstacle: "🚧", defaultBg: "linear-gradient(180deg, #7a8a6a, #3a4030)", defaultInstruction: "Choose the call you'd make on the road", duration: 0, defaultTextRounds: GENERIC_CHOICE },
  { id: "hostel_choice", engine: "text_choice", nameZh: "Hostel Nights", scenes: ["青旅", "民宿", "同住", "夜聊"], defaultTarget: "🛏️", defaultObstacle: "🌙", defaultBg: "linear-gradient(180deg, #3a4a6a, #151c30)", defaultInstruction: "Pick your version of the night story", duration: 0, defaultTextRounds: GENERIC_CHOICE },
  { id: "market_bargain", engine: "text_choice", nameZh: "Market Haggle", scenes: ["市集", "砍价", "摊位", "讨价还价"], defaultTarget: "💰", defaultObstacle: "🏷️", defaultBg: "linear-gradient(180deg, #c89050, #5a3818)", defaultInstruction: "Pick your bargaining strategy", duration: 0, defaultTextRounds: GENERIC_CHOICE },
];

function normalizeTextRounds(raw: unknown, engine: import("./types").GameEngine): TextRound[] | undefined {
  const list = coerceArray(raw);
  if (!list) return undefined;
  const out: TextRound[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const prompt = normalizeGameText(o.prompt);
    if (!prompt) continue;
    if (engine === "text_order" || Array.isArray(o.tiles)) {
      const tiles = Array.isArray(o.tiles)
        ? o.tiles.map(normalizeGameText).filter(Boolean).slice(0, 8)
        : [];
      if (tiles.length >= 2) out.push({ prompt, tiles });
      continue;
    }
    const options = Array.isArray(o.options)
      ? o.options.map(normalizeGameText).filter(Boolean).slice(0, engine === "text_choice" ? 2 : 4)
      : [];
    const correctIndex = Math.max(0, Math.min(options.length - 1, Number(o.correctIndex) || 0));
    if (options.length >= 2) out.push({ prompt, options, correctIndex });
  }
  return out.length ? out.slice(0, 6) : undefined;
}

function isBrochureTitle(title: string, templateName: string): boolean {
  if (!title) return true;
  if (title.toLowerCase() === templateName.toLowerCase()) return true;
  const brochure =
    /\b(adventure|journey|quest|explorer|wanderlust|beautiful|peaceful|magical|discover|unforgettable)\b/i;
  if (brochure.test(title)) return true;
  const words = title.trim().split(/\s+/);
  if (words.length <= 3 && /^(forest|beach|city|snow|metro|travel|diary|bamboo|market|temple|rain|storm|train|tram|desert|mountain|river|lake|wildlife|safari|gallery|museum|cafe|coffee|hostel|crosswalk|urban|night|garden|street|shrine|coast|harbor|motorbike|alley|winter|festival|lantern|summit|flag|creek|lakeside|caption|mood|itinerary|taste|landmark|food|hostel|detour|journey)\b/i.test(title)) {
    return true;
  }
  return false;
}

const byId = new Map(GAME_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: GameTemplateId): GameTemplateDef {
  return byId.get(id) ?? GAME_TEMPLATES[0];
}

export function catalogForAI(): { id: GameTemplateId; scenes: string[]; engine: string; nameZh: string }[] {
  return GAME_TEMPLATES.map((t) => ({
    id: t.id,
    scenes: t.scenes,
    engine: t.engine,
    nameZh: t.nameZh,
  }));
}

const LEGACY_ENGINE: Record<string, import("./types").GameEngine> = {
  catch: "falling_catch",
  dodge: "falling_tap_clear",
  tap_dodge: "falling_tap_clear",
  swarm: "falling_swarm",
};

function normalizeJourneyBeat(
  raw: unknown,
  hint: string,
  title: string,
): import("./types").JourneyBeat | undefined {
  const fields = normalizeJourneyBeatFields(raw);
  if (fields) {
    const moment = fields.moment ?? "";
    const headline = fields.headline ?? "";
    if (moment || headline) {
      const twist = fields.twist ?? "";
      const taglineFallback = twist || "not me turning a journal into a mini game";
      return {
        headline: headline || title || "core memory (unhinged edition)",
        moment: moment || headline,
        twist: twist || taglineFallback,
        villain: fields.villain || "the thing that ate your patience",
        treasure: fields.treasure || "one tiny win",
        safeLabel: fields.safeLabel || undefined,
        dangerLabel: fields.dangerLabel || undefined,
        runEpithet: fields.runEpithet || undefined,
        mnemoQuip: fields.mnemoQuip || undefined,
        shareCaption: fields.shareCaption || undefined,
      };
    }
  }
  const snippet = hint.trim();
  if (!snippet) return undefined;
  const moodMatch = snippet.match(/Moods:\s*([^\n]+)/i);
  const placeMatch = snippet.match(/Places:\s*([^\n]+)/i);
  const moodBit = moodMatch?.[1]?.split(",")[0]?.trim();
  const placeBit = placeMatch?.[1]?.split(",")[0]?.trim();
  const moment = snippet
    .replace(/^(Moods|Places|Topics|Persona|Timeline|Voice notes|Trip title):[^\n]*\n?/gim, "")
    .trim()
    .slice(0, 140) || snippet.slice(0, 140);
  const hook = placeBit
    ? `not me thinking ${placeBit} would fix me`
    : moodBit
      ? `the way this whole trip was giving ${moodBit}`
      : "pressed my trip into a game";
  return {
    headline: title || (placeBit ? `${placeBit} derailed me` : "core memory (unhinged edition)"),
    moment: moment.slice(0, 120) || hook,
    twist: moodBit
      ? `you said it was giving ${moodBit} — the game said prove it`
      : "you thought you were journaling. you're now content.",
    villain: /tired|crowd|line|wait/i.test(moodBit ?? "") ? "the line goblin" : "chaos gremlin",
    treasure: placeBit ? `one ${placeBit} pic that isn't blurry` : "one tiny win",
    mnemoQuip: "Mnemo: pressed your trip into something you can actually post.",
    shareCaption: `${hook}\nthis wasn't in the brochure\n#Mnemo #TravelTok #CoreMemory`,
  };
}

function normalizeGameAssets(raw: unknown): import("./types").GameAssetSpec[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: import("./types").GameAssetSpec[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const role = o.role as import("./types").GameAssetRole;
    if (!["target", "obstacle", "player", "prop"].includes(role)) continue;
    const displayName = normalizeGameText(o.displayName);
    if (!displayName) continue;
    out.push({
      role,
      displayName,
      imagePrompt: typeof o.imagePrompt === "string" ? normalizeGameText(o.imagePrompt) : undefined,
      referencePhotoIndex:
        typeof o.referencePhotoIndex === "number"
          ? o.referencePhotoIndex
          : o.referencePhotoIndex === null
            ? null
            : undefined,
      needsUserPhoto: o.needsUserPhoto === true,
      uploadTease: typeof o.uploadTease === "string" ? o.uploadTease : undefined,
      mood: typeof o.mood === "string" ? o.mood : undefined,
      status: o.status as import("./types").GameAssetStatus | undefined,
      spriteUrl: typeof o.spriteUrl === "string" ? o.spriteUrl : undefined,
    });
  }
  return out.length ? out : undefined;
}

export function resolveSpec(parsed: Record<string, unknown>): import("./types").AIGameTemplateSpec {
  let templateId = parsed.templateId as GameTemplateId | undefined;
  if (!templateId || !byId.has(templateId)) {
    const ps = parsed.playStyle as string | undefined;
    const mech = parsed.mechanic as string | undefined;
    if (ps === "swarm") templateId = "market_swarm";
    else if (ps === "tap_dodge") templateId = "rain_shield";
    else templateId = "forest_catch";
    if (mech === "dodge" && !parsed.playStyle) templateId = "rain_shield";
  }
  const tpl = getTemplate(templateId);
  const engine =
    tpl.engine ||
    (parsed.engine as import("./types").GameEngine) ||
    LEGACY_ENGINE[(parsed.playStyle as string) ?? ""] ||
    "falling_catch";

  const textFromAi = normalizeTextRounds(parsed.textRounds, engine);
  const textRounds =
    textFromAi ??
    (isTextEngine(engine) ? tpl.defaultTextRounds : undefined);

  const beatFields = normalizeJourneyBeatFields(parsed.journeyBeat);
  const rawTitle = normalizeGameText(parsed.title);
  const tagline = normalizeGameText(parsed.tagline);
  const title =
    rawTitle && !isBrochureTitle(rawTitle, tpl.nameZh)
      ? rawTitle
      : beatFields?.headline || tagline?.slice(0, 48) || "trip got playable";
  const hint = normalizeGameText(parsed.hint);

  return {
    templateId: tpl.id,
    engine,
    title,
    tagline,
    targetEmoji: normalizeGameText(parsed.targetEmoji) || tpl.defaultTarget,
    obstacleEmoji: normalizeGameText(parsed.obstacleEmoji) || tpl.defaultObstacle,
    background: normalizeGameText(parsed.background) || tpl.defaultBg,
    duration: isTextEngine(engine)
      ? (textRounds?.length ?? 4) * 12
      : Math.min(55, Math.max(28, Number(parsed.duration) || tpl.duration)),
    instruction: normalizeGameText(parsed.instruction) || tpl.defaultInstruction,
    textRounds,
    journeyBeat: normalizeJourneyBeat(parsed.journeyBeat, hint || String(parsed.journalText ?? ""), title),
    gameAssets: normalizeGameAssets(parsed.gameAssets),
    targetSpriteUrl: typeof parsed.targetSpriteUrl === "string" ? parsed.targetSpriteUrl : undefined,
    obstacleSpriteUrl: typeof parsed.obstacleSpriteUrl === "string" ? parsed.obstacleSpriteUrl : undefined,
    playerSpriteUrl: typeof parsed.playerSpriteUrl === "string" ? parsed.playerSpriteUrl : undefined,
    assetRunId: typeof parsed.assetRunId === "string" ? parsed.assetRunId : undefined,
  };
}
