import { Link } from "react-router-dom";
import { BookOpen, RotateCcw } from "lucide-react";
import {
  buildJournalEntry,
  getPerformanceTier,
  TIER_LABELS,
  type PrintEdition,
} from "@/data/printEditions";

export function EditionJournal({
  edition,
  score,
  misses,
  onReplay,
}: {
  edition: PrintEdition;
  score: number;
  misses: number;
  onReplay: () => void;
}) {
  const tier = getPerformanceTier(score, misses, edition);
  const entry = buildJournalEntry(edition, score, misses);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-riso-ink/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="sticker w-full max-w-lg bg-background rotate--1 my-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="diary-paper relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6 pl-[52px]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                ▚ Found entry · Vol. {edition.n} ▚
              </p>
              <p className="font-hand text-2xl text-riso-ink mt-1">{edition.title}</p>
            </div>
            <span className="sticker-sm bg-riso-yellow px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-riso-ink rotate-2 shrink-0">
              {TIER_LABELS[tier]}
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 pl-[52px]">
            {edition.dateStamp} · {edition.city}
          </p>

          <div className="relative pl-[52px] pr-2">
            <p className="font-hand text-[1.35rem] sm:text-2xl leading-[28px] text-riso-ink whitespace-pre-wrap">
              {entry}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 pl-[52px]">
            <div className="flex gap-3">
              <div className="sticker-sm bg-riso-cyan/30 px-3 py-2 text-center rotate--2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-riso-ink/60">Score</p>
                <p className="font-display text-2xl text-riso-ink">{score}</p>
              </div>
              <div className="sticker-sm bg-riso-pink/20 px-3 py-2 text-center rotate-1">
                <p className="font-mono text-[9px] uppercase tracking-widest text-riso-ink/60">Missed</p>
                <p className="font-display text-2xl text-riso-ink">{misses}</p>
              </div>
            </div>
            <p className="font-hand text-lg text-riso-ink/50 rotate-3">— a traveler, probably you</p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 pl-[52px] pr-2">
            <button
              type="button"
              onClick={onReplay}
              className="sticker flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-riso-ink text-background px-5 py-3 font-display uppercase tracking-wider text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Play again
            </button>
            <Link
              to="/"
              className="sticker flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-riso-yellow text-riso-ink px-5 py-3 font-display uppercase tracking-wider text-sm text-center"
            >
              <BookOpen className="h-4 w-4" />
              More editions
            </Link>
          </div>

          <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            Travel Bug Press · Riso Edition · {edition.mood}
          </p>
        </div>
      </div>
    </div>
  );
}
