export type AppLocale = "en" | "zh-CN" | "ja" | "ko" | "zh-TW";

export type TranslationKey =
  | "brand"
  | "heroTitle"
  | "heroSubtitle"
  | "ctaJournal"
  | "ctaGames"
  | "sectionMemories"
  | "caseYunqiBadge"
  | "caseYunqiTitle"
  | "caseYunqiDesc"
  | "caseAiBadge"
  | "caseAiTitle"
  | "caseAiDesc"
  | "footer"
  | "navHome"
  | "navJournal"
  | "langLabel"
  | "previewWeb"
  | "previewMobile"
  | "journalStepMedia"
  | "journalStepStory"
  | "journalTravelLocationLabel"
  | "journalTravelLocationHelp"
  | "journalIgPlaceholder"
  | "journalTwPlaceholder"
  | "journalUploadHint"
  | "journalAlbumNote"
  | "journalNarrativeLabel"
  | "journalNarrativePlaceholder"
  | "journalVoiceHint"
  | "journalVoiceStart"
  | "journalVoiceStop"
  | "journalPreviewBook"
  | "journalTurnGame"
  | "journalNeedImage"
  | "journalRemove"
  | "journalClearDraft"
  | "journalImageTooLarge"
  | "journalImageReadFail"
  | "importUrlLabel"
  | "importUrlHelp"
  | "importUrlPlaceholder"
  | "importUrlButton"
  | "importUrlLoading"
  | "importImageOk"
  | "importPostOk"
  | "importPostTextOnly"
  | "importFail"
  | "importAlbumFull"
  | "cookieAdvancedToggle"
  | "cookieHelp"
  | "cookiePlaceholder"
  | "cookieSave"
  | "cookieClear"
  | "cookieSaved"
  | "cookieCleared"
  | "cookieStale"
  | "bookTitle"
  | "bookEmpty"
  | "joinTitle"
  | "joinSubtitle"
  | "joinSubmit"
  | "joinInvalid"
  | "qrTitle"
  | "qrHint"
  | "qrCodeLabel"
  | "qrCopyLink"
  | "qrHandoffFail"
  | "copied"
  | "aiUploadHint"
  | "howtoCatch"
  | "howtoDodge"
  | "howtoMemory"
  | "howtoPhotoTap"
  | "howtoRunner";

