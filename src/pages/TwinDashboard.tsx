import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  Loader2,
  Lock,
  MessageSquare,
  Plug,
  RefreshCw,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/riso/PageHeader";
import { FeatureBetaBanner } from "@/components/FeatureBetaBanner";
import { TwinGeneratingOverlay } from "@/components/TwinGeneratingOverlay";
import { featureMeta, isFeatureBeta } from "@/lib/launchGate";
import { listUserArchives, type UserArchive } from "@/lib/archiveApi";
import {
  fetchActivePersona,
  fetchPendingDrafts,
  fetchSlackConnection,
  generateTwin,
  getSlackOAuthUrl,
  type SlackConnection,
  type SlackDraft,
  type TwinPersona,
} from "@/lib/twinApi";
import { useAuth } from "@/hooks/useAuth";

function StepPill({
  n,
  label,
  done,
  active,
}: {
  n: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-full border-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider",
        done ? "border-riso-ink bg-riso-yellow text-riso-ink" : active ? "border-riso-pink bg-background text-riso-ink" : "border-riso-ink/20 text-muted-foreground",
      ].join(" ")}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[9px] font-display">
        {done ? <Check className="h-3 w-3" /> : n}
      </span>
      {label}
    </div>
  );
}

function latestReadyArchive(archives: UserArchive[]) {
  return archives.find((a) => a.status === "ready");
}

const TwinDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [persona, setPersona] = useState<TwinPersona | null>(null);
  const [slack, setSlack] = useState<SlackConnection | null>(null);
  const [drafts, setDrafts] = useState<SlackDraft[]>([]);
  const [archives, setArchives] = useState<UserArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingTwin, setBuildingTwin] = useState(false);
  const [twinBuildDone, setTwinBuildDone] = useState(false);

  const refresh = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const [p, s, d, a] = await Promise.all([
        fetchActivePersona(),
        fetchSlackConnection(),
        fetchPendingDrafts(),
        listUserArchives(),
      ]);
      setPersona(p);
      setSlack(s);
      setDrafts(d);
      setArchives(a);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load twin");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUpdate = () => void refresh(true);
    window.addEventListener("mnemo-archive-updated", onUpdate);
    return () => window.removeEventListener("mnemo-archive-updated", onUpdate);
  }, [refresh]);

  useEffect(() => {
    const slackStatus = searchParams.get("slack");
    if (slackStatus === "connected") {
      toast.success("Slack connected");
      const next = new URLSearchParams(searchParams);
      next.delete("slack");
      setSearchParams(next, { replace: true });
      void refresh();
    }
    if (slackStatus === "error") {
      toast.error("Slack connection failed");
      const next = new URLSearchParams(searchParams);
      next.delete("slack");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, refresh]);

  const readyArchive = useMemo(() => latestReadyArchive(archives), [archives]);
  const sourceArchive = useMemo(
    () => (persona ? archives.find((a) => a.id === persona.archive_id) : undefined),
    [archives, persona],
  );
  const draftArchives = useMemo(
    () => archives.filter((a) => a.status !== "ready"),
    [archives],
  );

  const hasMemories = archives.length > 0;
  const hasTwin = !!persona;
  const hasSlack = !!slack;

  const connectSlack = () => {
    if (!user || !persona) return;
    window.location.href = getSlackOAuthUrl(user.id);
  };

  const buildTwin = async (archiveId?: string) => {
    const id = archiveId ?? readyArchive?.id;
    if (!id) {
      toast.error("Add a trip archive first — Journal or AI Create.");
      return;
    }
    setBuildingTwin(true);
    setTwinBuildDone(false);
    try {
      await generateTwin(id);
      setTwinBuildDone(true);
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Your twin is ready");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to build twin");
    } finally {
      setBuildingTwin(false);
      setTwinBuildDone(false);
    }
  };

  const twinConnectBeta = isFeatureBeta("twinDiscordConnect");
  const twinConnectMeta = featureMeta("twinDiscordConnect");

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-riso-pink" />
      </div>
    );
  }

  return (
    <>
      <TwinGeneratingOverlay
        open={buildingTwin}
        done={twinBuildDone}
        archiveTitle={readyArchive?.title ?? sourceArchive?.title ?? undefined}
      />
      <section className="mx-auto w-full max-w-[720px] px-4 py-10 sm:py-14">
      <PageHeader
        align="left"
        className="mb-6 max-w-none"
        eyebrow="Mnemo Twin"
        title={
          <>
            Your <span className="text-riso-pink">Discord voice</span>, from travel memories
          </>
        }
        lead="Twin turns your archives into a persona that drafts Discord replies. Nothing sends until you approve each draft here."
      />

      <FeatureBetaBanner feature="twinDiscordConnect" className="mb-6" />

      <div className="mb-8 flex flex-wrap gap-2">
        <StepPill n={1} label="Memories" done={hasMemories} active={!hasMemories} />
        <StepPill n={2} label="Twin" done={hasTwin} active={hasMemories && !hasTwin} />
        <StepPill n={3} label="Discord" done={hasSlack} active={hasTwin && !hasSlack} />
      </div>

      {/* Step 1 — Memories */}
      {!hasMemories && (
        <div className="riso-card text-center mb-6 rotate-1">
          <BookOpen className="h-10 w-10 mx-auto text-riso-ink/40 mb-3" />
          <p className="font-hand text-2xl text-riso-ink mb-2">Start with a memory</p>
          <p className="font-mono text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Journal entries, AI Create photos, or Instagram imports become archives — the raw material for your twin.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/journal" className="riso-btn-primary">
              Open Journal
            </Link>
            <Link to="/games/ai-create" className="riso-btn-secondary">
              <Sparkles className="h-4 w-4" />
              AI Create
            </Link>
          </div>
        </div>
      )}

      {hasMemories && !hasTwin && (
        <div className="riso-card mb-6">
          <p className="riso-eyebrow mb-2">Step 2 · Build twin</p>
          {readyArchive ? (
            <>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                We&apos;ll shape a voice from your latest ready archive:{" "}
                <strong className="text-riso-ink">{readyArchive.title ?? "Untitled"}</strong>
              </p>
              <button
                type="button"
                onClick={() => void buildTwin()}
                disabled={buildingTwin}
                className="riso-btn-primary"
              >
                {buildingTwin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCircle className="h-4 w-4" />}
                Build my twin
              </button>
            </>
          ) : (
            <>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                You have {archives.length} archive{archives.length === 1 ? "" : "s"}, but none are ready yet.
                Open one and run the AI summary first.
              </p>
              {draftArchives[0] && (
                <Link to={`/archive/${draftArchives[0].id}`} className="riso-btn-secondary">
                  Open latest archive
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2 — Active twin */}
      {hasTwin && persona && (
        <div className="riso-card mb-6 border-l-4 border-riso-pink rotate--1">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <p className="riso-eyebrow">Your twin</p>
            {readyArchive && readyArchive.id !== persona.archive_id && (
              <button
                type="button"
                onClick={() => void buildTwin(readyArchive.id)}
                disabled={buildingTwin}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-riso-pink"
              >
                {buildingTwin ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Update from latest trip
              </button>
            )}
          </div>
          <h2 className="font-display text-2xl text-riso-ink">{persona.display_name}</h2>
          {persona.bio_short && (
            <p className="mt-2 font-hand text-xl text-riso-ink/80">{persona.bio_short}</p>
          )}
          {persona.traits_json?.tone && (
            <p className="mt-3 font-mono text-xs text-muted-foreground">Tone: {persona.traits_json.tone}</p>
          )}
          {sourceArchive && (
            <Link
              to={`/archive/${sourceArchive.id}`}
              className="mt-4 inline-block font-mono text-xs text-riso-cyan hover:underline"
            >
              View source archive →
            </Link>
          )}
        </div>
      )}

      {/* Step 3 — Slack + drafts (only after twin exists) */}
      {hasTwin && (
        <div className="riso-card mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="riso-section-title mb-0">
              <Plug className="h-5 w-5" />
              Discord inbox
            </h3>
            {!hasSlack && !twinConnectMeta.blockPrimaryAction && (
              <button type="button" onClick={connectSlack} className="riso-btn-primary text-xs py-2 px-4">
                Connect Discord
              </button>
            )}
            {!hasSlack && twinConnectMeta.blockPrimaryAction && (
              <span className="riso-btn-primary text-xs py-2 px-4 opacity-45 cursor-not-allowed pointer-events-none">
                Connect Discord
              </span>
            )}
          </div>

          {twinConnectBeta && !hasSlack && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-riso-violet mb-3">
              BETA · connection flow not fully live
            </p>
          )}

          {hasSlack ? (
            <p className="font-mono text-sm text-muted-foreground mb-4">
              Connected to <strong>{slack!.team_name ?? slack!.team_id}</strong>. Mention{" "}
              <strong>@Mnemo</strong> or DM the app — drafts appear below for you to edit and send.
            </p>
          ) : (
            <p className="font-mono text-sm text-muted-foreground flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 mt-0.5 opacity-50" />
              Optional: connect Discord so your twin can draft replies. You still approve every message.
            </p>
          )}

          {hasSlack && drafts.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-riso-ink/15 bg-riso-yellow/10 px-4 py-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-riso-ink/30 mb-2" />
              <p className="font-mono text-sm text-muted-foreground">No pending drafts</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">
                @mention Mnemo in Slack to get started
              </p>
            </div>
          )}

          {drafts.length > 0 && (
            <ul className="space-y-3 mt-2">
              {drafts.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/twin/drafts/${d.id}`}
                    className="sticker block rounded-xl p-4 hover:bg-riso-yellow/20 transition-colors"
                  >
                    <p className="font-mono text-[10px] uppercase text-muted-foreground line-clamp-1">
                      {d.trigger_text}
                    </p>
                    <p className="mt-1 font-hand text-lg text-riso-ink line-clamp-2">{d.draft_text}</p>
                    <p className="mt-2 font-mono text-[10px] text-riso-pink uppercase tracking-widest">
                      Review & send →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasMemories && (
        <div className="sticker-sm rounded-xl bg-riso-ink/5 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            {archives.length} memor{archives.length === 1 ? "y" : "ies"} feeding this twin
          </p>
          <ul className="space-y-1">
            {archives.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link
                  to={`/archive/${a.id}`}
                  className="font-mono text-sm text-riso-ink hover:text-riso-pink flex justify-between gap-2"
                >
                  <span className="truncate">{a.title ?? "Untitled"}</span>
                  <span className="text-[10px] uppercase text-muted-foreground shrink-0">{a.status}</span>
                </Link>
              </li>
            ))}
          </ul>
          {archives.length > 3 && (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">+ {archives.length - 3} more</p>
          )}
        </div>
      )}

      <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
        Account settings on{" "}
        <Link to="/profile" className="text-riso-pink hover:underline">
          Profile
        </Link>
        {" · "}
        <Link to="/archive/new" className="text-riso-pink hover:underline">
          Add archive manually
        </Link>
      </p>
    </section>
    </>
  );
};

export default TwinDashboard;
