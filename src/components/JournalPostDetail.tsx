import { Link } from "react-router-dom";
import { MapPin, Play, X } from "lucide-react";
import { buildGameFootnote, type CommunityTravelPost } from "@/data/communityPosts";
import { getEditionById } from "@/data/printEditions";
import type { SavedJournalRun } from "@/lib/journalStorage";
import { TIER_LABELS_COMMUNITY } from "@/data/communityPosts";

export function JournalPostDetail({
  post,
  run,
  onClose,
}: {
  post: CommunityTravelPost;
  run?: SavedJournalRun | null;
  onClose: () => void;
}) {
  const edition = getEditionById(post.editionId);
  const tier = run?.tier ?? "steady";
  const gameNote =
    run && edition
      ? buildGameFootnote(post, tier, run.score, run.misses)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-riso-ink/70 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal
    >
      <div className="sticker w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto bg-background sm:rotate--1 animate-in slide-in-from-bottom-4 duration-300">
        <div className="diary-paper-plain px-5 py-6 sm:px-8 sm:py-8 sticky top-0 z-10 flex items-center justify-between border-b border-riso-ink/10 bg-background/95">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            ▚ Trip report {edition ? `· Vol. ${edition.n}` : ""} ▚
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-riso-ink/20 p-2 text-riso-ink hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:pb-8">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-cyan/30 font-display text-sm">
              {post.author.avatarInitials}
            </span>
            <div>
              <p className="font-display text-lg text-riso-ink">{post.author.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{post.author.handle}</p>
              <p className="font-mono text-[10px] text-muted-foreground/80 mt-0.5">
                {post.author.from} · {post.postedAt}
              </p>
            </div>
          </div>

          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-riso-ink/70 mb-4">
            <MapPin className="h-3 w-3" />
            {post.visited}
          </p>

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {post.photos.map((photo) => (
              <figure
                key={photo.src}
                className="overflow-hidden rounded-md border border-riso-ink/20"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={photo.src}
                    alt={photo.label}
                    className="journal-upload-photo h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="px-2 py-2 border-t border-riso-ink/10">
                  <p className="font-mono text-[9px] text-riso-ink/85 leading-snug">{photo.label}</p>
                  <p className="font-mono text-[8px] text-muted-foreground">{photo.credit}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="rounded-lg border-2 border-riso-ink/15 px-4 py-4 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Trip notes
            </p>
            <p className="font-mono text-sm leading-relaxed text-riso-ink whitespace-pre-wrap">
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

          {gameNote && run && (
            <div className="sticker-sm bg-riso-pink/15 px-4 py-3 mb-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-riso-ink/60 mb-1">
                Your stamp · {TIER_LABELS_COMMUNITY[tier]}
              </p>
              <p className="font-mono text-sm text-riso-ink leading-snug">{gameNote}</p>
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Score {run.score} · missed {run.misses} ·{" "}
                {new Date(run.playedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {edition && (
            <Link
              to={`/games/editions/${edition.id}`}
              className="sticker flex w-full items-center justify-center gap-2 rounded-full bg-riso-ink text-background py-3 font-display uppercase tracking-wider text-sm"
            >
              <Play className="h-4 w-4" />
              Play this edition
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
