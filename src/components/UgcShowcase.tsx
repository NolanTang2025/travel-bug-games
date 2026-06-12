import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Gamepad2, Heart, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { communityGameVisual } from "@/lib/communityGameCover";
import { listTopCommunityGames, type CommunityGameCard } from "@/lib/communityGamesApi";

function CommunityGameCard({
  game,
  opening,
  onOpen,
  size = "md",
}: {
  game: CommunityGameCard;
  opening: boolean;
  onOpen: () => void;
  size?: "lg" | "md";
}) {
  const visual = communityGameVisual(game);
  const width = size === "lg" ? "w-[260px] sm:w-[280px]" : "w-[220px] sm:w-[240px]";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={opening}
      className={[
        "ugc-game-card group shrink-0 snap-start text-left",
        width,
        opening ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-riso-ink/15 bg-background shadow-[0_12px_40px_-20px_rgba(26,26,46,0.35)] transition-transform duration-200 group-hover:-translate-y-1">
        {visual.coverUrl ? (
          <img
            src={visual.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: visual.gradient }}
          >
            <span className="text-5xl drop-shadow-md" aria-hidden>
              {visual.emoji}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-riso-ink/90 via-riso-ink/25 to-transparent"
          aria-hidden
        />
        <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur-sm">
          <Heart className="h-3 w-3 fill-riso-pink text-riso-pink" />
          {game.upvote_count}
        </span>
        <div className="absolute inset-x-0 bottom-0 z-10 p-4">
          <h3 className="font-display text-lg leading-tight text-white line-clamp-2">
            {game.title}
          </h3>
          <p className="mt-1 font-hand text-sm text-white/80 line-clamp-2">
            {game.tagline || "Playable memory from a real trip"}
          </p>
          {game.authorName && (
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-white/55">
              by {game.authorName}
            </p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.2em] text-riso-yellow">
            {opening ? "Loading…" : "Play"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function UgcShowcase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState<CommunityGameCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const rows = await listTopCommunityGames(12);
      setGames(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onPublish = () => void load(true);
    window.addEventListener("mnemo-community-game-published", onPublish);
    return () => window.removeEventListener("mnemo-community-game-published", onPublish);
  }, [load]);

  const openGame = (id: string) => {
    setOpeningId(id);
    navigate(`/games/play/${id}`, { state: { reload: Date.now() } });
    setOpeningId(null);
  };

  const solo = games.length === 1 ? games[0] : null;

  return (
    <section className="ugc-showcase relative overflow-hidden border-y-2 border-riso-ink bg-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 10% 20%, oklch(0.92 0.12 340 / 0.35), transparent 45%), radial-gradient(circle at 90% 80%, oklch(0.88 0.1 200 / 0.3), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              ▚ Section 04 · Community picks ▚
            </p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-[0.95] tracking-tight text-riso-ink">
              Made on <span className="text-riso-cyan">Mnemo</span>
            </h2>
          </div>
          <p className="max-w-md font-mono text-sm leading-relaxed text-foreground/65">
            Top upvoted games from real trips. Yours can land here when you publish from journal or
            viral lab — the board fills as more people play.
          </p>
        </div>

        {loading && games.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-riso-pink" />
            Loading community picks…
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-riso-ink/15 bg-background/80 px-6 py-14 text-center">
            <Gamepad2 className="mx-auto mb-4 h-10 w-10 text-riso-violet/50" />
            <p className="font-display text-xl text-riso-ink">No games on the board yet</p>
            <p className="mx-auto mt-2 max-w-md font-mono text-sm text-muted-foreground">
              {user
                ? "Make a game from a journal entry — it publishes here for others to play and upvote."
                : "Sign in, create a game from a trip, and it'll show up here for the community."}
            </p>
          </div>
        ) : solo ? (
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(260px,300px)_1fr]">
            <CommunityGameCard
              game={solo}
              opening={openingId === solo.id}
              onOpen={() => openGame(solo.id)}
              size="lg"
            />
            <div className="flex flex-col justify-center rounded-3xl border-2 border-riso-ink/10 bg-background/90 p-8 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-riso-pink">
                Early board
              </p>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl leading-tight text-riso-ink">
                You&apos;re on the leaderboard — help it grow
              </h3>
              <p className="mt-3 max-w-lg font-mono text-sm text-foreground/70 leading-relaxed">
                Share your game link so friends can play and upvote. Publish more from journal or
                trends and they&apos;ll stack here as the community wakes up.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/games/play/${solo.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-riso-cyan px-5 py-2.5 font-display text-sm uppercase tracking-wider text-riso-ink"
                >
                  Play top pick
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/journal"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-riso-ink/15 bg-paper px-5 py-2.5 font-display text-sm uppercase tracking-wider text-riso-ink"
                >
                  Publish another
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="ugc-showcase-rail -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {games.map((game) => (
                <CommunityGameCard
                  key={game.id}
                  game={game}
                  opening={openingId === game.id}
                  onOpen={() => openGame(game.id)}
                  size="lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/journal"
            className="sticker inline-flex items-center gap-2 rounded-full bg-riso-yellow px-6 py-3 font-display uppercase text-sm text-riso-ink"
          >
            <Sparkles className="h-4 w-4" />
            Make a game from journal
          </Link>
        </div>
      </div>
    </section>
  );
}
