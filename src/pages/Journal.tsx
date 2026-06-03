import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Sparkles, Stamp, Trash2 } from "lucide-react";
import { COMMUNITY_POSTS, getCommunityPost } from "@/data/communityPosts";
import { PRINT_EDITIONS } from "@/data/printEditions";
import { JournalPostCard } from "@/components/JournalPostCard";
import { JournalPostDetail } from "@/components/JournalPostDetail";
import {
  clearJournalRuns,
  getJournalRuns,
  type SavedJournalRun,
} from "@/lib/journalStorage";
import { toast } from "sonner";

type Tab = "community" | "stamps";

const Journal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editionFilter = searchParams.get("edition") ?? "all";
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "stamps" ? "stamps" : "community");
  const [openPostId, setOpenPostId] = useState<string | null>(
    searchParams.get("post") ?? null,
  );
  const [runs, setRuns] = useState(getJournalRuns);

  const refreshRuns = () => setRuns(getJournalRuns());

  const filteredPosts = useMemo(() => {
    if (editionFilter === "all") return COMMUNITY_POSTS;
    return COMMUNITY_POSTS.filter((p) => p.editionId === editionFilter);
  }, [editionFilter]);

  const openPost = openPostId ? getCommunityPost(openPostId) : undefined;
  const linkedRun = openPostId
    ? runs.find((r) => r.editionId === openPostId)
    : undefined;

  const setEdition = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === "all") next.delete("edition");
    else next.set("edition", id);
    setSearchParams(next, { replace: true });
  };

  const openDetail = (editionId: string) => {
    setOpenPostId(editionId);
    const next = new URLSearchParams(searchParams);
    next.set("post", editionId);
    setSearchParams(next, { replace: true });
  };

  const closeDetail = () => {
    setOpenPostId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("post");
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          ▚ Section · Journal ▚
        </p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.9] tracking-tight text-riso-ink">
          Travel <span className="text-riso-cyan">Journal</span>
        </h1>
        <p className="mt-4 max-w-2xl font-mono text-base text-foreground/75 leading-relaxed">
          Real trip notes from travelers who played each city edition — plus your own stamps after
          you finish a run.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("community")}
          className={`sticker-sm px-4 py-2 rounded-full font-display uppercase text-xs tracking-wider ${
            tab === "community" ? "bg-riso-cyan text-riso-ink" : "bg-background text-riso-ink"
          }`}
        >
          Community
        </button>
        <button
          type="button"
          onClick={() => setTab("stamps")}
          className={`sticker-sm px-4 py-2 rounded-full font-display uppercase text-xs tracking-wider ${
            tab === "stamps" ? "bg-riso-pink text-background" : "bg-background text-riso-ink"
          }`}
        >
          Your stamps ({runs.length})
        </button>
      </div>

      {tab === "community" && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={() => setEdition("all")}
              className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${
                editionFilter === "all"
                  ? "bg-riso-ink text-background border-riso-ink"
                  : "border-riso-ink/25 text-riso-ink"
              }`}
            >
              All cities
            </button>
            {PRINT_EDITIONS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEdition(e.id)}
                className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest border ${
                  editionFilter === e.id
                    ? "bg-riso-ink text-background border-riso-ink"
                    : "border-riso-ink/25 text-riso-ink"
                }`}
              >
                {e.city.split(" · ")[0]}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {filteredPosts.map((post) => (
              <JournalPostCard
                key={post.editionId}
                post={post}
                onOpen={() => openDetail(post.editionId)}
              />
            ))}
          </div>
        </>
      )}

      {tab === "stamps" && (
        <div className="space-y-6">
          {runs.length === 0 ? (
            <div className="sticker diary-paper-plain p-8 sm:p-10 text-center max-w-lg mx-auto rotate--1">
              <Stamp className="h-10 w-10 mx-auto text-riso-pink mb-4" />
              <p className="font-display text-xl text-riso-ink mb-2">No stamps yet</p>
              <p className="font-mono text-sm text-muted-foreground mb-6 leading-relaxed">
                Finish a Print Edition and your score gets stamped here with the traveler&apos;s
                follow-up note.
              </p>
              <Link
                to="/"
                className="sticker inline-flex items-center gap-2 rounded-full bg-riso-ink text-background px-6 py-3 font-display uppercase tracking-wider text-sm"
              >
                <BookOpen className="h-4 w-4" />
                Pick an edition
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearJournalRuns();
                    refreshRuns();
                    toast.success("Cleared your stamps");
                  }}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-riso-pink"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {runs.map((run) => (
                  <StampCard
                    key={run.id}
                    run={run}
                    onOpen={() => openDetail(run.editionId)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-12 sticker-sm bg-riso-yellow/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display text-lg text-riso-ink">Make your own zine page</p>
          <p className="font-mono text-sm text-foreground/70 mt-1">
            Paste travel photos and let AI build a pocket game.
          </p>
        </div>
        <Link
          to="/games/ai-create"
          className="sticker inline-flex items-center justify-center gap-2 rounded-full bg-riso-pink text-background px-6 py-3 font-display uppercase tracking-wider text-sm shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          AI Create
        </Link>
      </div>

      {openPost && (
        <JournalPostDetail post={openPost} run={linkedRun} onClose={closeDetail} />
      )}
    </section>
  );
};

function StampCard({ run, onOpen }: { run: SavedJournalRun; onOpen: () => void }) {
  const post = getCommunityPost(run.editionId);
  const thumb = post?.photos[0]?.src;

  return (
    <li className="sticker bg-background p-4 rotate-1">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex gap-3">
          {thumb && (
            <img
              src={thumb}
              alt=""
              className="journal-upload-photo h-16 w-16 rounded-md object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Vol. {run.vol} · {run.city}
            </p>
            <p className="font-display text-base text-riso-ink truncate">{run.editionTitle}</p>
            <p className="font-mono text-xs text-foreground/75 mt-1 line-clamp-2">{run.footnote}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">
              {run.score} pts · {run.misses} missed ·{" "}
              {new Date(run.playedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </button>
      <Link
        to={`/games/editions/${run.editionId}`}
        className="mt-3 block text-center font-mono text-[10px] uppercase tracking-widest text-riso-cyan hover:underline"
      >
        Play again →
      </Link>
    </li>
  );
}

export default Journal;