const bundles = {
  en: {
    brand: "Travel Memory Games",
    heroTitle: "Your trips, playable forever.",
    heroSubtitle:
      "Paste posts, drop photos, tell the story — build a digital travel journal, then turn it into a mini-game. One featured case: 云栖竹径.",
    ctaJournal: "Start travel journal",
    ctaGames: "Jump to AI game",
    sectionMemories: "Play your memories",
    caseYunqiBadge: "Case · Hangzhou",
    caseYunqiTitle: "云栖竹径吃虫子",
    caseYunqiDesc: "A silly lane-runner with your face — demo of what a “place” can feel like.",
    caseAiBadge: "From your album",
    caseAiTitle: "Journal → AI game",
    caseAiDesc: "Photo + your words → one-screen game in the language of the place you pick.",
    footer: "Made for trips you never want to forget.",
    navHome: "Home",
    navJournal: "Journal",
    langLabel: "Language",
    previewWeb: "Web layout",
    previewMobile: "Phone preview",
    journalStepMedia: "Posts & pictures",
    journalStepStory: "Story",
    journalTravelLocationLabel: "Travel location",
    journalTravelLocationHelp:
      "This journal can be about a different place than where you are now. We’ll default language for voice input & game generation to this place.",
    journalIgPlaceholder: "Instagram post URL (optional)",
    journalTwPlaceholder: "X / Twitter post URL (optional)",
    journalUploadHint:
      "Choose from gallery — you can select multiple files at once (Ctrl/⌘+click). Saved only in this browser.",
    journalAlbumNote:
      "This album has {{n}} photos; the first / cover image is sent to the AI game generator.",
    journalNarrativeLabel: "What happened on this trip?",
    journalNarrativePlaceholder:
      "Type or dictate: mood, food, wrong turns, rain, inside jokes… This text feeds the AI game.",
    journalVoiceHint: "Works in Chrome / Edge when microphone is allowed.",
    journalVoiceStart: "Speak",
    journalVoiceStop: "Stop",
    journalPreviewBook: "Preview scrapbook",
    journalTurnGame: "Turn into game →",
    journalNeedImage: "Add at least one photo from your trip.",
    journalRemove: "Remove",
    journalClearDraft: "Clear draft",
    journalImageTooLarge: "Image too large (max 5MB)",
    journalImageReadFail: "Could not read an image",
    importUrlLabel: "Import from link",
    importUrlHelp:
      "Paste a direct image URL, or a public post page (Instagram, X, blog…). Our server fetches previews so your browser isn’t blocked by cross-origin rules.",
    importUrlPlaceholder: "https://…",
    importUrlButton: "Load",
    importUrlLoading: "Fetching…",
    importImageOk: "Image added to your journal.",
    importPostOk: "Added preview text and cover image when available.",
    importPostTextOnly:
      "Added text from the page. We couldn’t auto-download a preview image — upload a photo if you need one.",
    importFail: "Couldn’t load this link. Check the URL or try uploading the file instead.",
    importAlbumFull: "Photo slots are full — remove one before importing.",
    cookieAdvancedToggle: "Advanced: use cookie (optional)",
    cookieHelp:
      "Paste your Instagram cookie here to fetch captions from private/JS pages. Stored only in this browser. Treat it like a password.",
    cookiePlaceholder: "Paste Cookie header value here…",
    cookieSave: "Save cookie locally",
    cookieClear: "Clear cookie",
    cookieSaved: "Cookie saved locally.",
    cookieCleared: "Cookie cleared.",
    cookieStale: "Cookie may be expired — refresh it.",
    bookTitle: "Your trip spread",
    bookEmpty: "Nothing saved yet — go back and add photos or text.",
    joinTitle: "Open game on this phone",
    joinSubtitle: "Enter the code shown on your computer.",
    joinSubmit: "Continue",
    joinInvalid: "That code didn’t work or expired.",
    qrTitle: "Play on your phone",
    qrHint: "Scan with your camera app. Same Wi‑Fi helps if the link is large.",
    qrCodeLabel: "Or enter code manually",
    qrCopyLink: "Copy link",
    qrHandoffFail: "Could not create a relay code — copy the link or try again.",
    copied: "Copied!",
    aiUploadHint:
      "You can pick multiple photos at once. The big preview is what AI sees—tap a thumbnail to set it as the cover.",
    howtoCatch: "Tap {{target}} to score. Avoid {{obstacle}}.",
    howtoDodge: "Tap {{obstacle}} before it lands. Don't tap {{target}}!",
    howtoMemory: "Flip cards to find matching pairs. Match fast to score more.",
    howtoPhotoTap: "Tap {{target}} as it pops up. Avoid {{obstacle}}. Don't miss too many!",
    howtoRunner: "Swipe ← → to change lanes. Collect {{target}} and dodge {{obstacle}}.",
  },
  "zh-CN": {
    brand: "旅行记忆游戏",
    heroTitle: "把旅途，玩成可以打开的回忆。",
    heroSubtitle:
      "粘贴动态、上传相册照片、口述或写下故事——先做电子手帐，再一键生成小游戏。云栖竹径吃虫子只作为示例案例。",
    ctaJournal: "开始做旅行手帐",
    ctaGames: "直接去 AI 游戏",
    sectionMemories: "玩法入口",
    caseYunqiBadge: "案例 · 杭州",
    caseYunqiTitle: "云栖竹径吃虫子",
    caseYunqiDesc: "刷脸跑酷吃虫子——展示「一个地方」可以怎么玩。",
    caseAiBadge: "从你的相册出发",
    caseAiTitle: "手帐 → AI 游戏",
    caseAiDesc: "照片 + 文字 → 单机小游戏，并可按地点自动用当地官方语言。",
    footer: "给不舍得忘记的旅程。",
    navHome: "首页",
    navJournal: "旅行手帐",
    langLabel: "语言",
    previewWeb: "网页排版",
    previewMobile: "手机预览框",
    journalStepMedia: "帖子与图片",
    journalStepStory: "故事",
    journalTravelLocationLabel: "旅行地定位",
    journalTravelLocationHelp:
      "这篇手帐的地点可以和你当前所在地不同；语音输入与生成游戏会默认按这里的官方语言来写。",
    journalIgPlaceholder: "Instagram 帖子链接（可选）",
    journalTwPlaceholder: "X / Twitter 帖子链接（可选）",
    journalUploadHint: "从相册选择，可一次多选（长按或 Ctrl/⌘+点选）；仅保存在本机浏览器。",
    journalAlbumNote: "手帐中共 {{n}} 张照片，首张（封面）将发给 AI 用于生成游戏。",
    journalNarrativeLabel: "这趟旅途发生了什么？",
    journalNarrativePlaceholder:
      "打字或口述：心情、美食、走错的路、雨天、梗……这些内容会喂给 AI 做游戏。",
    journalVoiceHint: "在 Chrome / Edge 开启麦克风后可语音输入。",
    journalVoiceStart: "开始说",
    journalVoiceStop: "停止",
    journalPreviewBook: "预览手帐版面",
    journalTurnGame: "生成游戏 →",
    journalNeedImage: "请至少上传一张旅途照片。",
    journalRemove: "移除",
    journalClearDraft: "清空草稿",
    journalImageTooLarge: "图片过大（单张不超过 5MB）",
    journalImageReadFail: "读取图片失败",
    importUrlLabel: "从链接读取",
    importUrlHelp:
      "支持图片直链，或公开帖子页面（Instagram、X、博客等）。由服务端抓取预览，避免浏览器跨域限制。",
    importUrlPlaceholder: "https://…",
    importUrlButton: "读取",
    importUrlLoading: "获取中…",
    importImageOk: "图片已加入手帐。",
    importPostOk: "已写入文案并在可用时加入封面图。",
    importPostTextOnly: "已写入页面文案（未能自动下载预览图，可改用手动上传）。",
    importFail: "无法读取该链接，请检查地址或改用手动上传。",
    importAlbumFull: "照片槽位已满，请先删除几张再导入。",
    cookieAdvancedToggle: "高级：使用 Cookie（可选）",
    cookieHelp:
      "将 Instagram 的 Cookie 粘贴在这里，用于抓取需要登录/JS 才能显示的文案。仅保存在本机浏览器，请当作密码对待。",
    cookiePlaceholder: "在此粘贴 Cookie（请求头 Cookie 的值）…",
    cookieSave: "保存到本地",
    cookieClear: "清除 Cookie",
    cookieSaved: "已保存到本地。",
    cookieCleared: "已清除。",
    cookieStale: "Cookie 可能已过期，请更新。",
    bookTitle: "你的手帐版面",
    bookEmpty: "还没有内容——回去添加照片或文字吧。",
    joinTitle: "在手机上打开游戏",
    joinSubtitle: "输入电脑上显示的验证码。",
    joinSubmit: "继续",
    joinInvalid: "验证码无效或已过期。",
    qrTitle: "用手机玩",
    qrHint: "用系统相机扫码。若链接过长，请优先在同一网络下打开。",
    qrCodeLabel: "或手动输入验证码",
    qrCopyLink: "复制链接",
    qrHandoffFail: "无法创建中转码——请复制链接或稍后重试。",
    copied: "已复制",
    aiUploadHint: "支持一次多选照片；大图预览会发给 AI，点击下方小图可切换封面（主图）。",
    howtoCatch: "点击 {{target}} 得分，躲开 {{obstacle}}。",
    howtoDodge: "在 {{obstacle}} 落地前点掉它；不要点 {{target}}！",
    howtoMemory: "翻牌找相同的一对。越快配对分越高。",
    howtoPhotoTap: "看到 {{target}} 立刻点掉；避开 {{obstacle}}，别漏太多！",
    howtoRunner: "左右滑动换道。吃 {{target}}、躲 {{obstacle}}。",
  },
} as const;

const EN = bundles.en;

export const translationsAll: Record<AppLocale, Record<TranslationKey, string>> = {
  en: EN,
  "zh-CN": bundles["zh-CN"],
  ja: EN,
  ko: EN,
  "zh-TW": EN,
};

export function translate(locale: AppLocale, key: TranslationKey): string {
  const pack = translationsAll[locale] ?? translationsAll.en;
  return pack[key] ?? translationsAll.en[key];
}

