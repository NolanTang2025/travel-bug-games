/** Travel destination → BCP-47 locale + wording for AI “write in official language” prompts */
export type TravelLocale = {
  id: string;
  /** Shown in the location picker */
  label: string;
  /** Extra hint on the row */
  hint?: string;
  locale: string;
  /** Tell the model exactly which written language to use */
  promptLang: string;
};

export const DEFAULT_TRAVEL_LOCALE_ID = "cn";

export const TRAVEL_LOCALES: TravelLocale[] = [
  { id: "cn", label: "中国大陆", hint: "简体中文", locale: "zh-CN", promptLang: "Simplified Chinese (简体中文)" },
  { id: "tw", label: "中国台湾", hint: "繁體中文", locale: "zh-TW", promptLang: "Traditional Chinese as used in Taiwan (繁體中文)" },
  { id: "hk", label: "中国香港", hint: "繁體中文", locale: "zh-HK", promptLang: "Traditional Chinese as used in Hong Kong (香港繁體中文)" },
  { id: "mo", label: "中国澳门", hint: "中文 / Português", locale: "zh-MO", promptLang: "Traditional Chinese as used in Macau (澳門繁體中文)" },
  { id: "jp", label: "日本", hint: "日本語", locale: "ja-JP", promptLang: "Japanese (日本語)" },
  { id: "kr", label: "韩国", hint: "한국어", locale: "ko-KR", promptLang: "Korean (한국어)" },
  { id: "fr", label: "法国", hint: "Français", locale: "fr-FR", promptLang: "French (français)" },
  { id: "de", label: "德国", hint: "Deutsch", locale: "de-DE", promptLang: "German (Deutsch)" },
  { id: "es-es", label: "西班牙", hint: "Español", locale: "es-ES", promptLang: "Spanish as spoken in Spain (español)" },
  { id: "es-mx", label: "墨西哥", hint: "Español", locale: "es-MX", promptLang: "Spanish as spoken in Mexico (español)" },
  { id: "it", label: "意大利", hint: "Italiano", locale: "it-IT", promptLang: "Italian (italiano)" },
  { id: "gb", label: "英国", hint: "English", locale: "en-GB", promptLang: "English (United Kingdom)" },
  { id: "us", label: "美国", hint: "English", locale: "en-US", promptLang: "English (United States)" },
  { id: "ca", label: "加拿大（英语）", hint: "English", locale: "en-CA", promptLang: "English as used in Canada" },
  { id: "ca-fr", label: "加拿大（法语）", hint: "Français", locale: "fr-CA", promptLang: "French as used in Canada (français canadien)" },
  { id: "br", label: "巴西", hint: "Português", locale: "pt-BR", promptLang: "Brazilian Portuguese (português do Brasil)" },
  { id: "pt", label: "葡萄牙", hint: "Português", locale: "pt-PT", promptLang: "European Portuguese (português europeu)" },
  { id: "nl", label: "荷兰", hint: "Nederlands", locale: "nl-NL", promptLang: "Dutch (Nederlands)" },
  { id: "se", label: "瑞典", hint: "Svenska", locale: "sv-SE", promptLang: "Swedish (svenska)" },
  { id: "no", label: "挪威", hint: "Norsk", locale: "nb-NO", promptLang: "Norwegian Bokmål (norsk)" },
  { id: "dk", label: "丹麦", hint: "Dansk", locale: "da-DK", promptLang: "Danish (dansk)" },
  { id: "fi", label: "芬兰", hint: "Suomi", locale: "fi-FI", promptLang: "Finnish (suomi)" },
  { id: "pl", label: "波兰", hint: "Polski", locale: "pl-PL", promptLang: "Polish (polski)" },
  { id: "tr", label: "土耳其", hint: "Türkçe", locale: "tr-TR", promptLang: "Turkish (Türkçe)" },
  { id: "sa", label: "沙特阿拉伯", hint: "العربية", locale: "ar-SA", promptLang: "Modern Standard Arabic (العربية الفصحى)" },
  { id: "ae", label: "阿联酋", hint: "العربية", locale: "ar-AE", promptLang: "Arabic as used in the UAE (العربية)" },
  { id: "il", label: "以色列", hint: "עברית", locale: "he-IL", promptLang: "Hebrew (עברית)" },
  { id: "ru", label: "俄罗斯", hint: "Русский", locale: "ru-RU", promptLang: "Russian (русский)" },
  { id: "gr", label: "希腊", hint: "Ελληνικά", locale: "el-GR", promptLang: "Greek (ελληνικά)" },
  { id: "th", label: "泰国", hint: "ไทย", locale: "th-TH", promptLang: "Thai (ภาษาไทย)" },
  { id: "vn", label: "越南", hint: "Tiếng Việt", locale: "vi-VN", promptLang: "Vietnamese (Tiếng Việt)" },
  { id: "id", label: "印度尼西亚", hint: "Bahasa Indonesia", locale: "id-ID", promptLang: "Indonesian (Bahasa Indonesia)" },
  { id: "my", label: "马来西亚", hint: "Bahasa Melayu", locale: "ms-MY", promptLang: "Malay (Bahasa Melayu)" },
  { id: "sg", label: "新加坡", hint: "English", locale: "en-SG", promptLang: "English as used in Singapore" },
  { id: "ph", label: "菲律宾", hint: "Filipino / English", locale: "fil-PH", promptLang: "Filipino (wikang Filipino)" },
  { id: "in", label: "印度（英语）", hint: "English", locale: "en-IN", promptLang: "English as used in India" },
  { id: "au", label: "澳大利亚", hint: "English", locale: "en-AU", promptLang: "English as used in Australia" },
  { id: "nz", label: "新西兰", hint: "English", locale: "en-NZ", promptLang: "English as used in New Zealand" },
];

export function getTravelLocale(id: string): TravelLocale {
  return TRAVEL_LOCALES.find((t) => t.id === id) ?? TRAVEL_LOCALES.find((t) => t.id === DEFAULT_TRAVEL_LOCALE_ID)!;
}
