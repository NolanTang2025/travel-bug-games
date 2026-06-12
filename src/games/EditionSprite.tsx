type Props = {
  src: string;
  size?: number;
  onClick?: () => void;
  label?: string;
  variant?: "target" | "obstacle" | "player" | "prop";
  className?: string;
};

export function EditionSprite({
  src,
  size = 56,
  onClick,
  label,
  variant = "target",
  className = "",
}: Props) {
  const body = (
    <img src={src} alt="" className="edition-sprite-img" draggable={false} loading="lazy" />
  );
  const classes = [
    "edition-sprite",
    `edition-sprite-${variant}`,
    onClick ? "edition-sprite-btn" : "edition-sprite-static",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const style = { width: size, height: size };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={style} aria-label={label ?? "Catch"}>
        {body}
      </button>
    );
  }

  return (
    <span className={classes} style={style} aria-hidden={!label}>
      {body}
    </span>
  );
}

export function editionSpriteSrc(
  edition: { game: { sprites?: Partial<Record<"target" | "obstacle" | "player" | "prop", string>> } },
  role: "target" | "obstacle" | "player" | "prop",
): string | undefined {
  return edition.game.sprites?.[role];
}
