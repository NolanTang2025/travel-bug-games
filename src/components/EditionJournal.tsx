import { Link } from "react-router-dom";
import { BookOpen, MapPin, RotateCcw } from "lucide-react";
import {
  buildGameFootnote,
  getCommunityPost,
  TIER_LABELS_COMMUNITY,
} from "@/data/communityPosts";
import { getPerformanceTier, type PrintEdition } from "@/data/printEditions";

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
  const post = getCommunityPost(edition.id);
  const gameNote = post ? buildGameFootnote(post, tier, score, misses) : null;

  if (!post) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-riso-ink/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
      <div className="sticker w-full max-w-lg bg-background rotate--1 my-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="diary-paper-plain relative px-5 py-7 sm:px-8 sm:py-9">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground mb-4">
            ▚ Community journal · Vol. {edition.n} · after your run ▚
          </p>

          {/* Author row — feels like a real upload */}
          <div className="flex items-start gap-3 mb-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-cyan/30 font-display text-sm text-riso-ink">
              {post.author.avatarInitials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-base text-riso-ink">{post.author.name}</p>
                <span className="sticker-sm bg-riso-yellow/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-riso-ink">
                  {TIER_LABELS_COMMUNITY[tier]}
                </span>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{post.author.handle}</p>
              <p className="font-mono text-[10px] text-muted-foreground/80 mt-0.5">
                {post.author.from} · {post.postedAt}
              </p>
            </div>
          </div>

          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-riso-ink/70 mb-4">
            <MapPin className="h-3 w-3 shrink-0" />
            {post.visited}
          </p>

          {/* User photos — flat upload style, not stock polaroids */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {post.photos.map((photo) => (
              <figure
                key={photo.src}
                className="overflow-hidden rounded-md border border-riso-ink/20 bg-muted/30"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.label}
                    className="journal-upload-photo h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="px-2 py-2 bg-background/90 border-t border-riso-ink/10">
                  <p className="font-mono text-[9px] text-riso-ink/85 leading-snug">{photo.label}</p>
                  <p className="font-mono text-[8px] text-muted-foreground mt-0.5">{photo.credit}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Trip write-up — plain readable text, not poetic */}
          <div className="rounded-lg border-2 border-riso-ink/15 bg-background/80 px-4 py-4 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Trip notes
            </p>
            <p className="font-mono text-sm sm:text-[15px] leading-relaxed text-riso-ink whitespace-pre-wrap">
              {post.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-riso-lime/40 px-2 py-0.5 font-mono text-[10px] text-riso-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Your game result + their footnote */}
          {gameNote && (
            <div className="sticker-sm bg-riso-pink/15 border-riso-pink/40 px-4 py-3 mb-6 rotate-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-riso-ink/60 mb-1">
                Your run just now
              </p>
              <p className="font-mono text-sm text-riso-ink leading-snug">{gameNote}</p>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
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
            <p className="font-mono text-[9px] text-muted-foreground max-w-[140px] text-right leading-snug">
              Uploaded before you played · matched by city
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onReplay}
              className="sticker flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-riso-ink text-background px-5 py-3 font-display uppercase tracking-wider text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Play again
            </button>
            <Link
              to={`/journal?edition=${edition.id}&tab=stamps&post=${edition.id}`}
              className="sticker flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-riso-yellow text-riso-ink px-5 py-3 font-display uppercase tracking-wider text-sm text-center"
            >
              <BookOpen className="h-4 w-4" />
              Open journal
            </Link>
          </div>

          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            Trip photos · CC / stock where noted · not AI-generated
          </p>
        </div>
      </div>
    </div>
  );
}
