import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Copy, Loader2, RotateCcw, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { translationsAll } from "@/i18n/translations";
import { buildGameHandoffSnapshot, createHandoffCode } from "@/lib/handoff";
import type { GameSpec } from "@/gamekit/gameSpec";
import { loadGameSpecFromSessionString } from "@/gamekit/loadSessionGameSpec";
import { RunnerTemplate } from "@/components/aiGame/RunnerTemplate";
import { PhotoTapTemplate } from "@/components/aiGame/PhotoTapTemplate";
import { beep, clamp, isPhoneUa, shuffle, vibrate } from "@/lib/gameFx";
import RecordBootSequence from "@/components/RecordBootSequence";

type Item = { id: number; x: number; y: number; vy: number; isTarget: boolean };
type FX = {
  id: number;
  x: number;
  y: number;
  text: string;
  variant: "good" | "bad";
};
type Burst = {
  id: number;
  x: number;
  y: number;
  variant: "good" | "bad";
};

// ---- Template: Memory match -------------------------------------------------
type Card = { id: number; key: string; face: string; matched: boolean };

function MemoryTemplate({
  spec,
  howto,
  onBack,
}: {
  spec: GameSpec;
  howto: string;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "play" | "over">("intro");
  const [timeLeft, setTimeLeft] = useState(spec.duration);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [openIds, setOpenIds] = useState<number[]>([]);

  const photos = (spec.photos?.filter((p) => typeof p === "string" && p.startsWith("data:image")) ?? [])
    .slice(0, 8);
  const pairsWanted = clamp(Number(spec.params?.memory?.pairs || 8), 4, 10);
  const pairCount = Math.max(4, Math.min(pairsWanted, photos.length || pairsWanted));

  const faces: { key: string; face: string }[] =
    photos.length >= 4
      ? photos.slice(0, pairCount).map((p, i) => ({ key: `p${i}`, face: p }))
      : shuffle([spec.targetEmoji, spec.obstacleEmoji, "🌤️", "🧳", "📷", "🍜", "🗺️", "🌊", "🏔️", "🎫"]).slice(0, pairCount)
          .map((e, i) => ({ key: `e${i}`, face: e }));

  const start = () => {
    let id = 0;
    const cards: Card[] = faces.flatMap((f) => ([
      { id: ++id, key: f.key, face: f.face, matched: false },
      { id: ++id, key: f.key, face: f.face, matched: false },
    ]));
    setDeck(shuffle(cards));
    setOpenIds([]);
    setTurns(0);
    setScore(0);
    setTimeLeft(spec.duration);
    setPhase("play");
  };

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const remaining = deck.filter((c) => !c.matched).length;
    if (deck.length && remaining === 0) setPhase("over");
  }, [deck, phase]);

  const onFlip = (card: Card) => {
    if (phase !== "play") return;
    if (card.matched) return;
    if (openIds.includes(card.id)) return;
    if (openIds.length >= 2) return;

    const nextOpen = [...openIds, card.id];
    setOpenIds(nextOpen);
    if (nextOpen.length === 2) {
      setTurns((t) => t + 1);
      const a = deck.find((c) => c.id === nextOpen[0]);
      const b = deck.find((c) => c.id === nextOpen[1]);
      if (a && b && a.key === b.key) {
        // reward quicker matches
        const bonus = Math.max(10, 40 - turns * 2);
        setScore((s) => s + bonus);
        setDeck((prev) => prev.map((c) => (c.key === a.key ? { ...c, matched: true } : c)));
        setTimeout(() => setOpenIds([]), 280);
      } else {
        setTimeout(() => setOpenIds([]), 700);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: spec.background }}>
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <button onClick={onBack} className="text-white/90 font-bold text-sm bg-black/30 px-3 py-2 rounded-full">
          ← {spec.ui.newGame}
        </button>
        {phase === "play" && (
          <div className="flex gap-2 text-sm font-bold text-white">
            <div className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">⏱ {timeLeft}s</div>
            <div className="bg-white/15 px-3 py-1.5 rounded-full">Turns {turns}</div>
            <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{score}</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur mb-3">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{spec.ui.generatedBadge}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg font-display">{spec.title}</h1>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2">{spec.tagline}</p>
          <p className="text-sm opacity-85 mb-8 max-w-sm">{howto}</p>
          <Button onClick={start} size="lg" className="bg-white text-foreground hover:bg-white/90 font-bold text-lg px-10 h-14 rounded-full shadow-glow font-display">
            {spec.ui.play}
          </Button>
        </div>
      )}

      {(phase === "play" || phase === "over") && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 w-full max-w-xl">
            {deck.map((c) => {
              const open = openIds.includes(c.id) || c.matched;
              return (
                <button
                  key={c.id}
                  onClick={() => onFlip(c)}
                  className={`relative aspect-square rounded-2xl border overflow-hidden shadow-card transition-transform active:scale-[0.99] ${
                    c.matched ? "border-white/30 bg-white/15" : "border-white/20 bg-black/20"
                  }`}
                >
                  {open ? (
                    typeof c.face === "string" && c.face.startsWith("data:image") ? (
                      <img src={c.face} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl">{c.face}</span>
                    )
                  ) : (
                    <span className="text-3xl opacity-90 font-black text-white/90">◇</span>
                  )}
                  {c.matched && <div className="absolute inset-0 bg-black/20" />}
                </button>
              );
            })}
          </div>

          {phase === "over" && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur flex items-center justify-center p-6">
              <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-sm w-full text-center shadow-card">
                <h2 className="text-3xl font-black mb-1 font-display">{spec.ui.timeUp}</h2>
                <p className="text-muted-foreground mb-6">{spec.title}</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">{spec.ui.score}</div>
                    <div className="text-2xl font-black">{score}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">Turns</div>
                    <div className="text-2xl font-black">{turns}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={start} className="flex-1 gap-2"><RotateCcw className="h-4 w-4" /> {spec.ui.replay}</Button>
                  <Link to="/games/ai-create" className="flex-1">
                    <Button variant="outline" className="w-full">{spec.ui.newPhoto}</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AIGamePlay = () => {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [phase, setPhase] = useState<"boot" | "intro" | "play" | "over">("boot");
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<Item[]>([]);
  const [fx, setFx] = useState<FX[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [screenFlash, setScreenFlash] = useState<null | "good" | "bad">(null);
  const idRef = useRef(0);
  const fxIdRef = useRef(0);
  const phaseRef = useRef(phase);
  const [qrOpen, setQrOpen] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const speedRef = useRef(1);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const openPhoneQr = useCallback(async () => {
    setHandoffBusy(true);
    try {
      const snap = await buildGameHandoffSnapshot();
      const code = await createHandoffCode(snap);
      const url = `${window.location.origin}/games/join?code=${encodeURIComponent(code)}`;
      setJoinUrl(url);
      setQrOpen(true);
    } catch (e) {
      console.error(e);
      toast.error(t("qrHandoffFail"));
    } finally {
      setHandoffBusy(false);
    }
  }, [t]);

  const copyJoinLink = useCallback(() => {
    if (!joinUrl) return;
    void navigator.clipboard.writeText(joinUrl);
    toast.success(t("copied"));
  }, [joinUrl, t]);

  useEffect(() => {
    const raw = sessionStorage.getItem("ai_game");
    if (!raw) {
      navigate("/games/ai-create");
      return;
    }
    const s = loadGameSpecFromSessionString(raw);
    if (!s) {
      navigate("/games/ai-create");
      return;
    }
    setSpec(s);
    setTimeLeft(s.duration);
  }, [navigate]);

  const handleBootComplete = useCallback(() => {
    setPhase("intro");
  }, []);

  const start = () => {
    if (!spec) return;
    setScore(0);
    setMisses(0);
    setTimeLeft(spec.duration);
    setItems([]);
    setFx([]);
    setBursts([]);
    setCombo(0);
    setLives(3);
    setLastEvent(null);
    speedRef.current = 1;
    setPhase("play");
  };

  const onHit = useCallback((item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (!spec) return;
    const isGood =
      spec.mechanic === "catch" ? item.isTarget : !item.isTarget;
    const multNext = isGood ? Math.min(6, Math.floor((combo + 1) / 5) + 1) : 1;
    const base = 10;
    const points = isGood ? base * multNext : -8;
    if (isGood) {
      setScore((s) => s + points);
      setCombo((c) => c + 1);
      setLastEvent(`+${points}${multNext > 1 ? `  x${multNext}` : ""}`);
      beep("good");
    } else {
      setScore((s) => Math.max(0, s + points));
      setMisses((m) => m + 1);
      setCombo(0);
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) setPhase("over");
        return next;
      });
      setLastEvent(`${points}  ✗`);
      setShake(true);
      setTimeout(() => setShake(false), 240);
      beep("bad");
    }

    // FX: float text + burst + screen flash
    fxIdRef.current += 1;
    const fxId = fxIdRef.current;
    setFx((prev) => [
      ...prev,
      {
        id: fxId,
        x: item.x,
        y: clamp(item.y, 5, 95),
        text: isGood ? `+${points}` : `${points}`,
        variant: isGood ? "good" : "bad",
      },
    ]);
    setBursts((prev) => [
      ...prev,
      { id: fxId, x: item.x, y: clamp(item.y, 5, 95), variant: isGood ? "good" : "bad" },
    ]);
    setScreenFlash(isGood ? "good" : "bad");
    setTimeout(() => setScreenFlash(null), 120);
    setTimeout(() => {
      setFx((prev) => prev.filter((f) => f.id !== fxId));
      setBursts((prev) => prev.filter((b) => b.id !== fxId));
    }, 700);
    vibrate(isGood ? 15 : 45);

  }, [spec]);

  // Spawn + fall loop
  useEffect(() => {
    if (phase !== "play" || !spec) return;
    let last = performance.now();
    let lastSpawn = 0;
    let raf = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Difficulty ramps up over time
      speedRef.current = Math.min(1.9, speedRef.current + dt * 0.00002);
      const spawnEvery = 700 / speedRef.current;

      if (now - lastSpawn > spawnEvery) {
        lastSpawn = now;
        idRef.current += 1;
        const isTarget = Math.random() < (spec.mechanic === "catch" ? 0.72 : 0.58);
        setItems((prev) => [
          ...prev,
          {
            id: idRef.current,
            x: 5 + Math.random() * 85,
            y: -10,
            vy: (0.055 + Math.random() * 0.06) * speedRef.current,
            isTarget,
          },
        ]);
      }

      setItems((prev) => {
        const next: Item[] = [];
        let missed = 0;
        for (const it of prev) {
          const y = it.y + it.vy * dt;
          if (y > 105) {
            // Missed: in catch mode missing target = bad; in dodge mode obstacle reaching ground = bad
            if (spec.mechanic === "catch" && it.isTarget) missed += 1;
            if (spec.mechanic === "dodge" && !it.isTarget) missed += 1;
            continue;
          }
          next.push({ ...it, y });
        }
        if (missed) {
          setMisses((m) => m + missed);
          setCombo(0);
          setLives((l) => {
            const nextLives = l - missed;
            if (nextLives <= 0) setPhase("over");
            return nextLives;
          });
          setScreenFlash("bad");
          setTimeout(() => setScreenFlash(null), 140);
          setShake(true);
          setTimeout(() => setShake(false), 240);
          setLastEvent(`-${missed} life`);
          beep("bad");
          vibrate(60);
        }
        return next;
      });

      if (phaseRef.current === "play") raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, spec]);

  // Countdown
  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setPhase("over"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  if (!spec) return null;

  // “How to play” should follow the language the user used in the journal input,
  // which can differ from current IP location and from the travel destination language.
  const howtoLocale = spec.journalTextLocale || locale;
  const howtoPack = translationsAll[howtoLocale] ?? translationsAll.en;
  const templateId = spec.templateId || "falling";
  const howtoKey =
    templateId === "memory"
      ? "howtoMemory"
      : templateId === "photoTap"
        ? "howtoPhotoTap"
        : templateId === "runner"
          ? "howtoRunner"
          : spec.mechanic === "catch"
            ? "howtoCatch"
            : "howtoDodge";
  const uiHowTo = String((howtoPack as any)[howtoKey] ?? howtoPack.howtoCatch)
    .replace("{{target}}", spec.targetEmoji)
    .replace("{{obstacle}}", spec.obstacleEmoji);

  if (templateId === "memory") {
    return (
      <MemoryTemplate
        spec={spec}
        howto={uiHowTo}
        onBack={() => navigate("/games/ai-create")}
      />
    );
  }

  if (templateId === "runner") {
    return (
      <RunnerTemplate
        spec={spec}
        howto={uiHowTo}
        onBack={() => navigate("/games/ai-create")}
      />
    );
  }

  if (templateId === "photoTap") {
    return (
      <PhotoTapTemplate
        spec={spec}
        howto={uiHowTo}
        onBack={() => navigate("/games/ai-create")}
      />
    );
  }

  const lang = spec.locale || "en";
  const rtl = /^(ar|he)(-|$)/i.test(lang);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: spec.background }}
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Record Boot Sequence */}
      {phase === "boot" && (
        <RecordBootSequence
          coverPhoto={spec.photo || null}
          emoji={spec.targetEmoji}
          labelBg={spec.background}
          title={spec.title}
          onComplete={handleBootComplete}
        />
      )}

      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <Link to="/games/ai-create">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {spec.ui.newGame}
          </Button>
        </Link>
        {phase === "play" && (
          <div className="flex gap-2 text-sm font-bold text-white">
            <div className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">⏱ {timeLeft}s</div>
            <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{score}</div>
            <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full">✗ {misses}</div>
            <div className="bg-white/15 text-white px-3 py-1.5 rounded-full">❤ {Math.max(0, lives)}</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white">
          {spec.photo && (
            <img src={spec.photo} alt="" className="w-32 h-32 rounded-2xl object-cover shadow-card mb-6 border-4 border-white/30" />
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur mb-3">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">{spec.ui.generatedBadge}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg font-display">{spec.title}</h1>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2">{spec.tagline}</p>
          <p className="text-sm opacity-85 mb-8 max-w-sm">{uiHowTo}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center items-stretch">
            <Button
              onClick={start}
              size="lg"
              className="bg-white text-foreground hover:bg-white/90 font-bold text-lg px-10 h-14 rounded-full shadow-glow font-display"
            >
              {spec.ui.play}
            </Button>
            {!isPhoneUa() && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="font-bold h-14 rounded-full border border-white/40 bg-white/15 text-white hover:bg-white/25 gap-2"
                onClick={() => void openPhoneQr()}
                disabled={handoffBusy}
              >
                {handoffBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
                {t("qrTitle")}
              </Button>
            )}
          </div>
        </div>
      )}

      {(phase === "play" || phase === "over") && (
        <div
          className="relative w-full h-screen"
          style={{
            transform: shake ? "translate3d(-2px, 0, 0)" : undefined,
            transition: shake ? "transform 60ms linear" : undefined,
          }}
        >
          {phase === "play" && (combo >= 5 || lastEvent) && (
            <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 pointer-events-none">
              <div className="rounded-full bg-black/40 backdrop-blur px-4 py-2 text-white text-sm font-black shadow-card">
                {combo >= 5 ? `COMBO ${combo}` : lastEvent}
              </div>
            </div>
          )}
          {screenFlash && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background:
                  screenFlash === "good"
                    ? "radial-gradient(circle at center, rgba(255,255,255,0.22), rgba(255,255,255,0) 62%)"
                    : "radial-gradient(circle at center, rgba(255,0,0,0.24), rgba(255,0,0,0) 62%)",
              }}
            />
          )}
          {phase === "play" && !isPhoneUa() && (
            <button
              type="button"
              onClick={() => void openPhoneQr()}
              disabled={handoffBusy}
              className="fixed bottom-6 right-5 z-50 flex h-12 items-center gap-2 rounded-full bg-black/50 px-4 text-sm font-bold text-white backdrop-blur-md border border-white/20 hover:bg-black/60 touch-manipulation"
            >
              {handoffBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              {t("qrTitle")}
            </button>
          )}

          {/* Click feedback FX */}
          {bursts.map((b) => (
            <div
              key={`burst-${b.id}`}
              className="absolute z-10 pointer-events-none"
              style={{ left: `${b.x}%`, top: `${b.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {[...Array(10)].map((_, i) => {
                const ang = (i / 10) * Math.PI * 2;
                const dist = 22 + (i % 3) * 10;
                const dx = Math.cos(ang) * dist;
                const dy = Math.sin(ang) * dist;
                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: b.variant === "good" ? "rgba(255,255,255,0.95)" : "rgba(255,80,80,0.95)",
                      transform: `translate(${dx}px, ${dy}px) scale(0.6)`,
                      opacity: 0,
                      animation: "fx-pop 650ms ease-out forwards",
                      animationDelay: `${i * 12}ms`,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                    }}
                  />
                );
              })}
            </div>
          ))}
          {fx.map((f) => (
            <div
              key={`fx-${f.id}`}
              className="absolute z-10 pointer-events-none font-black"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: "translate(-50%, -50%)",
                color: f.variant === "good" ? "rgba(255,255,255,0.98)" : "rgba(255,120,120,0.98)",
                textShadow: "0 8px 18px rgba(0,0,0,0.55)",
                animation: "fx-float 700ms ease-out forwards",
              }}
            >
              {f.text}
            </div>
          ))}

          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onHit(it)}
              className="absolute text-5xl select-none active:scale-90 transition-transform hover:scale-[1.06] drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
              style={{ left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {it.isTarget ? spec.targetEmoji : spec.obstacleEmoji}
            </button>
          ))}

          {phase === "over" && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur flex items-center justify-center p-6">
              <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-sm w-full text-center shadow-card">
                <h2 className="text-3xl font-black mb-1 font-display">{spec.ui.timeUp}</h2>
                <p className="text-muted-foreground mb-6">{spec.title}</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">{spec.ui.score}</div>
                    <div className="text-2xl font-black">{score}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">{spec.ui.misses}</div>
                    <div className="text-2xl font-black">{misses}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={start} className="flex-1 gap-2">
                    <RotateCcw className="h-4 w-4 shrink-0" /> {spec.ui.replay}
                  </Button>
                  <Link to="/games/ai-create" className="flex-1">
                    <Button variant="outline" className="w-full">{spec.ui.newPhoto}</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>{t("qrTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("qrHint")}</p>
          {joinUrl && (
            <>
              <div className="flex justify-center rounded-2xl bg-white p-4">
                <QRCodeSVG value={joinUrl} size={200} level="M" marginSize={2} />
              </div>
              <p className="text-xs text-muted-foreground text-center font-mono break-all">{joinUrl}</p>
              <Button type="button" variant="secondary" className="w-full gap-2" onClick={copyJoinLink}>
                <Copy className="h-4 w-4" />
                {t("qrCopyLink")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fx-float {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(4px) scale(0.92); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-28px) scale(1.06); }
        }
        @keyframes fx-pop {
          0% { opacity: 0; transform: translate(0,0) scale(0.2); filter: blur(0px); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(0,0) scale(1); filter: blur(0.2px); }
        }
      `}</style>
    </div>
  );
};

export default AIGamePlay;
