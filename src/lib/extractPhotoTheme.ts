/** RGB 0–255 → HSL for Tailwind-style `H S% L%` tokens */
function rgbToHslParts(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export type PhotoTheme = {
  /** `H S% L%` for accents / rings */
  accentHsl: string;
  /** Soft mesh background (full CSS gradient) */
  meshGradient: string;
  /** Primary action button gradient */
  ctaGradient: string;
};

/**
 * Samples the cover image and builds a bright, airy palette (high lightness wash).
 */
export async function extractPhotoTheme(dataUrl: string): Promise<PhotoTheme> {
  const img = new Image();
  img.decoding = "async";
  img.src = dataUrl;
  await img.decode();

  const w = 48;
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return defaultTheme();
  }
  ctx.drawImage(img, 0, 0, w, h);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return defaultTheme();
  }

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 20) continue;
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
    n++;
  }
  if (!n) return defaultTheme();
  r /= n;
  g /= n;
  b /= n;

  const { h: hue, s: sat, l: light } = rgbToHslParts(r, g, b);
  const accentS = Math.min(72, Math.max(28, sat + 12));
  const accentL = Math.min(52, Math.max(38, light > 75 ? light - 18 : light + 6));
  const accentHsl = `${hue} ${accentS}% ${accentL}%`;

  const washS = Math.max(12, Math.min(38, Math.round(sat * 0.35)));
  const wash1 = `${hue} ${washS}% 97.5%`;
  const wash2 = `${hue} ${washS + 8}% 95%`;
  const wash3 = `${(hue + 18) % 360} ${washS + 5}% 93.5%`;

  const meshGradient = `linear-gradient(165deg, hsl(${wash1}) 0%, hsl(${wash2}) 42%, hsl(${wash3}) 100%)`;

  const h2 = (hue + 22) % 360;
  const ctaGradient = `linear-gradient(135deg, hsl(${hue} ${accentS}% ${accentL}%) 0%, hsl(${h2} ${Math.min(70, accentS + 8)}% ${Math.min(56, accentL + 6)}%) 100%)`;

  return { accentHsl, meshGradient, ctaGradient };
}

function defaultTheme(): PhotoTheme {
  return {
    accentHsl: "200 55% 48%",
    meshGradient:
      "linear-gradient(165deg, hsl(210 35% 98%) 0%, hsl(200 30% 96%) 45%, hsl(215 28% 94%) 100%)",
    ctaGradient: "linear-gradient(135deg, hsl(200 55% 48%) 0%, hsl(215 60% 52%) 100%)",
  };
}

/** Before any photo is uploaded */
export const AI_FORGE_FALLBACK_THEME: PhotoTheme = defaultTheme();
