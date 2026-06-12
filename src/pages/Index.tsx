import { Link } from "react-router-dom";
import {
  Bug,
  Sparkles,
  BookOpen,
  Users,
  ArrowRight,
  Disc3,
  Zap,
  Star,
  MapPin,
  UserCircle,
  ClipboardPaste,
  Flame,
} from "lucide-react";
import { BUNDLED_MANIFEST, featuredMemeTrends } from "@/data/memeTrends";
import { PRINT_EDITIONS } from "@/data/printEditions";
import { UgcShowcase } from "@/components/UgcShowcase";
import { FeatureBetaBadge } from "@/components/FeatureBetaBadge";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { MODE_BETA_FEATURES } from "@/lib/launchGate";

function SpotSticker({
  label,
  tone,
  rotate = "rotate--3",
}: {
  label: string;
  tone: "pink" | "yellow" | "cyan" | "violet" | "lime";
  rotate?: string;
}) {
  const bg = {
    pink: "bg-riso-pink text-background",
    yellow: "bg-riso-yellow text-riso-ink",
    cyan: "bg-riso-cyan text-riso-ink",
    violet: "bg-riso-violet text-background",
    lime: "bg-riso-lime text-riso-ink",
  }[tone];
  return (
    <span
      className={`sticker-sm inline-block px-3 py-1 rounded-full font-display uppercase text-[11px] tracking-[0.2em] ${bg} ${rotate}`}
    >
      {label}
    </span>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16">
      <div className="absolute left-4 top-6 hidden sm:block animate-wobble">
        <SpotSticker label="New Drop" tone="yellow" rotate="rotate--2" />
      </div>
      <div className="absolute right-6 top-14 hidden sm:block animate-wobble" style={{ animationDelay: "0.8s" }}>
        <SpotSticker label="Riso Press" tone="cyan" rotate="rotate-2" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-5">
            <span className="inline-block h-2 w-2 rounded-full bg-riso-pink" />
            {BRAND_TAGLINE}
          </div>

          <h1 className="font-display leading-[0.88] tracking-tight text-riso-ink">
            <span className="block text-[clamp(3rem,10vw,7rem)] text-chroma-lg">
              {BRAND_NAME}
            </span>
            <span className="block text-[clamp(1.25rem,4vw,2rem)] -mt-1 font-mono normal-case tracking-tight text-foreground/80">
              Interactive <span className="text-riso-pink">AI-native</span> social network
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg sm:text-xl font-mono text-foreground/75 leading-relaxed">
            Turn <span className="bg-riso-yellow px-1.5 -skew-x-3 inline-block">social posts</span>,{" "}
            <span className="bg-riso-pink text-background px-1.5 -skew-x-3 inline-block">travel photos</span>,
            and journal notes into playable, saveable AI memories.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/games/ai-create"
              className="sticker group inline-flex items-center gap-2 rounded-full bg-riso-pink px-7 py-4 text-background font-display uppercase tracking-wider text-base"
            >
              <Sparkles className="h-5 w-5" strokeWidth={2.6} />
              Make a game
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/play"
              className="sticker inline-flex items-center gap-2 rounded-full bg-riso-cyan px-6 py-4 text-riso-ink font-display uppercase tracking-wider text-base"
            >
              <ClipboardPaste className="h-5 w-5" strokeWidth={2.6} />
              Paste a post
            </Link>
            <Link
              to="/journal"
              className="sticker inline-flex items-center gap-2 rounded-full bg-background px-6 py-4 text-riso-ink font-display uppercase tracking-wider text-sm"
            >
              <BookOpen className="h-4 w-4" strokeWidth={2.6} />
              Journal
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-riso-pink" fill="currentColor" />
              5 tiny games
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-riso-cyan" />
              Works offline
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-riso-violet" />
              60fps vibes
            </span>
          </div>
        </div>

        <div className="relative min-h-[460px] sm:min-h-[520px]">
          <div className="absolute right-4 top-4 w-[68%] aspect-square">
            <div className="relative w-full h-full animate-spin-slow">
              <div className="absolute inset-0 rounded-full bg-gradient-ultraviolet sticker" />
              <div className="absolute inset-[6%] rounded-full border-2 border-riso-ink opacity-40" />
              <div className="absolute inset-[14%] rounded-full border-2 border-riso-ink opacity-30" />
              <div className="absolute inset-[22%] rounded-full bg-riso-pink border-2 border-riso-ink flex items-center justify-center">
                <Disc3 className="h-14 w-14 text-background" strokeWidth={2} />
              </div>
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-riso-ink" />
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "conic-gradient(from 45deg, transparent 0deg, oklch(1 0 0 / 0.35) 30deg, transparent 70deg, transparent 200deg, oklch(1 0 0 / 0.18) 230deg, transparent 270deg)",
                  mixBlendMode: "screen",
                }}
              />
            </div>
          </div>

          <div className="absolute left-0 top-8 sticker bg-riso-yellow rotate--3 px-5 py-4 max-w-[210px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-riso-ink/70">
              Admit one
            </p>
            <p className="font-display text-2xl text-riso-ink leading-none mt-1">
              BUG.FOREST
            </p>
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase text-riso-ink">
              <span>★ 01</span>
              <span className="texture-stripes h-2 flex-1 mx-2 opacity-40" />
              <span>★ 01</span>
            </div>
          </div>

          <div className="absolute left-2 bottom-4 sticker bg-background rotate-3 p-2 pb-5 w-[180px]">
            <div className="aspect-square bg-gradient-peach border-2 border-riso-ink flex items-center justify-center">
              <Bug className="h-20 w-20 text-riso-ink" strokeWidth={2.2} />
            </div>
            <p className="font-hand text-xl text-riso-ink text-center mt-2 leading-none">
              caught one!
            </p>
          </div>

          <div className="absolute right-2 bottom-6 animate-wobble">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div
                className="absolute inset-0 bg-riso-lime sticker rotate-12"
                style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}
              />
              <span className="relative font-display text-xs uppercase tracking-wider text-riso-ink text-center leading-tight">
                Play<br/>Anywhere
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Mode = {
  title: string;
  tag: string;
  desc: string;
  to: string;
  icon: typeof Zap;
  bg: string;
  ink: string;
  rotate: string;
};

