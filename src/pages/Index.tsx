import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bug, Sparkles, Camera, BookOpen, ArrowRight, Cpu, Disc3 } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import { listSavedGames, type SavedGame } from "@/lib/gameLibrary";
import { cn } from "@/lib/utils";
import GramophonePlayer from "@/components/GramophonePlayer";
import type { ActiveRecord } from "@/components/GramophonePlayer";
import { useState, useCallback } from "react";

/** Stable slight lean per record so the shelf feels lived-in */
function shelfTilt(id: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return ((h % 13) - 6) * 0.55;
}

function VinylSavedGame({
  g,
  onSelect,
}: {
  g: SavedGame;
  onSelect: (g: SavedGame) => void;
}) {
  const tilt = shelfTilt(g.id);
  return (
    <button
      type="button"
      onClick={() => onSelect(g)}
      className="group flex flex-col items-center w-[158px] sm:w-[168px] shrink-0 snap-center cursor-pointer"
    >
      <div className="relative w-[148px] sm:w-[156px]" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="vinyl-record-surface relative w-full transition-all duration-300 ease-out group-hover:-translate-y-4 group-hover:shadow-card">
          <div className="pointer-events-none absolute inset-0 rounded-full opacity-40 bg-[radial-gradient(circle_at_38%_28%,hsl(0_0%_100%/0.28),transparent_48%)]" />
          <div
            className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 w-[44%] aspect-square rounded-full overflow-hidden border-[5px] shadow-inner"
            style={{
              background: g.coverPhoto ? undefined : g.background,
              borderColor: "hsl(220 18% 8%)",
            }}
          >
            {g.coverPhoto ? (
              <img src={g.coverPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-2xl drop-shadow-md">
                {g.targetEmoji}
              </div>
            )}
          </div>
          <span
            className="absolute left-1/2 top-1/2 z-[18] h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 vinyl-label-hole ring-1 ring-neutral-900"
            aria-hidden
          />
          <span className="pointer-events-none absolute bottom-[17%] right-[14%] z-[8] rounded-md bg-black/40 px-1.5 py-0.5 font-data text-[8px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-[2px]">
            {g.mechanic === "catch" ? `${g.targetEmoji} catch` : `${g.obstacleEmoji} dodge`}
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[11rem] text-center text-xs font-bold leading-snug text-foreground line-clamp-2 sm:text-[13px]">
        {g.title}
      </p>
      <p className="mt-1 max-w-[11rem] text-center text-[10px] leading-snug text-muted-foreground line-clamp-2 font-data">
        {g.tagline}
      </p>
    </button>
  );
}

function VinylFeatured({
  onSelect,
  title,
  subtitle,
  badge,
  tiltSalt,
  Icon,
  labelClassName,
  iconClassName,
}: {
  onSelect: () => void;
  title: string;
  subtitle: string;
  badge: string;
  tiltSalt: number;
  Icon: LucideIcon;
  labelClassName: string;
  iconClassName?: string;
}) {
  const tilt = shelfTilt(title, tiltSalt);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-center w-[158px] sm:w-[168px] shrink-0 snap-center cursor-pointer"
    >
      <div className="relative w-[148px] sm:w-[156px]" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="vinyl-record-surface relative w-full transition-all duration-300 ease-out group-hover:-translate-y-4 group-hover:shadow-card">
          <div className="pointer-events-none absolute inset-0 rounded-full opacity-40 bg-[radial-gradient(circle_at_38%_28%,hsl(0_0%_100%/0.26),transparent_48%)]" />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 z-[5] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center w-[44%] aspect-square rounded-full border-[5px] shadow-inner",
              labelClassName,
            )}
            style={{ borderColor: "hsl(220 18% 8%)" }}
          >
            <Icon
              className={cn("w-[38%] h-[38%] drop-shadow-sm", iconClassName ?? "text-white")}
              strokeWidth={2}
            />
          </div>
          <span
            className="absolute left-1/2 top-1/2 z-[18] h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 vinyl-label-hole ring-1 ring-neutral-900"
            aria-hidden
          />
          <span className="pointer-events-none absolute bottom-[17%] right-[14%] z-[8] max-w-[42%] truncate rounded-md bg-black/45 px-1.5 py-0.5 text-center font-data text-[7px] font-bold uppercase tracking-wide text-white/95 shadow-sm backdrop-blur-[2px]">
            {badge}
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[11rem] text-center text-xs font-bold leading-snug text-foreground line-clamp-2 sm:text-[13px]">
        {title}
      </p>
      <p className="mt-1 max-w-[11rem] text-center text-[10px] leading-snug text-muted-foreground line-clamp-2 font-data">
        {subtitle}
      </p>
    </button>
  );
}

