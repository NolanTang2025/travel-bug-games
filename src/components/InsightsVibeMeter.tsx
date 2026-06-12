import { useId, type CSSProperties } from "react";

const VIBE_ACCENTS = ["#f5e642", "#5ec8e8", "#ff3b7b", "#7b5cff", "#b8e986", "#f5e642"];

type Props = {
  moods: string[];
  activeIndex: number;
  spinning: boolean;
  onSelect: (index: number) => void;
  onPull: () => void;
};

export function InsightsVibeMeter({ moods, activeIndex, spinning, onSelect, onPull }: Props) {
  const halftoneId = useId();
  const accent = VIBE_ACCENTS[activeIndex % VIBE_ACCENTS.length];
  const needleAngle = moods.length > 1 ? -68 + (activeIndex / (moods.length - 1)) * 136 : 0;

  return (
    <div className="insights-vibe-deck">
      <InsightsVibeLeader activeIndex={activeIndex} total={moods.length} accent={accent} />

      <div className="insights-vibe-machine">
        <div className="insights-vibe-gauge-wrap">
          <div
            className={[
              "insights-vibe-bezel",
              spinning ? "insights-vibe-bezel-spin" : "",
            ].join(" ")}
            style={{ "--vibe-accent": accent } as CSSProperties}
          >
            <svg viewBox="0 0 300 168" className="insights-vibe-dial-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={halftoneId} width="5" height="5" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#1a1a24" opacity="0.07" />
                </pattern>
                <linearGradient id="vibe-glass" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fdfcf9" />
                  <stop offset="100%" stopColor="#f0ece3" />
                </linearGradient>
              </defs>

              <rect x="6" y="8" width="288" height="152" rx="16" fill="url(#vibe-glass)" stroke="#1a1a24" strokeWidth="2.5" />
              <rect x="6" y="8" width="288" height="152" rx="16" fill={`url(#${halftoneId})`} />

              <rect x="22" y="24" width="256" height="112" rx="10" fill="#1a1a24" fillOpacity="0.04" stroke="#1a1a24" strokeWidth="1" strokeOpacity="0.12" />

              <path
                d="M52 132 A98 98 0 0 1 248 132"
                fill="none"
                stroke="#1a1a24"
                strokeWidth="2.5"
                opacity="0.18"
              />
              <path
                d="M58 132 A92 92 0 0 1 242 132"
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                opacity="0.35"
                strokeDasharray="3 5"
              />

              {moods.map((_, i) => {
                const a = (-68 + (i / Math.max(moods.length - 1, 1)) * 136) * (Math.PI / 180);
                const x = 150 + Math.cos(a - Math.PI / 2) * 82;
                const y = 132 + Math.sin(a - Math.PI / 2) * 82;
                const on = i === activeIndex;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={on ? 6 : 4} fill={on ? accent : "#1a1a24"} opacity={on ? 1 : 0.2} />
                    <text
                      x={x}
                      y={y + 18}
                      textAnchor="middle"
                      fill="#1a1a24"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="7"
                      opacity={on ? 0.85 : 0.35}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}

              <g
                className={spinning ? "insights-vibe-needle-spin" : ""}
                transform={spinning ? undefined : `rotate(${needleAngle} 150 132)`}
              >
                <line x1="152" y1="132" x2="148" y2="132" stroke="#5ec8e8" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
                <line x1="150" y1="132" x2="150" y2="54" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
                <line x1="148" y1="132" x2="152" y2="54" stroke="#ff3b7b" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
                <circle cx="150" cy="132" r="10" fill="#1a1a24" stroke={accent} strokeWidth="2.5" />
                <circle cx="150" cy="132" r="3.5" fill="#fdfcf9" />
              </g>

              <ellipse cx="150" cy="140" rx="44" ry="8" fill={accent} opacity="0.12" />
            </svg>
          </div>

          <div
            className={[
              "insights-vibe-readout-card",
              spinning ? "insights-vibe-readout-pulse" : "",
            ].join(" ")}
            style={{ "--vibe-accent": accent } as CSSProperties}
          >
            <p className="insights-vibe-readout-label font-mono">Tonight&apos;s vibe</p>
            <p className="insights-vibe-word font-hand">{moods[activeIndex]}</p>
            <p className="insights-vibe-readout-meta font-mono">
              Needle at #{String(activeIndex + 1).padStart(2, "0")}
            </p>
          </div>
        </div>

        <InsightsVibeLever spinning={spinning} onPull={onPull} />
      </div>

      <div className="insights-mood-row">
        {moods.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(i)}
            className={[
              "insights-mood-chip",
              i === activeIndex ? "insights-mood-chip-active" : "",
            ].join(" ")}
            style={
              i === activeIndex
                ? ({ "--vibe-accent": VIBE_ACCENTS[i % VIBE_ACCENTS.length] } as CSSProperties)
                : undefined
            }
          >
            <span className="insights-mood-chip-num font-mono">{String(i + 1).padStart(2, "0")}</span>
            <span className="insights-mood-chip-dot" aria-hidden />
            <span className="insights-mood-chip-text font-hand">{m}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function InsightsVibeLeader({
  activeIndex,
  total,
  accent,
}: {
  activeIndex: number;
  total: number;
  accent: string;
}) {
  return (
    <svg viewBox="0 0 360 56" className="insights-vibe-leader-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="356" height="48" rx="8" fill="#fdfcf9" stroke="#1a1a24" strokeWidth="2" />
      <rect x="12" y="14" width="40" height="28" rx="5" fill={accent} stroke="#1a1a24" strokeWidth="1.5" />
      <path d="M22 28 L32 20 L42 28 L32 36 Z" fill="#1a1a24" opacity="0.6" />
      <text x="62" y="24" fill="#1a1a24" fontFamily="Archivo Black, sans-serif" fontSize="10" letterSpacing="0.5">
        VIBE CHECK
      </text>
      <text x="62" y="40" fill="#5ec8e8" fontFamily="JetBrains Mono, monospace" fontSize="7.5" letterSpacing="2">
        VIBE METER · MNEMO
      </text>
      <rect x="268" y="16" width="76" height="24" rx="12" fill="#f5e642" stroke="#1a1a24" strokeWidth="1.5" />
      <text x="306" y="32" textAnchor="middle" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="9">
        {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </text>
    </svg>
  );
}

function InsightsVibeLever({ spinning, onPull }: { spinning: boolean; onPull: () => void }) {
  return (
    <div className="insights-vibe-lever-col">
      <button
        type="button"
        onClick={onPull}
        disabled={spinning}
        className="insights-vibe-lever-btn"
        aria-label={spinning ? "Spinning" : "Pull lever"}
      >
        <svg
          viewBox="0 0 100 128"
          className={["insights-vibe-lever-svg", spinning ? "insights-vibe-lever-pull" : ""].join(" ")}
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="4" width="84" height="118" rx="12" fill="#fdfcf9" stroke="#1a1a24" strokeWidth="2" />
          <rect x="34" y="14" width="32" height="52" rx="6" fill="#1a1a24" />
          <rect x="38" y="20" width="24" height="16" rx="3" fill="#ff3b7b" />
          <rect x="40" y="72" width="20" height="36" rx="5" fill="#f5e642" stroke="#1a1a24" strokeWidth="2" />
          <ellipse cx="50" cy="114" rx="22" ry="3" fill="#1a1a24" opacity="0.12" />
        </svg>
      </button>
      <span className="insights-vibe-lever-label font-display">
        {spinning ? "Spinning…" : "Pull lever"}
      </span>
    </div>
  );
}
