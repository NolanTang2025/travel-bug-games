import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Mic, Sparkles, Stamp, Tag, Zap } from "lucide-react";
import type { ArchiveSummary } from "@/lib/archiveApi";
import { InsightsCassette } from "@/components/InsightsCassette";
import { InsightsFilmFrame, InsightsFilmStrip } from "@/components/InsightsFilmStrip";
import { InsightsPinBoard, InsightsPlaceCard } from "@/components/InsightsPinBoard";
import { InsightsPassportStrip, InsightsSticker, InsightsStickerPack } from "@/components/InsightsStickerPack";
import { InsightsVibeMeter } from "@/components/InsightsVibeMeter";

type StationId = "vibe" | "places" | "timeline" | "topics" | "voice";

const STATIONS: {
  id: StationId;
  label: string;
  short: string;
  icon: typeof Zap;
  stamp: string;
}[] = [
  { id: "vibe", label: "Vibe check", short: "Mood", icon: Zap, stamp: "vibe" },
  { id: "places", label: "Pin hunt", short: "Map", icon: MapPin, stamp: "places" },
  { id: "timeline", label: "Story reel", short: "Reel", icon: Sparkles, stamp: "timeline" },
  { id: "topics", label: "Stickers", short: "Tags", icon: Tag, stamp: "topics" },
  { id: "voice", label: "Voice tape", short: "Tape", icon: Mic, stamp: "voice" },
];

const STATION_HINTS: Record<StationId, string> = {
  vibe: "Pull the lever — which mood wins tonight?",
  places: "Pin the spots that actually hit",
  timeline: "Scroll the reel — tap a frame to enlarge",
  topics: "Peel stickers onto your passport strip",
  voice: "Hit play — voice notes unspool like a travel tape",
};

const STATION_EMPTY: Record<StationId, string> = {
  vibe: "No moods in this summary yet.",
  places: "No places extracted yet.",
  timeline: "No timeline beats yet.",
  topics: "No topic stickers yet.",
  voice: "No voice notes in this summary yet.",
};

