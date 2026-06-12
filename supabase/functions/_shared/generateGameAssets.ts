import { serviceClient } from "./supabase.ts";

export type GameAssetDraft = {
  role: string;
  displayName: string;
  imagePrompt: string;
  referencePhotoIndex?: number | null;
  needsUserPhoto?: boolean;
  uploadTease?: string;
  mood?: string;
};

export type GameAssetReady = GameAssetDraft & {
  status: "ready" | "needs_upload" | "fallback_photo" | "fallback_emoji";
  spriteUrl?: string;
};

const STYLE_PREFIX =
  "Mobile game sprite sticker, risograph print aesthetic, thick ink outline, flat vibrant colors, single centered subject, playful not photorealistic, transparent background, no text, no watermark, no border frame.";

function env(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = Deno.env.get(key);
    if (v?.trim()) return v.trim();
  }
  return undefined;
}

async function generatePng(prompt: string): Promise<Uint8Array | null> {
  const openai = env("OPENAI_API_KEY", "openai_api_key");
  if (!openai) {
    console.warn("generateGameAssets: no OPENAI_API_KEY — skipping AIGC");
    return null;
  }

  const fullPrompt = `${STYLE_PREFIX} ${prompt}`.slice(0, 3800);
  const model = env("OPENAI_IMAGE_MODEL", "openai_image_model") ?? "gpt-image-1";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openai}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
        output_format: "png",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("OpenAI images failed:", res.status, errText.slice(0, 400));
      return null;
    }

    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json as string | undefined;
    if (!b64) return null;

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.warn("generatePng error:", e);
    return null;
  }
}

function publicAssetUrl(path: string): string {
  const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/game-assets/${path}`;
}

async function uploadSprite(runId: string, role: string, bytes: Uint8Array): Promise<string | null> {
  const admin = serviceClient();
  const path = `${runId}/${role}-${crypto.randomUUID().slice(0, 8)}.png`;
  const { error } = await admin.storage.from("game-assets").upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    console.warn("uploadSprite:", error.message);
    return null;
  }
  return publicAssetUrl(path);
}

function hasPhotoAt(photos: string[], index: number | null | undefined): boolean {
  if (index == null || index < 0) return false;
  const p = photos[index];
  return typeof p === "string" && p.length > 32;
}

export async function runGenerateGameAssets(
  runId: string,
  drafts: GameAssetDraft[],
  photos: string[],
): Promise<GameAssetReady[]> {
  const results = await Promise.all(
    drafts.map(async (draft): Promise<GameAssetReady> => {
      const refIdx = draft.referencePhotoIndex ?? null;
      const hasRef = hasPhotoAt(photos, refIdx);

      if (draft.needsUserPhoto && !hasRef) {
        return {
          ...draft,
          status: "needs_upload",
        };
      }

      const png = await generatePng(draft.imagePrompt);
      if (png) {
        const url = await uploadSprite(runId, draft.role, png);
        if (url) {
          return { ...draft, status: "ready", spriteUrl: url };
        }
      }

      if (hasRef && refIdx != null) {
        return { ...draft, status: "fallback_photo", referencePhotoIndex: refIdx };
      }

      return { ...draft, status: "fallback_emoji" };
    }),
  );

  const order = ["target", "obstacle", "player", "prop"];
  return results.sort(
    (a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.displayName.localeCompare(b.displayName),
  );
}

export function spriteUrlsFromAssets(assets: GameAssetReady[]): {
  targetSpriteUrl?: string;
  obstacleSpriteUrl?: string;
  playerSpriteUrl?: string;
} {
  const pick = (role: string) => assets.find((a) => a.role === role && a.status === "ready" && a.spriteUrl)?.spriteUrl;
  return {
    targetSpriteUrl: pick("target"),
    obstacleSpriteUrl: pick("obstacle"),
    playerSpriteUrl: pick("player"),
  };
}
