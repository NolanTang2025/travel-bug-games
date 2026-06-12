import type { ReactNode } from "react";

type BoardProps = {
  pinCount: number;
  total: number;
  children: ReactNode;
};

export function InsightsPinBoard({ pinCount, total, children }: BoardProps) {
  return (
    <div className="insights-pin-deck">
      <InsightsMapBoardArt pinCount={pinCount} total={total} />
      <ul className="insights-pin-grid">{children}</ul>
    </div>
  );
}

type CardProps = {
  place: string;
  pinned: boolean;
  tilt: "l" | "r" | "none";
  onToggle: () => void;
};

export function InsightsPlaceCard({ place, pinned, tilt, onToggle }: CardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "insights-place-polaroid",
          pinned ? "insights-place-polaroid-pinned" : "",
          tilt === "l" ? "insights-place-polaroid-tilt-l" : "",
          tilt === "r" ? "insights-place-polaroid-tilt-r" : "",
        ].join(" ")}
      >
        <InsightsPushPin pinned={pinned} />
        <div className="insights-place-photo" aria-hidden>
          <svg viewBox="0 0 120 88" className="insights-place-map-sketch" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="88" fill="#f7f4ed" />
            <path
              d="M8 62 C28 48, 42 72, 58 54 S92 38, 112 28"
              fill="none"
              stroke="#5ec8e8"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M12 44 L48 22 L78 40 L104 18"
              fill="none"
              stroke="#ff3b7b"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.45"
            />
            <circle cx="62" cy="48" r="5" fill="#ff3b7b" opacity="0.85" />
            <circle cx="62" cy="48" r="9" fill="none" stroke="#ff3b7b" strokeWidth="1.5" opacity="0.35" />
          </svg>
        </div>
        <span className="insights-place-name font-hand">{place}</span>
        <span className="insights-place-badge font-mono">{pinned ? "Pinned ✓" : "Tap to pin"}</span>
      </button>
    </li>
  );
}

function InsightsPushPin({ pinned }: { pinned: boolean }) {
  return (
    <svg
      viewBox="0 0 32 40"
      className={["insights-push-pin", pinned ? "insights-push-pin-down" : ""].join(" ")}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="16" cy="11" rx="10" ry="7" fill={pinned ? "#ff3b7b" : "#5ec8e8"} stroke="#1a1a24" strokeWidth="1.5" />
      <ellipse cx="13" cy="9" rx="3" ry="2" fill="#fff" opacity="0.35" />
      <path d="M16 18 L16 34" stroke="#1a1a24" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 34 L12 38 M16 34 L20 38" stroke="#1a1a24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InsightsMapBoardArt({ pinCount, total }: { pinCount: number; total: number }) {
  return (
    <svg viewBox="0 0 360 72" className="insights-pin-board-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="map-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0 L0 0 0 16" fill="none" stroke="#1a1a24" strokeWidth="0.5" opacity="0.12" />
        </pattern>
      </defs>
      <rect x="2" y="4" width="356" height="64" rx="10" fill="url(#map-grid)" stroke="#1a1a24" strokeWidth="2" />
      <circle cx="44" cy="36" r="18" fill="none" stroke="#1a1a24" strokeWidth="1.5" opacity="0.25" />
      <path d="M44 22 L44 50 M30 36 L58 36" stroke="#1a1a24" strokeWidth="1" opacity="0.2" />
      <text x="44" y="40" textAnchor="middle" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="8" opacity="0.5">
        N
      </text>
      <text x="88" y="28" fill="#1a1a24" fontFamily="Archivo Black, sans-serif" fontSize="11" letterSpacing="1">
        PIN BOARD
      </text>
      <text x="88" y="44" fill="#5ec8e8" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="2">
        MNEMO · TRIP MAP
      </text>
      <text x="88" y="58" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="7" opacity="0.55">
        {pinCount}/{total} PINNED
      </text>
      <path d="M260 20 L340 20 L340 52 L260 52 Z" fill="#f5e642" stroke="#1a1a24" strokeWidth="1.5" />
      <text x="300" y="40" textAnchor="middle" fill="#1a1a24" fontFamily="Caveat, cursive" fontSize="14">
        spots that hit
      </text>
      <circle cx="272" cy="36" r="4" fill="#ff3b7b" />
      <circle cx="286" cy="32" r="3" fill="#5ec8e8" />
      <circle cx="328" cy="38" r="3.5" fill="#ff3b7b" opacity="0.7" />
    </svg>
  );
}