const primaryModes: Mode[] = [
  {
    title: "AI Create",
    tag: "start here",
    desc: "Paste travel photos + a note. Get a playable mini game in seconds — saved to your Journal.",
    to: "/games/ai-create",
    icon: Sparkles,
    bg: "bg-riso-pink",
    ink: "text-background",
    rotate: "rotate-1",
  },
  {
    title: "Paste a post",
    tag: "instagram · beta",
    desc: "Drop an Instagram or RedNote link — post → game is in private beta; results may be incomplete.",
    to: "/play",
    icon: ClipboardPaste,
    bg: "bg-riso-cyan",
    ink: "text-riso-ink",
    rotate: "rotate--1",
  },
  {
    title: "Travel Journal",
    tag: "book · memory",
    desc: "Your trips live here. Remix games, finish AI summaries, copy captions for Story.",
    to: "/journal",
    icon: BookOpen,
    bg: "bg-riso-yellow",
    ink: "text-riso-ink",
    rotate: "rotate-2",
  },
];

const moreModes: Mode[] = [
  {
    title: "Twin",
    tag: "discord · beta",
    desc: "AI travel twin drafts replies in your voice — Discord connect is in private beta.",
    to: "/twin",
    icon: UserCircle,
    bg: "bg-riso-violet",
    ink: "text-background",
    rotate: "rotate--2",
  },
  {
    title: "Join with code",
    tag: "multiplayer",
    desc: "Friend sent a room code? Jump into their session — sign in to host your own.",
    to: "/games/join",
    icon: Users,
    bg: "bg-background",
    ink: "text-riso-ink",
    rotate: "rotate-1",
  },
];