const Index = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const saved = listSavedGames().slice(0, 6);
  const flagship = saved[0];

  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const handleGameSelect = useCallback((g: SavedGame) => {
    setActiveRecord({
      id: g.id,
      coverPhoto: g.coverPhoto || null,
      emoji: g.targetEmoji,
      labelBg: g.background,
      title: g.title,
    });
    setPendingNav(`/games/library/${g.id}`);
  }, []);

  const handleFeaturedSelect = useCallback((path: string, title: string) => {
    setActiveRecord({
      id: path,
      coverPhoto: null,
      emoji: "✨",
      labelBg: "linear-gradient(145deg, hsl(218 42% 42%), hsl(262 48% 36%))",
      title,
    });
    setPendingNav(path);
  }, []);

  const handlePlayComplete = useCallback(() => {
    if (pendingNav) {
      navigate(pendingNav);
    }
  }, [pendingNav, navigate]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden home-tech-shell">
      <div className="pointer-events-none absolute inset-0 z-0 home-tech-grid" aria-hidden />

      {/* Hero */}
      <section className="relative z-10 mx-auto w-full max-w-page px-4 pb-12 pt-10 sm:px-6 sm:pb-14 lg:px-8 lg:pt-14 xl:pb-18">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(260px,1fr)] lg:items-center lg:gap-x-10 xl:gap-x-14 2xl:gap-x-16">
          <header className="min-w-0 max-w-xl lg:max-w-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur-sm font-data">
              <Cpu className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              <span>{t("brand")}</span>
            </div>

            <h1 className="mt-7 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.06] tracking-tight text-foreground font-display">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {t("heroSubtitle")}
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:flex-wrap">
              <Link to="/journal" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group w-full sm:w-auto rounded-full px-9 h-14 text-base font-semibold gap-2 shadow-soft hover:-translate-y-0.5 transition-transform"
                >
                  <BookOpen className="h-5 w-5" />
                  {t("ctaJournal")}
                  <ArrowRight className="h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/games/ai-create" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-7 h-14 font-semibold border-border bg-card/90 backdrop-blur-sm hover:bg-card"
                >
                  <Disc3 className="h-5 w-5 mr-2 text-primary" />
                  {t("ctaGames")}
                </Button>
              </Link>
            </div>
          </header>

          {/* Artifact — Jewel Case + Holographic CD */}
          <div className="relative flex min-w-0 justify-center pr-2 sm:pr-4 lg:justify-end lg:pr-2 xl:pr-4">
            <div className="relative w-full max-w-[400px] lg:max-w-[460px] home-jewel-case perspective-1000 preserve-3d">
              <div
                className={cn(
                  "relative rounded-[1.75rem] p-[10px] sm:p-3",
                  "border border-border/80 bg-card/95 shadow-card backdrop-blur-sm",
                )}
              >
                <div
                  className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-inner ring-1 ring-border/60"
                  style={{
                    background: flagship?.background ?? "linear-gradient(145deg, hsl(218 42% 42%), hsl(262 48% 36%))",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_75%_15%,hsl(0_0%_100%/0.28),transparent_58%)] pointer-events-none" />

                  {flagship?.coverPhoto ? (
                    <img
                      src={flagship.coverPhoto}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <p className="font-data text-[10px] uppercase tracking-[0.35em] opacity-85">TRAVEL-ROM</p>
                      <p className="mt-2 font-black text-2xl sm:text-3xl tracking-tight drop-shadow-lg font-display">{t("brand").split(" ")[0]}…</p>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/25 bg-black/35 px-2.5 py-1 backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white/90" />
                    <span className="font-data text-[10px] uppercase tracking-wider text-white/92">HDR · Memory Layer</span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent p-5 pt-14">
                    {flagship ? (
                      <>
                        <p className="font-data text-[10px] uppercase tracking-[0.2em] text-white/75">Latest capture</p>
                        <p className="font-black text-xl text-white truncate drop-shadow font-display">{flagship.title}</p>
                        <p className="text-xs text-white/85 line-clamp-2 mt-1">{flagship.tagline}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-data text-[10px] uppercase tracking-[0.25em] text-white/75">Awaiting imprint</p>
                        <p className="font-bold text-lg text-white/95 mt-1">Journal → imprint → play</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* CD overlaps sleeve — holographic */}
              <div className="absolute right-[-10%] sm:right-[-8%] top-1/2 z-20 w-[62%] max-w-[260px] -translate-y-1/2 motion-safe:hover:scale-[1.03] transition-transform duration-300">
                <Link
                  to="/games/ai-create"
                  className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                  aria-label={t("ctaGames")}
                >
                  <div className="home-cd-disc relative">
                    <span className="home-cd-holo" aria-hidden />
                    <span className="home-cd-holo-2" aria-hidden />
                    <span className="home-cd-hub" aria-hidden />
                  </div>
                  <span className="sr-only">{t("ctaGames")}</span>
                </Link>
                <p className="mt-3 text-center font-data text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Memory Disc · Hybrid layer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gramophone Player */}
      <section className="relative z-10 flex justify-center px-4 -mb-4 sm:-mb-2">
        <div className="glass-panel-holo px-8 py-6 sm:px-12 sm:py-8">
          <GramophonePlayer
            activeRecord={activeRecord}
            onPlayComplete={handlePlayComplete}
            className="w-full"
          />
        </div>
      </section>

      {/* Memories · vinyl shelves */}
      <section className="relative z-10 flex-1 border-t border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3 tracking-tight font-display">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
                <Disc3 className="h-5 w-5 text-primary" />
              </span>
              {t("sectionMemories")}
            </h2>
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Shelf · crate dig
            </p>
          </div>

          <div className="home-shelf-zone">
            <div className="-mx-4 flex snap-x snap-mandatory gap-x-6 gap-y-12 overflow-x-auto overflow-y-visible px-4 pb-3 pt-8 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-10 sm:overflow-visible sm:px-2 md:justify-start">
              {saved.map((g) => (
                <VinylSavedGame key={g.id} g={g} onSelect={handleGameSelect} />
              ))}

              <VinylFeatured
                onSelect={() => handleFeaturedSelect("/journal", t("caseAiTitle"))}
                title={t("caseAiTitle")}
                subtitle={t("caseAiDesc")}
                badge={t("caseAiBadge")}
                tiltSalt={11}
                Icon={BookOpen}
                labelClassName="bg-gradient-to-br from-primary to-sky-950"
              />

              <VinylFeatured
                onSelect={() => handleFeaturedSelect("/games/bug-forest", t("caseYunqiTitle"))}
                title={t("caseYunqiTitle")}
                subtitle={t("caseYunqiDesc")}
                badge={t("caseYunqiBadge")}
                tiltSalt={17}
                Icon={Bug}
                labelClassName="bg-gradient-to-br from-emerald-950 via-sky-950 to-slate-950"
              />

              <VinylFeatured
                onSelect={() => handleFeaturedSelect("/games/ai-create", "Photo → Game")}
                title="Photo → Game"
                subtitle="Skip the journal — one photo upload."
                badge="Quick cut"
                tiltSalt={23}
                Icon={Camera}
                labelClassName="border-2 border-dashed border-border bg-card"
                iconClassName="text-primary"
              />
            </div>

            {saved.length === 0 && (
              <p className="mb-6 text-center text-sm text-muted-foreground font-data">
                No pressings yet — start the journal to cut your first record.
              </p>
            )}

            <div className="home-shelf-board-top-edge mx-1 mt-6 sm:mx-0" />
            <div className="home-shelf-board rounded-md sm:rounded-lg" />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-page px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <span className="font-data text-[11px] uppercase tracking-[0.16em]">{t("footer")}</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
