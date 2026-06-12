import type { ReactNode } from "react";

type StripProps = {
  activeIndex: number;
  total: number;
  children: ReactNode;
};

export function InsightsFilmStrip({ activeIndex, total, children }: StripProps) {
  return (
    <div className="insights-film-deck">
      <InsightsFilmLeader activeIndex={activeIndex} total={total} />
      <div className="insights-film-channel">
        <InsightsFilmPerforations side="top" />
        <div className="insights-film-track">{children}</div>
        <InsightsFilmPerforations side="bottom" />
      </div>
    </div>
  );
}

type FrameProps = {
  index: number;
  date: string;
  note: string;
  active: boolean;
  onSelect: () => void;
};

export function InsightsFilmFrame({ index, date, note, active, onSelect }: FrameProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={["insights-film-frame", active ? "insights-film-frame-active" : ""].join(" ")}
    >
      <span className="insights-film-frame-num font-mono">{String(index + 1).padStart(2, "0")}</span>
      <div className="insights-film-frame-window" aria-hidden>
        <svg viewBox="0 0 100 64" className="insights-film-frame-art" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="64" fill="#1a1a24" opacity="0.06" />
          <rect x="6" y="8" width="88" height="48" rx="2" fill="#f7f4ed" stroke="#1a1a24" strokeWidth="1" />
          <circle cx="24" cy="28" r="6" fill="#f5e642" opacity="0.65" />
          <circle cx="52" cy="36" r="9" fill="#5ec8e8" opacity="0.35" />
          <circle cx="76" cy="24" r="5" fill="#ff3b7b" opacity="0.5" />
        </svg>
      </div>
      <span className="insights-film-frame-date font-mono">{date}</span>
      <p className="insights-film-frame-note font-hand">{note}</p>
    </button>
  );
}

function InsightsFilmLeader({ activeIndex, total }: { activeIndex: number; total: number }) {
  return (
    <svg viewBox="0 0 360 56" className="insights-film-leader-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="356" height="44" rx="8" fill="#1a1a24" stroke="#1a1a24" strokeWidth="2" />
      <rect x="10" y="14" width="48" height="28" rx="4" fill="#2a2838" stroke="#f5e642" strokeWidth="1.5" />
      <circle cx="34" cy="28" r="10" fill="none" stroke="#f5e642" strokeWidth="2" />
      <circle cx="34" cy="28" r="3" fill="#f5e642" />
      <text x="72" y="26" fill="#f5e642" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2">
        STORY REEL · 35MM
      </text>
      <text x="72" y="42" fill="#fdfcf9" fontFamily="JetBrains Mono, monospace" fontSize="8" opacity="0.7">
        FRAME {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </text>
      <rect x="268" y="18" width="80" height="20" rx="4" fill="#ff3b7b" opacity="0.9" />
      <text x="308" y="32" textAnchor="middle" fill="#fdfcf9" fontFamily="Archivo Black, sans-serif" fontSize="8">
        MNEMO
      </text>
    </svg>
  );
}

function InsightsFilmPerforations({ side }: { side: "top" | "bottom" }) {
  const holes = Array.from({ length: 18 });
  return (
    <svg
      viewBox="0 0 360 14"
      className={["insights-film-perf", side === "bottom" ? "insights-film-perf-bottom" : ""].join(" ")}
      aria-hidden
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="360" height="14" fill="#1a1a24" />
      {holes.map((_, i) => (
        <rect
          key={i}
          x={8 + i * 19}
          y={side === "top" ? 3 : 3}
          width="10"
          height="8"
          rx="1.5"
          fill="#f7f4ed"
        />
      ))}
    </svg>
  );
}
