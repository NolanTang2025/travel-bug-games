import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";

type GameSpec = {
  title: string;
  tagline: string;
  mechanic: "catch" | "dodge"; // catch = collect targets, dodge = avoid them
  targetEmoji: string;
  obstacleEmoji: string;
  background: string; // tailwind/css gradient
  photo: string;
  duration: number; // seconds
};

const FALLBACK: GameSpec = {
  title: "Travel Memory",
  tagline: "Catch the moments!",
  mechanic: "catch",
  targetEmoji: "✨",
  obstacleEmoji: "💧",
  background: "linear-gradient(180deg, hsl(200 70% 60%), hsl(220 60% 30%))",
  photo: "",
  duration: 30,
};

type Item = { id: number; x: number; y: number; vy: number; isTarget: boolean };

const AIGamePlay = () => {
  const navigate = useNavigate();
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [phase, setPhase] = useState<"intro" | "play" | "over">("intro");
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<Item[]>([]);
  const idRef = useRef(0);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const raw = sessionStorage.getItem("ai_game");
    if (!raw) { navigate("/games/ai-create"); return; }
    try {
      const parsed = JSON.parse(raw);
      const s: GameSpec = {
        title: parsed.title || FALLBACK.title,
        tagline: parsed.tagline || FALLBACK.tagline,
        mechanic: parsed.mechanic === "dodge" ? "dodge" : "catch",
        targetEmoji: parsed.targetEmoji || FALLBACK.targetEmoji,
        obstacleEmoji: parsed.obstacleEmoji || FALLBACK.obstacleEmoji,
        background: parsed.background || FALLBACK.background,
        photo: parsed.photo || "",
        duration: Math.min(60, Math.max(15, Number(parsed.duration) || 30)),
      };
      setSpec(s);
      setTimeLeft(s.duration);
    } catch {
      navigate("/games/ai-create");
    }
  }, [navigate]);

  const start = () => {
    if (!spec) return;
    setScore(0);
    setMisses(0);
    setTimeLeft(spec.duration);
    setItems([]);
    setPhase("play");
  };

  const onHit = useCallback((item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (!spec) return;
    if (spec.mechanic === "catch") {
      if (item.isTarget) setScore((s) => s + 10);
      else setMisses((m) => m + 1);
    } else {
      // dodge: clicking is bad — but we let player tap to "block" obstacles for points
      if (!item.isTarget) setScore((s) => s + 10);
      else setMisses((m) => m + 1);
    }
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

      if (now - lastSpawn > 700) {
        lastSpawn = now;
        idRef.current += 1;
        const isTarget = Math.random() < 0.65;
        setItems((prev) => [
          ...prev,
          {
            id: idRef.current,
            x: 5 + Math.random() * 85,
            y: -10,
            vy: 0.06 + Math.random() * 0.05,
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
        if (missed) setMisses((m) => m + missed);
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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: spec.background }}>
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <Link to="/games/ai-create">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> New game
          </Button>
        </Link>
        {phase === "play" && (
          <div className="flex gap-2 text-sm font-bold text-white">
            <div className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">⏱ {timeLeft}s</div>
            <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">{score}</div>
            <div className="bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full">✗ {misses}</div>
          </div>
        )}
      </div>

      {phase === "intro" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center text-white">
          {spec.photo && (
            <img src={spec.photo} alt="" className="w-32 h-32 rounded-2xl object-cover shadow-card mb-6 border-4 border-white/30" />
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Generated</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-lg">{spec.title}</h1>
          <p className="text-lg max-w-md opacity-95 drop-shadow mb-2">{spec.tagline}</p>
          <p className="text-sm opacity-80 mb-8 max-w-sm">
            {spec.mechanic === "catch"
              ? `Tap the ${spec.targetEmoji} to score. Avoid the ${spec.obstacleEmoji}.`
              : `Tap the ${spec.obstacleEmoji} before it lands. Don't tap the ${spec.targetEmoji}!`}
          </p>
          <Button onClick={start} size="lg" className="bg-white text-foreground hover:bg-white/90 font-bold text-lg px-10 h-14 rounded-full shadow-glow">
            Play →
          </Button>
        </div>
      )}

      {(phase === "play" || phase === "over") && (
        <div className="relative w-full h-screen">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onHit(it)}
              className="absolute text-5xl select-none active:scale-90 transition-transform"
              style={{ left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {it.isTarget ? spec.targetEmoji : spec.obstacleEmoji}
            </button>
          ))}

          {phase === "over" && (
            <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur flex items-center justify-center p-6">
              <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-sm w-full text-center shadow-card">
                <h2 className="text-3xl font-black mb-1">Time!</h2>
                <p className="text-muted-foreground mb-6">{spec.title}</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">Score</div>
                    <div className="text-2xl font-black">{score}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <div className="text-xs uppercase text-muted-foreground">Misses</div>
                    <div className="text-2xl font-black">{misses}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={start} className="flex-1 gap-2"><RotateCcw className="h-4 w-4" /> Replay</Button>
                  <Link to="/games/ai-create" className="flex-1">
                    <Button variant="outline" className="w-full">New photo</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIGamePlay;
