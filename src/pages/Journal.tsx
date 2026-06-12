import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Loader2, MapPin, Plus, Sparkles, Stamp, Trash2 } from "lucide-react";
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
import { InstagramImport } from "@/components/InstagramImport";
import { TravelArchiveCard } from "@/components/TravelArchiveCard";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchArchiveCoverPaths,
  listUserArchives,
  resolveArchiveThumbUrls,
  type UserArchive,
} from "@/lib/archiveApi";
import { getCachedMediaObjectUrls } from "@/lib/mediaImageCache";

type Tab = "mine" | "community" | "stamps";

function tabFromParams(raw: string | null): Tab {
  if (raw === "stamps") return "stamps";
  if (raw === "community") return "community";
  return "mine";
}

const Journal = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const editionFilter = searchParams.get("edition") ?? "all";
  const [tab, setTab] = useState<Tab>(() => tabFromParams(searchParams.get("tab")));
  const [archives, setArchives] = useState<UserArchive[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>(
    searchParams.get("post") ?? null,
  );
  const [runs, setRuns] = useState(getJournalRuns);

  const refreshRuns = () => setRuns(getJournalRuns());

  const loadArchives = useCallback(async (opts?: { background?: boolean }) => {
    if (!user) {
      setArchives([]);
      setThumbs({});
      return;
    }
    if (!opts?.background) setArchivesLoading(true);
    try {
      const rows = await listUserArchives();
      setArchives(rows);

      const ids = rows.slice(0, 24).map((arch) => arch.id);
      if (!ids.length) {
        setThumbs({});
        return;
      }

      const pathsByArchive = await fetchArchiveCoverPaths(ids);
      const cachedByPath = await getCachedMediaObjectUrls(Object.values(pathsByArchive));
      const cachedThumbs: Record<string, string> = {};
      for (const [archiveId, path] of Object.entries(pathsByArchive)) {
        if (cachedByPath[path]) cachedThumbs[archiveId] = cachedByPath[path];
      }
      if (Object.keys(cachedThumbs).length) setThumbs(cachedThumbs);

      const map = await resolveArchiveThumbUrls(ids);
      setThumbs(map);
    } catch (e) {
      console.error("[journal] loadArchives failed", e);
      setArchives([]);
      setThumbs({});
    } finally {
      setArchivesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void loadArchives();
  }, [authLoading, user, loadArchives]);

  useEffect(() => {
    const onUpdate = () => {
      if (!authLoading && user) void loadArchives({ background: true });
    };
    window.addEventListener("mnemo-archive-updated", onUpdate);
    return () => window.removeEventListener("mnemo-archive-updated", onUpdate);
  }, [authLoading, user, loadArchives]);

  const switchTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === "mine") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

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
    <section className="journal-page relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-10 relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">
          ▚ Section · Journal ▚
        </p>
        <h1 className="font-display leading-[0.88] tracking-tight text-riso-ink">
          <span className="block text-[clamp(2.5rem,8vw,5rem)] text-chroma-lg">Travel Journal</span>
        </h1>
        <p className="mt-5 max-w-2xl font-mono text-sm sm:text-base text-foreground/75 leading-relaxed">
          After you journal, finish a Print Edition, or use AI Create, sign in to{" "}
          <span className="bg-riso-yellow px-1.5 -skew-x-3 inline-block font-semibold text-riso-ink">
            auto-archive
          </span>{" "}
          your trips. Paste a public Instagram link to import.
        </p>
      </header>

      <InstagramImport />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => switchTab("mine")}
          className={`sticker-sm px-4 py-2 rounded-full font-display uppercase text-xs tracking-wider ${
            tab === "mine" ? "bg-riso-violet text-background" : "bg-background text-riso-ink"
          }`}
        >
          My trips ({user ? archives.length : "—"})
        </button>
        <button
          type="button"
          onClick={() => switchTab("community")}
          className={`sticker-sm px-4 py-2 rounded-full font-display uppercase text-xs tracking-wider ${
            tab === "community" ? "bg-riso-cyan text-riso-ink" : "bg-background text-riso-ink"
          }`}
        >
          Community
        </button>
        <button
          type="button"
          onClick={() => switchTab("stamps")}
          className={`sticker-sm px-4 py-2 rounded-full font-display uppercase text-xs tracking-wider ${
            tab === "stamps" ? "bg-riso-pink text-background" : "bg-background text-riso-ink"
          }`}
        >
          Your stamps ({runs.length})
        </button>
      </div>

      {tab === "mine" && (
        <div className="space-y-6">
          {authLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-riso-pink" />
            </div>
          ) : !user ? (
            <div className="riso-card text-center max-w-lg mx-auto">
              <MapPin className="h-10 w-10 mx-auto text-riso-violet/50 mb-3" />
              <p className="font-display text-xl text-riso-ink">Sign in to save trips</p>
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                Your journals, AI Create photos, and imports become travel entries here.
              </p>
              <Link to="/login" className="riso-btn-primary mt-6 inline-flex">
                Sign in
              </Link>
            </div>
          ) : archivesLoading && archives.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-riso-pink" />
            </div>
          ) : archives.length === 0 ? (
            <div className="riso-card text-center max-w-lg mx-auto">
              <BookOpen className="h-10 w-10 mx-auto text-riso-cyan/50 mb-3" />
              <p className="font-display text-xl text-riso-ink">No trips yet</p>
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                Import Instagram, use AI Create, or add a manual archive to start your journal.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/archive/new" className="riso-btn-secondary">
                  <Plus className="h-4 w-4" />
                  New entry
                </Link>
                <Link to="/games/ai-create" className="riso-btn-primary">
                  <Sparkles className="h-4 w-4" />
                  AI Create
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Link to="/archive/new" className="riso-btn-secondary text-xs py-2 px-4">
                  <Plus className="h-3.5 w-3.5" />
                  New entry
                </Link>
              </div>
              <ul className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                {archives.map((arch, i) => (
                  <li key={arch.id} className={i % 2 === 1 ? "sm:rotate-1" : "sm:-rotate-1"}>
                    <TravelArchiveCard
                      archive={arch}
                      thumbUrl={thumbs[arch.id]}
                      onDeleted={() => void loadArchives({ background: true })}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

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
