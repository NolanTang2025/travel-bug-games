import type { AIGameTemplateSpec, GameAssetRole, GameAssetSpec } from "./templates/types";

export type ResolvedSprite = {
  src?: string;
  emoji: string;
  displayName?: string;
  isPhotoSticker?: boolean;
  isAigc?: boolean;
};

function assetForRole(spec: AIGameTemplateSpec, role: GameAssetRole): GameAssetSpec | undefined {
  return spec.gameAssets?.find((a) => a.role === role);
}

function emojiForRole(spec: AIGameTemplateSpec, role: GameAssetRole): string {
  if (role === "obstacle") return spec.obstacleEmoji;
  if (role === "player") return spec.playerSpriteUrl ? "🧍" : spec.targetEmoji;
  return spec.targetEmoji;
}

export function resolveGameSprite(
  spec: AIGameTemplateSpec,
  role: GameAssetRole,
  albumPhotos?: string[],
): ResolvedSprite {
  const asset = assetForRole(spec, role);
  const emoji = emojiForRole(spec, role);

  if (asset?.status === "ready" && asset.spriteUrl) {
    return { src: asset.spriteUrl, emoji, displayName: asset.displayName, isAigc: true };
  }

  const topLevel =
    role === "target"
      ? spec.targetSpriteUrl
      : role === "obstacle"
        ? spec.obstacleSpriteUrl
        : spec.playerSpriteUrl;
  if (topLevel) {
    return { src: topLevel, emoji, displayName: asset?.displayName, isAigc: true };
  }

  const refIdx = asset?.referencePhotoIndex;
  if (
    (asset?.status === "fallback_photo" || asset?.status === "needs_upload") &&
    typeof refIdx === "number" &&
    albumPhotos?.[refIdx]
  ) {
    return {
      src: albumPhotos[refIdx],
      emoji,
      displayName: asset.displayName,
      isPhotoSticker: true,
    };
  }

  if (albumPhotos?.length && role === "target") {
    return { src: albumPhotos[0], emoji, displayName: asset?.displayName, isPhotoSticker: true };
  }

  return { emoji, displayName: asset?.displayName };
}

export function assetsNeedingUpload(spec: AIGameTemplateSpec): GameAssetSpec[] {
  return (spec.gameAssets ?? []).filter((a) => a.status === "needs_upload" && a.uploadTease);
}

export function readyAssetLabels(spec: AIGameTemplateSpec): string[] {
  return (spec.gameAssets ?? [])
    .filter((a) => a.status === "ready" && a.displayName)
    .map((a) => a.displayName);
}
