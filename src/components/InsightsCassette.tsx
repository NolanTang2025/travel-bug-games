type Props = {
  playing: boolean;
};

export function InsightsCassette({ playing }: Props) {
  return (
    <svg
      viewBox="0 0 320 168"
      className="insights-cassette-svg"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cassette-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2838" />
          <stop offset="55%" stopColor="#1a1a24" />
          <stop offset="100%" stopColor="#12121a" />
        </linearGradient>
        <linearGradient id="cassette-label" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f5e642" />
          <stop offset="100%" stopColor="#e8d836" />
        </linearGradient>
        <pattern id="cassette-grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#fff" opacity="0.06" />
          <circle cx="3" cy="3" r="0.5" fill="#fff" opacity="0.04" />
        </pattern>
      </defs>

      <rect x="4" y="8" width="312" height="152" rx="14" fill="url(#cassette-body)" stroke="#1a1a24" strokeWidth="3" />
      <rect x="4" y="8" width="312" height="152" rx="14" fill="url(#cassette-grain)" />

      <rect x="20" y="22" width="280" height="36" rx="6" fill="url(#cassette-label)" stroke="#1a1a24" strokeWidth="2" />
      <text x="160" y="46" textAnchor="middle" fill="#1a1a24" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="3">
        MNEMO FIELD NOTES · SIDE A
      </text>

      <rect x="36" y="72" width="248" height="56" rx="8" fill="#0e0e14" stroke="#1a1a24" strokeWidth="2" />

      <g className={playing ? "insights-cassette-reel-group insights-cassette-reel-spin" : "insights-cassette-reel-group"}>
        <circle cx="96" cy="100" r="22" fill="#1a1a24" stroke="#f5e642" strokeWidth="3" />
        <circle cx="96" cy="100" r="8" fill="#f5e642" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="96"
            y1="100"
            x2="96"
            y2="82"
            stroke="#5ec8e8"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${deg} 96 100)`}
          />
        ))}
      </g>

      <g
        className={
          playing
            ? "insights-cassette-reel-group insights-cassette-reel-spin-reverse"
            : "insights-cassette-reel-group"
        }
      >
        <circle cx="224" cy="100" r="22" fill="#1a1a24" stroke="#f5e642" strokeWidth="3" />
        <circle cx="224" cy="100" r="8" fill="#f5e642" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="224"
            y1="100"
            x2="224"
            y2="82"
            stroke="#ff3b7b"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${deg} 224 100)`}
          />
        ))}
      </g>

      <rect x="118" y="88" width="84" height="24" rx="4" fill="#1a1a24" opacity="0.85" />
      <rect x="124" y="94" width="72" height="12" rx="2" fill="#2a2838" stroke="#5ec8e8" strokeWidth="1" opacity="0.9" />

      <rect x="28" y="138" width="264" height="10" rx="3" fill="#1a1a24" opacity="0.5" />
      <circle cx="48" cy="143" r="3" fill="#f5e642" />
      <circle cx="272" cy="143" r="3" fill="#f5e642" />
    </svg>
  );
}
