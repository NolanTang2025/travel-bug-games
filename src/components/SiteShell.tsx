import { Link, Outlet, useLocation } from "react-router-dom";
import { Bug, BookOpen, Sparkles, Users, Zap } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Zap;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: Zap, exact: true },
  { to: "/games/bug-forest", label: "Bug Forest", icon: Bug },
  { to: "/games/ai-create", label: "AI Create", icon: Sparkles },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/games/join", label: "Join", icon: Users },
];

function MarqueeTicker() {
  const items = [
    "★ TRAVEL BUG GAMES",
    "✷ CATCH · DODGE · REMEMBER",
    "❖ RISO PRESS EDITION",
    "✦ PLAY ANYWHERE",
    "✸ POCKET ARCADE",
    "◈ EST. 2025",
  ];
  const row = [...items, ...items, ...items];
  return (
    <div className="border-y-2 border-riso-ink bg-riso-ink text-background overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {row.map((t, i) => (
          <span
            key={i}
            className="px-6 font-display text-sm uppercase tracking-[0.25em]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SiteShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-foreground relative">
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.25] mix-blend-multiply"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.15  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <header className="relative z-20 border-b-2 border-riso-ink bg-background">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-pink text-background shadow-pop-sm transition-transform group-hover:rotate-[-8deg]"
              aria-hidden
            >
              <Bug className="h-4.5 w-4.5" strokeWidth={2.8} />
            </span>
            <span className="font-display text-base sm:text-lg tracking-tight">
              TRAVEL<span className="text-riso-pink">BUG</span>
              <span className="text-muted-foreground">.games</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, exact }) => {
              const isActive = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "relative px-3 py-1.5 text-sm font-semibold tracking-tight transition-colors",
                    "font-display uppercase",
                    isActive
                      ? "text-riso-ink"
                      : "text-muted-foreground hover:text-riso-ink",
                  ].join(" ")}
                >
                  {label}
                  {isActive && (
                    <span
                      className="absolute left-2 right-2 -bottom-0.5 h-[3px] bg-riso-pink"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            to="/games/ai-create"
            className="sticker hidden sm:inline-flex items-center gap-2 rounded-full bg-riso-yellow px-4 py-2 text-sm font-display uppercase tracking-wide"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.6} />
            Make a game
          </Link>
        </div>

        <nav className="md:hidden flex border-t-2 border-riso-ink bg-background overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "flex-1 min-w-fit px-3 py-2 text-center text-[11px] font-display uppercase tracking-wider border-r-2 last:border-r-0 border-riso-ink/20 flex flex-col items-center gap-0.5",
                  isActive ? "bg-riso-yellow text-riso-ink" : "text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" strokeWidth={2.4} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <MarqueeTicker />

      <main className="relative z-10 flex flex-1 flex-col min-h-0">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t-2 border-riso-ink bg-riso-ink text-background mt-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-riso-pink">
                <Bug className="h-4 w-4" strokeWidth={2.8} />
              </span>
              <span className="font-display text-lg">TRAVELBUG.games</span>
            </div>
            <p className="font-mono text-xs text-background/70 leading-relaxed">
              Pocket-sized games, risograph-printed travel journals, and tiny
              worlds you build with AI. Est. somewhere on the road.
            </p>
          </div>
          <div>
            <p className="font-display uppercase text-xs tracking-[0.25em] text-riso-yellow mb-3">
              Sections
            </p>
            <ul className="space-y-2 font-mono text-sm">
              {navItems.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-background/80 hover:text-riso-pink transition-colors"
                  >
                    → {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-display uppercase text-xs tracking-[0.25em] text-riso-yellow mb-3">
              Colophon
            </p>
            <p className="font-mono text-xs text-background/70 leading-relaxed">
              Set in Archivo Black &amp; Space Grotesk.
              <br />
              Printed with pink, cyan &amp; yellow inks.
              <br />
              © 2025 Travel Bug Games.
            </p>
          </div>
        </div>
        <div className="border-t-2 border-background/10 py-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-background/50">
          ▚ made with grain &amp; glue ▚
        </div>
      </footer>
    </div>
  );
}
