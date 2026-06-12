import type { CSSProperties, ReactNode } from "react";

type PackProps = {
  peeledCount: number;
  children: ReactNode;
};

export function InsightsStickerPack({ peeledCount, children }: PackProps) {
  return (
    <div className="insights-sticker-deck">
      <InsightsStickerSheetArt peeledCount={peeledCount} />
      <div className="insights-sticker-sheet">{children}</div>
    </div>
  );
}

type StickerProps = {
  label: string;
  peeled: boolean;
  tilt: "l" | "r" | "none";
  color: "yellow" | "cyan" | "pink";
  onPeel: () => void;
};

const STICKER_FILL: Record<StickerProps["color"], string> = {
  yellow: "#f5e642",
  cyan: "#5ec8e8",
  pink: "#ff3b7b",
};

export function InsightsSticker({ label, peeled, tilt, color, onPeel }: StickerProps) {
  return (
    <button
      type="button"
      disabled={peeled}
      onClick={onPeel}
      className={[
        "insights-sticker-item",
        peeled ? "insights-sticker-item-peeled" : "",
        tilt === "l" ? "insights-sticker-tilt-l" : "",
        tilt === "r" ? "insights-sticker-tilt-r" : "",
      ].join(" ")}
      style={{ "--sticker-fill": STICKER_FILL[color] } as CSSProperties}
    >
      {!peeled && <span className="insights-sticker-peel-corner" aria-hidden />}
      <span className="insights-sticker-label font-mono">{label}</span>
    </button>
  );
}

type PassportProps = {
  topics: string[];
};

export function InsightsPassportStrip({ topics }: PassportProps) {
  return (
    <div className="insights-passport-strip-deck">
      <InsightsPassportArt />
      <div className="insights-passport-strip">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
          Passport strip {topics.length > 0 ? `· ${topics.length} stuck` : "· empty"}
        </p>
        <div className="insights-passport-strip-inner">
          {topics.length === 0 ? (
            <span className="font-mono text-sm text-muted-foreground">Peel a sticker above ↑</span>
          ) : (
            topics.map((t) => (
              <span key={t} className="insights-passport-topic font-mono">
                {t}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function InsightsStickerSheetArt({ peeledCount }: { peeledCount: number }) {
  return (
    <svg viewBox="0 0 360 52" className="insights-sticker-pack-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="356" height="44" rx="8" fill="#fdfcf9" stroke="#1a1a24" strokeWidth="2" strokeDasharray="6 4" />
      <text x="20" y="24" fill="#1a1a24" fontFamily="Archivo Black, sans-serif" fontSize="10" letterSpacing="1">
        STICKER SHEET
      </text>
      <text x="20" y="40" fill="#ff3b7b" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="2">
        PEEL · STICK · COLLECT
      </text>
      <rect x="250" y="14" width="96" height="24" rx="12" fill="#f5e642" stroke="#1a1a24" strokeWidth="1.5" />
      <text x="298" y="30" textAnchor="middle" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="8">
        Peeled {peeledCount}
      </text>
      <path d="M180 12 L180 40" stroke="#1a1a24" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
    </svg>
  );
}

function InsightsPassportArt() {
  return (
    <svg viewBox="0 0 360 36" className="insights-passport-art-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="356" height="28" rx="6" fill="#1a1a24" opacity="0.04" stroke="#1a1a24" strokeWidth="1.5" />
      <text x="20" y="24" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="3" opacity="0.55">
        PASSPORT STRIP
      </text>
      <circle cx="320" cy="18" r="10" fill="none" stroke="#ff3b7b" strokeWidth="1.5" opacity="0.45" />
      <text x="320" y="21" textAnchor="middle" fill="#ff3b7b" fontFamily="JetBrains Mono, monospace" fontSize="6">
        MNEMO
      </text>
    </svg>
  );
}