type Props = {
  summary: ArchiveSummary;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function StationEmpty({ message }: { message: string }) {
  return (
    <p className="font-mono text-sm text-muted-foreground text-center py-10 px-4 leading-relaxed">
      {message}
    </p>
  );
}

export function TravelInsightsPlayground({ summary }: Props) {
  const moods = asArray<string>(summary.mood).filter(Boolean);
  const places = asArray<string>(summary.places).filter(Boolean);
  const topics = asArray<string>(summary.topics).filter(Boolean);
  const timeline = asArray<{ date: string; note: string }>(summary.timeline).filter((t) => t.note?.trim());
  const hasVoice = !!summary.voice_notes?.trim();

  const [station, setStation] = useState<StationId>("vibe");
  const [stamps, setStamps] = useState<Set<string>>(() => new Set());
  const [vibeIndex, setVibeIndex] = useState(0);
  const [vibeSpinning, setVibeSpinning] = useState(false);
  const [pinnedPlaces, setPinnedPlaces] = useState<Set<string>>(() => new Set());
  const [peeledTopics, setPeeledTopics] = useState<Set<string>>(() => new Set());
  const [activeBeat, setActiveBeat] = useState(0);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const vibeTimer = useRef<number | null>(null);
  const voiceTimer = useRef<number | null>(null);

  const activeMeta = STATIONS.find((s) => s.id === station);

  useEffect(() => {
    if (vibeIndex >= moods.length && moods.length > 0) {
      setVibeIndex(0);
    }
  }, [moods.length, vibeIndex]);

  useEffect(
    () => () => {
      if (vibeTimer.current) window.clearTimeout(vibeTimer.current);
      if (voiceTimer.current) window.clearInterval(voiceTimer.current);
    },
    [],
  );

  const collectStamp = useCallback((id: string) => {
    setStamps((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const stampTotal = STATIONS.length;
  const stampCount = stamps.size;
  const progressPct = stampTotal ? Math.round((stampCount / stampTotal) * 100) : 0;
  const decoded = stampCount >= stampTotal && stampTotal > 0;

  const spinVibe = () => {
    if (!moods.length || vibeSpinning) return;
    setVibeSpinning(true);
    collectStamp("vibe");
    let ticks = 0;
    const maxTicks = 14 + Math.floor(Math.random() * 8);

    const tick = () => {
      ticks += 1;
      setVibeIndex((i) => (i + 1) % moods.length);
      if (ticks >= maxTicks) {
        setVibeSpinning(false);
        setVibeIndex(Math.floor(Math.random() * moods.length));
        return;
      }
      vibeTimer.current = window.setTimeout(tick, 56 + ticks * 10);
    };
    tick();
  };

  const togglePin = (place: string) => {
    setPinnedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(place)) next.delete(place);
      else next.add(place);
      return next;
    });
    collectStamp("places");
  };

  const peelTopic = (topic: string) => {
    setPeeledTopics((prev) => new Set(prev).add(topic));
    collectStamp("topics");
  };

  const playVoice = () => {
    if (!summary.voice_notes || voicePlaying) return;
    collectStamp("voice");
    setVoicePlaying(true);
    setVoiceProgress(0);
    const len = summary.voice_notes.length;
    voiceTimer.current = window.setInterval(() => {
      setVoiceProgress((p) => {
        const next = p + Math.max(2, Math.floor(len / 80));
        if (next >= len) {
          if (voiceTimer.current) window.clearInterval(voiceTimer.current);
          setVoicePlaying(false);
          return len;
        }
        return next;
      });
    }, 24);
  };

  const selectBeat = (i: number) => {
    setActiveBeat(i);
    collectStamp("timeline");
  };

  const stationHasData = useMemo(
    () => ({
      vibe: moods.length > 0,
      places: places.length > 0,
      timeline: timeline.length > 0,
      topics: topics.length > 0,
      voice: hasVoice,
    }),
    [moods.length, places.length, timeline.length, topics.length, hasVoice],
  );

  return (
    <div className="journal-scrapbook insights-zine">
      <div className="journal-scrapbook-spine" aria-hidden />

      <div className="insights-zine-body pl-7 pr-5 py-6 sm:pl-9 sm:pr-8 sm:py-8">
        <span className="insights-zine-halftone" aria-hidden />
        <span className="washi-tape washi-tape-cyan insights-zine-tape" aria-hidden />

        <header className="insights-zine-header">
          <div className="insights-zine-intro">
            <p className="riso-eyebrow mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-riso-ink bg-riso-violet text-background">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              Mnemo decode lab
            </p>
            <h3 className="insights-zine-title font-display text-2xl sm:text-[1.85rem] text-riso-ink leading-[0.95] tracking-tight">
              Play the insight spread
            </h3>
            <p className="riso-lead mt-2 text-xs sm:text-sm">
              Five micro-stations · collect every stamp to decode the trip
            </p>
          </div>

          <div
            className="insights-zine-passport sticker-sm"
            aria-label={`${stampCount} of ${stampTotal} stamps collected`}
          >
            <span className="washi-tape washi-tape-pink insights-zine-passport-tape" aria-hidden />
            <div className="insights-zine-passport-row">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                Passport
              </span>
              <span className="font-display text-xl text-riso-ink tabular-nums leading-none">
                {stampCount}
                <span className="font-mono text-xs text-muted-foreground">/{stampTotal}</span>
              </span>
              {decoded && (
                <span className="insights-zine-decoded-pill font-mono">
                  <Sparkles className="h-3 w-3" />
                  Decoded
                </span>
              )}
            </div>
            <div className="insights-zine-passport-track">
              <span className="insights-zine-passport-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="insights-zine-stamps">
              {STATIONS.map((s, i) => (
                <span
                  key={s.stamp}
                  className={[
                    "insights-zine-stamp",
                    stamps.has(s.stamp) ? "insights-zine-stamp-done" : "",
                    !stationHasData[s.id] ? "insights-zine-stamp-muted" : "",
                  ].join(" ")}
                  title={s.label}
                >
                  <span className="font-mono text-[7px] leading-none opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Stamp className="h-3 w-3" />
                </span>
              ))}
            </div>
          </div>
        </header>

        <nav className="insights-zine-tabs relative z-10" role="tablist" aria-label="Insight stations">
          {STATIONS.map((s, i) => {
            const Icon = s.icon;
            const active = station === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStation(s.id)}
                className={[
                  "insights-zine-tab",
                  active ? "insights-zine-tab-active" : "",
                  stamps.has(s.stamp) ? "insights-zine-tab-stamped" : "",
                  !stationHasData[s.id] ? "insights-zine-tab-muted" : "",
                ].join(" ")}
              >
                <span className="font-mono text-[8px] tracking-widest opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="font-display text-[11px] uppercase tracking-wide">{s.short}</span>
              </button>
            );
          })}
        </nav>

        <div key={station} className="insights-zine-stage insights-zine-stage-enter" role="tabpanel">
          <p className="riso-label mb-4">
            Station · {activeMeta?.label ?? station}
          </p>

          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">
            {STATION_HINTS[station]}
          </p>

          {station === "vibe" && (
            moods.length > 0 ? (
              <InsightsVibeMeter
                moods={moods}
                activeIndex={vibeIndex}
                spinning={vibeSpinning}
                onSelect={(i) => {
                  setVibeIndex(i);
                  collectStamp("vibe");
                }}
                onPull={spinVibe}
              />
            ) : (
              <StationEmpty message={STATION_EMPTY.vibe} />
            )
          )}

          {station === "places" && (
            places.length > 0 ? (
              <InsightsPinBoard pinCount={pinnedPlaces.size} total={places.length}>
                {places.map((place, i) => (
                  <InsightsPlaceCard
                    key={place}
                    place={place}
                    pinned={pinnedPlaces.has(place)}
                    tilt={i % 2 ? "r" : "l"}
                    onToggle={() => togglePin(place)}
                  />
                ))}
              </InsightsPinBoard>
            ) : (
              <StationEmpty message={STATION_EMPTY.places} />
            )
          )}

          {station === "timeline" && (
            timeline.length > 0 ? (
              <>
                <InsightsFilmStrip activeIndex={activeBeat} total={timeline.length}>
                  {timeline.map((item, i) => (
                    <InsightsFilmFrame
                      key={`${item.date}-${i}`}
                      index={i}
                      date={item.date}
                      note={item.note}
                      active={i === activeBeat}
                      onSelect={() => selectBeat(i)}
                    />
                  ))}
                </InsightsFilmStrip>
                {timeline[activeBeat] && (
                  <div className="insights-timeline-spotlight">
                    <p className="insights-spotlight-meta font-mono">
                      Frame {activeBeat + 1} · {timeline[activeBeat].date}
                    </p>
                    <p className="insights-spotlight-copy font-hand">{timeline[activeBeat].note}</p>
                  </div>
                )}
              </>
            ) : (
              <StationEmpty message={STATION_EMPTY.timeline} />
            )
          )}

          {station === "topics" && (
            topics.length > 0 ? (
              <>
                <InsightsStickerPack peeledCount={peeledTopics.size}>
                  {topics.map((topic, i) => {
                    const colors: Array<"yellow" | "cyan" | "pink"> = ["yellow", "cyan", "pink"];
                    return (
                      <InsightsSticker
                        key={topic}
                        label={topic}
                        peeled={peeledTopics.has(topic)}
                        tilt={i % 3 === 0 ? "l" : i % 3 === 1 ? "r" : "none"}
                        color={colors[i % 3]}
                        onPeel={() => peelTopic(topic)}
                      />
                    );
                  })}
                </InsightsStickerPack>
                <InsightsPassportStrip topics={[...peeledTopics]} />
              </>
            ) : (
              <StationEmpty message={STATION_EMPTY.topics} />
            )
          )}

          {station === "voice" && (
            hasVoice ? (
              <>
                <div className="insights-cassette-deck">
                  <InsightsCassette playing={voicePlaying} />
                  <div className="insights-wave-bars" aria-hidden>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span
                        key={i}
                        className={voicePlaying ? "insights-wave-bar insights-wave-bar-live" : "insights-wave-bar"}
                        style={{ animationDelay: `${i * 0.04}s` }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={playVoice}
                    disabled={voicePlaying}
                    className="riso-btn-primary w-full"
                  >
                    {voicePlaying ? "Rolling…" : "▶ Play tape"}
                  </button>
                </div>
                <div className="insights-transcript insights-transcript-paper mt-4 rounded-xl border-2 border-riso-ink p-4">
                  <p className="font-mono text-sm leading-relaxed text-riso-ink min-h-[5rem]">
                    {voicePlaying || voiceProgress > 0
                      ? summary.voice_notes!.slice(0, voiceProgress)
                      : "Press play and your voice notes will type out here…"}
                    {voicePlaying && <span className="insights-caret">|</span>}
                  </p>
                </div>
              </>
            ) : (
              <StationEmpty message={STATION_EMPTY.voice} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