function ViralTrendsBand() {
  const featured = featuredMemeTrends(BUNDLED_MANIFEST, 3);
  return (
    <section className="relative border-y-2 border-riso-ink bg-riso-ink text-background overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, var(--riso-pink), transparent 70%)" }}
        />
        <div
          className="absolute -left-16 bottom-0 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, var(--riso-cyan), transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-riso-yellow mb-3 flex items-center gap-2 flex-wrap">
              <Flame className="h-3.5 w-3.5" />
              <span>▚ Section 02 · Viral Lab ▚</span>
              <FeatureBetaBadge feature="trendRemixToGame" />
            </p>
            <h2 className="font-display text-4xl sm:text-6xl leading-[0.92] tracking-tight">
              Ride the <span className="text-riso-pink">meme</span>,
              <br />
              press <span className="text-riso-cyan">your story</span>.
            </h2>
            <p className="mt-5 max-w-lg font-mono text-sm text-background/75 leading-relaxed">
              Six Seven, fox-on-the-mountain, love-your-older-self — pick what&apos;s trending, drop what
              actually happened to you. One press → playable clip + caption ready to post this week.
            </p>
            <Link
              to="/trends"
              className="sticker mt-8 inline-flex items-center gap-2 rounded-full bg-riso-pink px-7 py-4 font-display uppercase tracking-wider text-background group"
            >
              Open viral lab
              <FeatureBetaBadge feature="trendRemixToGame" />
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {featured.map((t, i) => (
              <Link
                key={t.id}
                to={`/trends?trend=${t.id}`}
                className={[
                  "sticker-sm rounded-2xl border-2 border-background/25 p-4 bg-background/10 backdrop-blur-sm",
                  "hover:bg-background/20 transition-colors group",
                  i % 2 ? "rotate-1" : "rotate--1",
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <p className="mt-2 font-display text-lg uppercase leading-tight text-background group-hover:text-riso-yellow transition-colors">
                  {t.title}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-background/55">
                  {t.platforms[0]}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Modes() {
  return (
    <section className="relative border-b-2 border-riso-ink bg-riso-yellow/30">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
              ▚ Section 03 ▚
            </p>
            <h2 className="font-display text-5xl sm:text-6xl tracking-tight">
              Pick a <span className="text-riso-pink">zine</span>,
              <br className="sm:hidden" /> press <span className="bg-riso-ink text-background px-2">PLAY</span>.
            </h2>
          </div>
          <p className="font-mono text-sm text-muted-foreground max-w-sm">
            Every mode is a tiny, self-contained thing. Finish one in the time it takes to wait for coffee.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {primaryModes.map((m) => {
            const Icon = m.icon;
            const betaFeature = MODE_BETA_FEATURES[m.to];
            return (
              <Link
                key={m.to}
                to={m.to}
                className={`sticker ${m.bg} ${m.ink} ${m.rotate} rounded-2xl p-6 flex flex-col min-h-[240px] group`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-riso-ink bg-background/90 text-riso-ink">
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
                    {m.tag}
                  </span>
                </div>
                <h3 className="mt-auto font-display text-3xl leading-none flex items-center gap-2 flex-wrap">
                  {m.title}
                  {betaFeature && <FeatureBetaBadge feature={betaFeature} />}
                </h3>
                <p className="mt-2 font-mono text-sm leading-snug opacity-85">
                  {m.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 font-display uppercase text-xs tracking-[0.2em]">
                  Enter
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          More ways to play
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {moreModes.map((m) => {
            const Icon = m.icon;
            const betaFeature = MODE_BETA_FEATURES[m.to];
            return (
              <Link
                key={m.to}
                to={m.to}
                className={`sticker-sm ${m.bg} ${m.ink} ${m.rotate} rounded-2xl border-2 border-riso-ink/15 p-5 flex gap-4 items-start group`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-riso-ink bg-background/90 text-riso-ink">
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <div className={`min-w-0 flex-1 ${m.ink}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">
                    {m.tag}
                  </p>
                  <h3 className="font-display text-xl leading-tight flex items-center gap-2 flex-wrap">
                    {m.title}
                    {betaFeature && <FeatureBetaBadge feature={betaFeature} />}
                  </h3>
                  <p className="mt-1 font-mono text-xs leading-snug opacity-90">{m.desc}</p>
                </div>
                <ArrowRight
                  className={`h-4 w-4 shrink-0 mt-1 opacity-80 ${m.ink} group-hover:translate-x-0.5 transition-transform`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PrintEditions() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
            ▚ Section 04 ▚
          </p>
          <h2 className="font-display text-5xl sm:text-6xl tracking-tight">
            Print <span className="text-riso-violet">editions</span>.
          </h2>
        </div>
        <p className="font-mono text-sm text-muted-foreground max-w-sm">
          A tiny library of ready-made games. Each one is a moment from somewhere real — play it, then read what someone wrote after.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PRINT_EDITIONS.map((it, i) => (
          <Link
            key={it.id}
            to={`/games/editions/${it.id}`}
            className={`sticker ${it.tone} rounded-2xl aspect-[3/4] p-0 flex flex-col overflow-hidden group ${i % 2 ? "rotate-1" : "rotate--1"}`}
          >
            <div className="relative flex-1 min-h-0">
              <img
                src={it.coverPhoto}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <img
                src={it.coverArt}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-hard-light pointer-events-none"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-riso-ink/85 via-riso-ink/25 to-transparent" />
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                <span className="font-display text-background text-5xl leading-none opacity-95 drop-shadow">
                  {it.n}
                </span>
                <span className="sticker-sm bg-background text-riso-ink font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full shrink-0">
                  {it.tag}
                </span>
              </div>
            </div>

            <div className="relative p-5 pt-3 bg-riso-ink/90 text-background">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/65 mb-1">
                {it.city} · {it.game.genre}
              </p>
              <p className="font-display text-2xl leading-tight group-hover:text-riso-yellow transition-colors">
                {it.title}
              </p>
              <p className="font-hand text-lg text-background/85 mt-2 leading-snug line-clamp-2">
                {it.teaser}
              </p>
              <div className="mt-4 flex items-center gap-1 font-display uppercase text-xs tracking-[0.2em] text-riso-yellow">
                Play & read journal
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-24">
        <div className="sticker relative overflow-hidden rounded-3xl bg-riso-ink text-background p-10 sm:p-14">
          <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
            <div className="texture-halftone absolute -top-10 -right-10 h-64 w-64 rounded-full text-riso-pink" style={{ color: "var(--riso-pink)" }} />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-riso-yellow mb-3">
                ▚ Final press ▚
              </p>
              <h2 className="font-display text-4xl sm:text-6xl leading-[0.95]">
                Your next trip <br />
                deserves a <span className="text-riso-pink">soundtrack</span>
                <br /> <span className="text-riso-cyan">and a scoreboard</span>.
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/games/ai-create"
                className="sticker bg-riso-pink text-background rounded-full px-7 py-4 text-center font-display uppercase tracking-wider"
              >
                Make my game →
              </Link>
              <Link
                to="/play"
                className="sticker bg-riso-cyan text-riso-ink rounded-full px-7 py-4 text-center font-display uppercase tracking-wider"
              >
                Paste a post →
              </Link>
              <Link
                to="/journal"
                className="sticker bg-riso-yellow text-riso-ink rounded-full px-7 py-4 text-center font-display uppercase tracking-wider"
              >
                Open journal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Index = () => (
  <>
    <Hero />
    <ViralTrendsBand />
    <Modes />
    <UgcShowcase />
    <PrintEditions />
    <CTABand />
  </>
);

export default Index;
