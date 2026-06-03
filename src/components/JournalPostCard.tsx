import { Link } from "react-router-dom";
import { MapPin, Play } from "lucide-react";
import type { CommunityTravelPost } from "@/data/communityPosts";
import { getEditionById } from "@/data/printEditions";

export function JournalPostCard({
  post,
  onOpen,
  compact = false,
}: {
  post: CommunityTravelPost;
  onOpen: () => void;
  compact?: boolean;
}) {
  const edition = getEditionById(post.editionId);
  const preview = post.body.split("\n").find((l) => l.trim()) ?? post.body;
  const thumb = post.photos[0]?.src;

  return (
    <article
      className={`sticker bg-background overflow-hidden ${compact ? "" : "rotate--1 hover:rotate-0 transition-transform"}`}
    >
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {thumb && (
            <img
              src={thumb}
              alt=""
              className="journal-upload-photo h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {edition && (
            <span className="absolute left-2 top-2 sticker-sm bg-riso-yellow px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-riso-ink">
              Vol. {edition.n}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-riso-ink/30 bg-riso-cyan/25 font-display text-xs">
              {post.author.avatarInitials}
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm text-riso-ink truncate">{post.author.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground truncate">{post.author.handle}</p>
            </div>
          </div>
          <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-riso-ink/65 mb-2">
            <MapPin className="h-3 w-3" />
            {post.visited}
          </p>
          <p className="font-mono text-sm text-foreground/80 line-clamp-3 leading-relaxed">{preview}</p>
        </div>
      </button>
      {edition && (
        <div className="px-4 pb-4 pt-0">
          <Link
            to={`/games/editions/${edition.id}`}
            className="sticker-sm inline-flex w-full items-center justify-center gap-2 rounded-full bg-riso-ink text-background py-2.5 font-display text-xs uppercase tracking-wider"
          >
            <Play className="h-3.5 w-3.5" />
            Play {edition.title}
          </Link>
        </div>
      )}
    </article>
  );
}
