import { useEffect, useState } from "react";
import { Images } from "lucide-react";

type Mode = "intro" | "play" | "panel";

type Props = {
  photos: string[];
  mode?: Mode;
  /** CSS gradient behind photos (from game spec) */
  tint?: string;
  className?: string;
};

export function JournalAlbumBackdrop({ photos, mode = "play", tint, className = "" }: Props) {
  const list = photos.filter(Boolean).slice(0, 6);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [list.length]);

  useEffect(() => {
    if (list.length <= 1 || mode === "panel") return;
    const ms = mode === "intro" ? 7000 : 11000;
    const t = window.setInterval(() => setActive((i) => (i + 1) % list.length), ms);
    return () => clearInterval(t);
  }, [list.length, mode]);

  if (!list.length) {
    return tint ? (
      <div className={`absolute inset-0 z-0 ${className}`} style={{ background: tint }} aria-hidden />
    ) : null;
  }

  const playOpacity = mode === "intro" ? "opacity-[0.38]" : mode === "panel" ? "opacity-[0.32]" : "opacity-[0.24]";
  const blur = mode === "play" ? "blur-[1px]" : "blur-0";

  if (mode === "intro" && list.length >= 2) {
    return (
      <div className={`absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden>
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-50">
          {list.slice(0, 4).map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              className={[
                "h-full w-full object-cover game-level-bg-drift",
                i % 2 === 0 ? "origin-bottom-left" : "origin-top-right",
              ].join(" ")}
              style={{ animationDelay: `${i * 1.2}s`, animationDuration: `${12 + i * 2}s` }}
            />
          ))}
        </div>
        {tint && <div className="absolute inset-0 opacity-45" style={{ background: tint }} />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/80" />
        <AlbumBadge count={list.length} className="top-4 right-4" />
      </div>
    );
  }

  const src = list[active] ?? list[0];

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`} aria-hidden>
      {list.map((photo, i) => (
        <img
          key={photo}
          src={photo}
          alt=""
          className={[
            "absolute inset-0 h-full w-full object-cover scale-105 transition-opacity duration-[1.2s]",
            playOpacity,
            blur,
            i === active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ))}
      {tint && <div className="absolute inset-0 opacity-35" style={{ background: tint }} />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/78" />
      {mode === "play" && list.length > 1 && (
        <AlbumBadge count={list.length} className="bottom-4 left-4 opacity-80" compact />
      )}
      {mode !== "play" && <AlbumBadge count={list.length} className="top-4 right-4" />}
    </div>
  );
}

function AlbumBadge({
  count,
  className = "",
  compact,
}: {
  count: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "absolute z-[1] flex items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <Images className="h-3 w-3 text-riso-cyan" />
      <span className="font-mono text-[9px] uppercase tracking-wider text-white/80">
        {compact ? "Your album" : `From your journal · ${count} photo${count === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
