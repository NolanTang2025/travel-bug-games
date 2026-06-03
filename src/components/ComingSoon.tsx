import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Tone = "pink" | "yellow" | "cyan" | "violet" | "lime";

const toneStyles: Record<Tone, { bg: string; ink: string }> = {
  pink: { bg: "bg-riso-pink", ink: "text-background" },
  yellow: { bg: "bg-riso-yellow", ink: "text-riso-ink" },
  cyan: { bg: "bg-riso-cyan", ink: "text-riso-ink" },
  violet: { bg: "bg-riso-violet", ink: "text-background" },
  lime: { bg: "bg-riso-lime", ink: "text-riso-ink" },
};

export function ComingSoon({
  eyebrow,
  title,
  tag,
  blurb,
  tone = "pink",
}: {
  eyebrow: string;
  title: string;
  tag: string;
  blurb: string;
  tone?: Tone;
}) {
  const t = toneStyles[tone];
  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            ▚ {eyebrow} ▚
          </p>
          <h1 className="font-display text-[clamp(3rem,9vw,6rem)] leading-[0.88] tracking-tight text-riso-ink">
            {title.split(" ").map((w, i) => (
              <span
                key={i}
                className={i % 2 ? "text-riso-pink" : "text-riso-ink"}
              >
                {w}{" "}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl font-mono text-base sm:text-lg text-foreground/75 leading-relaxed">
            {blurb}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="sticker-sm inline-flex items-center gap-2 rounded-full bg-riso-yellow px-4 py-1.5 font-display uppercase text-[11px] tracking-[0.25em] text-riso-ink">
              ● Printing soon
            </span>
            <span className="sticker-sm inline-flex items-center gap-2 rounded-full bg-background px-4 py-1.5 font-display uppercase text-[11px] tracking-[0.25em] text-riso-ink">
              {tag}
            </span>
          </div>

          <div className="mt-10">
            <Link
              to="/"
              className="sticker inline-flex items-center gap-2 rounded-full bg-riso-ink text-background px-6 py-3 font-display uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            className={`sticker ${t.bg} ${t.ink} rounded-3xl aspect-[4/5] p-8 rotate-2 flex flex-col justify-between relative overflow-hidden`}
          >
            <div
              className="absolute -top-10 -right-10 h-52 w-52 opacity-40 pointer-events-none texture-halftone rounded-full"
              aria-hidden
            />
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-70">
                Proof · Vol. 01
              </p>
              <p className="font-display text-6xl mt-2 leading-none">
                {title.split(" ")[0]}
              </p>
            </div>
            <div className="relative">
              <p className="font-hand text-4xl leading-none">
                coming soon ✦
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] opacity-80">
                Travel Bug Press · Riso Edition
              </p>
            </div>
          </div>
          <span className="absolute -left-3 -bottom-3 sticker-sm bg-riso-ink text-background font-display uppercase text-xs tracking-[0.3em] px-3 py-1.5 rounded-full rotate--6">
            In the press
          </span>
        </div>
      </div>
    </section>
  );
}
