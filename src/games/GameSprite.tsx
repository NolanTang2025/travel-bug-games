import type { AIGameTemplateSpec, GameAssetRole } from "./templates/types";
import { resolveGameSprite } from "./gameAssetResolve";

type SpriteProps = {
  spec: AIGameTemplateSpec;
  role: GameAssetRole;
  albumPhotos?: string[];
  emoji?: string;
  size?: number;
  onClick?: () => void;
  label?: string;
  className?: string;
};

export function GameSprite({
  spec,
  role,
  albumPhotos,
  emoji,
  size = 56,
  onClick,
  label,
  className = "",
}: SpriteProps) {
  const resolved = resolveGameSprite(spec, role, albumPhotos);
  const fallbackEmoji = emoji ?? resolved.emoji;
  const aria = label ?? resolved.displayName ?? "Game sprite";

  const inner = resolved.src ? (
    <img
      src={resolved.src}
      alt=""
      className={[
        "h-[78%] w-[78%] object-cover rounded-full",
        resolved.isPhotoSticker ? "game-sprite-photo" : "game-sprite-aigc",
      ].join(" ")}
      draggable={false}
    />
  ) : (
    <span className="game-fly-target-emoji">{fallbackEmoji}</span>
  );

  const style = { width: size, height: size };
  const classes = [
    "game-fly-target inline-flex items-center justify-center",
    resolved.isAigc ? "game-fly-target-aigc" : "",
    resolved.isPhotoSticker ? "game-fly-target-photo" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={style} aria-label={aria}>
        {inner}
      </button>
    );
  }

  return (
    <span className={`${classes} game-fly-target-static`} style={style}>
      {inner}
    </span>
  );
}
