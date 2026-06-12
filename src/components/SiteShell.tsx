import { Link, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Bug, ClipboardPaste, Flame, Sparkles, UserCircle, Users, Zap } from "lucide-react";
import { HeaderUserChip } from "@/components/HeaderUserChip";
import { FeatureBetaBadge } from "@/components/FeatureBetaBadge";
import { BRAND_FULL, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { isEmbedMode } from "@/lib/embedMode";
import { NAV_BETA_FEATURES } from "@/lib/launchGate";
import { DEV_MOCK_AUTH_ENABLED } from "@/lib/devMockAuth";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Zap;
  exact?: boolean;
};

/** Full sitemap — footer & deep links */
export const siteNavItems: NavItem[] = [
  { to: "/", label: "Home", icon: Zap, exact: true },
  { to: "/games/bug-forest", label: "Bug Forest", icon: Bug },
  { to: "/games/ai-create", label: "AI Create", icon: Sparkles },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/twin", label: "Twin", icon: UserCircle },
  { to: "/play", label: "Paste post", icon: ClipboardPaste },
  { to: "/trends", label: "Viral lab", icon: Flame },
  { to: "/games/join", label: "Join", icon: Users },
];

/** Slim header — primary journey: create → paste → journal */
const headerNavItems: NavItem[] = [
  { to: "/games/ai-create", label: "Create", icon: Sparkles },
  { to: "/trends", label: "Trends", icon: Flame },
  { to: "/play", label: "Paste post", icon: ClipboardPaste },
  { to: "/journal", label: "Journal", icon: BookOpen },
];

function MarqueeTicker() {
  const items = [
    `★ ${BRAND_FULL}`,
    "✷ AI-NATIVE · INTERACTIVE",
    "❖ INTERACTIVE SOCIAL",
    "✦ DRAFTS AUTO-SAVED LOCALLY",
    "✸ ONE-TAP PLAYABLE GAMES",
    "◈ MNEMO 2025",
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

function navActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function SiteShell() {
  const { pathname, search } = useLocation();
  const { user } = useAuth();

  if (isEmbedMode(search)) {
    return (
      <div className="min-h-[100dvh] bg-black text-foreground">
        <Outlet />
      </div>
    );
  }

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
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2 group">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-pink font-display text-sm text-background shadow-pop-sm transition-transform group-hover:rotate-[-8deg]"
              aria-hidden
            >
              M
            </span>
            <span className="font-display text-lg tracking-tight text-riso-pink">{BRAND_NAME}</span>
          </Link>

          <nav className="hidden sm:flex flex-1 items-center justify-center gap-0.5">
            {headerNavItems.map(({ to, label, exact }) => {
              const isActive = navActive(pathname, to, exact);
              const betaFeature = NAV_BETA_FEATURES[to];
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "px-3 py-1 text-sm font-display uppercase tracking-wide rounded-full transition-colors inline-flex items-center gap-1",
                    isActive
                      ? "text-riso-ink bg-riso-yellow shadow-pop-sm"
                      : "text-muted-foreground hover:text-riso-ink hover:bg-riso-yellow/40",
                  ].join(" ")}
                >
                  {label}
                  {betaFeature && <FeatureBetaBadge feature={betaFeature} />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {DEV_MOCK_AUTH_ENABLED && (
              <span
                className="hidden sm:inline font-mono text-[9px] uppercase tracking-widest text-riso-violet bg-riso-violet/10 border border-riso-violet/30 rounded-full px-2 py-0.5"
                title="VITE_DEV_MOCK_AUTH=true — UI preview only"
              >
                Demo login
              </span>
            )}
            {user ? (
              <HeaderUserChip user={user} />
            ) : (
              <Link
                to="/login"
                className="px-2.5 py-1 text-xs font-display uppercase tracking-wide text-muted-foreground hover:text-riso-ink"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <MarqueeTicker />

      <main className="relative z-10 flex flex-1 flex-col min-h-0">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-16 border-t border-riso-cyan/25 bg-[oklch(0.08_0.02_270)] text-background">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-riso-cyan/40 bg-riso-pink/90 font-tech text-xs">
                M
              </span>
              <div>
                <span className="font-tech text-sm text-white">{BRAND_NAME}</span>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-riso-cyan/80 mt-0.5">
                  AI-native social
                </p>
              </div>
            </div>
            <p className="font-mono text-xs text-background/65 leading-relaxed max-w-sm">
              {BRAND_TAGLINE}. Turn travel moments and social posts into playable, shareable memories.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-riso-cyan mb-4">
              Navigate
            </p>
            <ul className="space-y-2.5 font-mono text-sm">
              {siteNavItems.map(({ to, label }) => {
                const betaFeature = NAV_BETA_FEATURES[to];
                return (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-background/75 hover:text-riso-cyan transition-colors inline-flex items-center gap-2"
                  >
                    <span className="text-riso-cyan/50">→</span>
                    {label}
                    {betaFeature && <FeatureBetaBadge feature={betaFeature} />}
                  </Link>
                </li>
                );
              })}
              {user && (
                <li>
                  <Link
                    to="/profile"
                    className="text-background/75 hover:text-riso-cyan transition-colors inline-flex items-center gap-2"
                  >
                    <span className="text-riso-cyan/50">→</span>
                    Profile
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-riso-cyan mb-4">
              System
            </p>
            <p className="font-mono text-xs text-background/65 leading-relaxed">
              Orbitron · Exo 2 · JetBrains Mono
              <br />
              Riso palette · grain texture
              <br />
              © 2026 {BRAND_NAME}
            </p>
          </div>
        </div>
        <div className="border-t border-white/8 py-3.5 text-center font-mono text-[9px] uppercase tracking-[0.32em] text-background/45">
          Mnemo Press · memory → playable content
        </div>
      </footer>
    </div>
  );
}
