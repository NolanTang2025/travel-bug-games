import { useState } from "react";
import type { MemeTrend } from "@/data/memeTrendTypes";

type TrendCoverImageProps = {
  trend: MemeTrend;
  className?: string;
  alt?: string;
  sizes?: string;
};

export function TrendCoverImage({ trend, className = "", alt, sizes }: TrendCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const label = alt ?? `${trend.title} trend cover`;

  return (
    <div
      className={`relative overflow-hidden bg-riso-ink/10 ${className}`}
      style={failed ? { background: trend.gradient } : undefined}
    >
      {!failed && (
        <img
          src={trend.coverUrl}
          alt={label}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-riso-ink/85 via-riso-ink/25 to-transparent"
        aria-hidden
      />
    </div>
  );
}
