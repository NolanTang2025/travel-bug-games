import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Bug, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useGameEmbedFlags } from "@/lib/embedMode";

const DEFAULT_EMBED_FACE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#f4c542" width="100" height="100"/><text x="50" y="58" font-size="48" text-anchor="middle">😈</text></svg>`,
  );

type Lane = 0 | 1 | 2;
type Entity = {
  id: number;
  lane: Lane;
  z: number; // 0 (far) -> 1 (player)
  type: "bug" | "rock" | "bamboo";
  variant: number;
};

const LANE_X = [-1, 0, 1]; // visual offset multiplier
const SPAWN_INTERVAL = 650; // ms
const BASE_SPEED = 0.012; // z per frame
const BUG_FOREST_SPRITES = {
  beetle: "/editions/sprites/bug-forest/beetle.svg",
  rock: "/editions/sprites/bug-forest/rock.svg",
} as const;

const BugGame = () => {
  const location = useLocation();
  const { embed, immersive } = useGameEmbedFlags(location.search);
  const autoStartedRef = useRef(false);
  const [face, setFace] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bugsEaten, setBugsEaten] = useState(0);
  const [lane, setLane] = useState<Lane>(1);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("bugforest_high") || 0));

  const laneRef = useRef<Lane>(1);
  const playingRef = useRef(false);
  const speedRef = useRef(BASE_SPEED);
  const idRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setFace(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startGame = useCallback(() => {
    if (!face) {
      toast.error("Upload a face first 👹");
      return;
    }
    setScore(0);
    setBugsEaten(0);
    setLane(1);
    setEntities([]);
    setGameOver(false);
    setPlaying(true);
    speedRef.current = BASE_SPEED;
    lastSpawnRef.current = performance.now();
  }, [face]);

  useEffect(() => {
    if (!immersive || autoStartedRef.current) return;
    const readyFace = face ?? DEFAULT_EMBED_FACE;
    if (!face) setFace(readyFace);
    autoStartedRef.current = true;
    setScore(0);
    setBugsEaten(0);
    setLane(1);
    setEntities([]);
    setGameOver(false);
    setPlaying(true);
    speedRef.current = BASE_SPEED;
    lastSpawnRef.current = performance.now();
  }, [immersive, face]);

  const endGame = useCallback(() => {
    setPlaying(false);
    setGameOver(true);
    setHighScore((prev) => {
      const next = Math.max(prev, score);
      localStorage.setItem("bugforest_high", String(next));
      return next;
    });
  }, [score]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!playingRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a") setLane((l) => (Math.max(0, l - 1) as Lane));
      if (e.key === "ArrowRight" || e.key === "d") setLane((l) => (Math.min(2, l + 1) as Lane));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 30) {
      if (dx < 0) setLane((l) => (Math.max(0, l - 1) as Lane));
      else setLane((l) => (Math.min(2, l + 1) as Lane));
    }
    touchStartX.current = null;
  };

  // Game loop
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      // Spawn
      if (now - lastSpawnRef.current > SPAWN_INTERVAL) {
        lastSpawnRef.current = now;
        const types: Entity["type"][] = ["bug", "bug", "bug", "rock", "bamboo"];
        const type = types[Math.floor(Math.random() * types.length)];
        const newLane = Math.floor(Math.random() * 3) as Lane;
        idRef.current += 1;
        setEntities((prev) => [
          ...prev,
          { id: idRef.current, lane: newLane, z: 0, type, variant: Math.floor(Math.random() * 4) },
        ]);
      }

      // Advance entities + collision
      setEntities((prev) => {
        const next: Entity[] = [];
        let died = false;
        let ate = 0;
        let dodgePoints = 0;
        for (const e of prev) {
          const z = e.z + speedRef.current * (dt / 16.67);
          if (z >= 0.95 && z <= 1.05) {
            if (e.lane === laneRef.current) {
              if (e.type === "bug") { ate += 1; continue; }
              else { died = true; }
            }
          }
          if (z > 1.15) {
            if (e.type !== "bug") dodgePoints += 5;
            continue;
          }
          next.push({ ...e, z });
        }
        if (ate) {
          setBugsEaten((b) => b + ate);
          setScore((s) => s + ate * 10);
        }
        if (dodgePoints) setScore((s) => s + dodgePoints);
        if (died) {
          setTimeout(endGame, 0);
        }
        return next;
      });

      // Speed up
      speedRef.current = Math.min(0.035, speedRef.current + 0.0000035 * dt);
      setScore((s) => s + dt * 0.005);

      if (playingRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, endGame]);

  return (
    <div className="min-h-[100dvh] bg-gradient-forest text-primary-foreground overflow-hidden">
      {/* Top bar */}
      {!embed && (
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          {(playing || gameOver) && (
            <div className="flex gap-3 text-sm font-bold">
              <div className="bg-background/20 backdrop-blur px-3 py-1.5 rounded-full">
                🐛 {bugsEaten}
              </div>
              <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">
                {Math.floor(score)}
              </div>
            </div>
          )}
        </div>
      )}

      {embed && (playing || gameOver) && (
        <div className="absolute top-0 right-0 z-30 p-3 flex gap-2 text-sm font-bold pointer-events-none">
          <div className="bg-background/20 backdrop-blur px-3 py-1.5 rounded-full">
            🐛 {bugsEaten}
          </div>
          <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">
            {Math.floor(score)}
          </div>
        </div>
      )}

      {!playing && !gameOver && !immersive && (
        <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8 max-w-md">
            <Bug className="h-16 w-16 mx-auto mb-4 text-bug animate-wiggle" />
            <h1 className="text-4xl md:text-5xl font-black mb-3">Bamboo Trail Bug Bite</h1>
            <p className="text-primary-foreground/80">
              Upload the face of someone you'd love to send through a bamboo forest full of bugs. Run forward, dodge rocks & bamboo, devour every bug.
            </p>
          </div>

          <label className="cursor-pointer group">
            <div className="w-40 h-40 rounded-full border-4 border-dashed border-primary-foreground/40 group-hover:border-accent transition-colors flex items-center justify-center overflow-hidden bg-background/10 backdrop-blur">
              {face ? (
                <img src={face} alt="Victim" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-xs font-semibold">Upload face</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>

          <Button
            onClick={startGame}
            size="lg"
            className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg px-10 h-14 rounded-full shadow-glow"
          >
            Start Running →
          </Button>

          <p className="mt-6 text-xs text-primary-foreground/60 text-center">
            ← → arrow keys or swipe to switch lanes
          </p>
        </div>
      )}

      {/* Game scene */}
      {(playing || gameOver) && (
        <div
          className="relative w-full h-screen perspective-1000 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(120_50%_55%)] via-[hsl(130_45%_35%)] to-[hsl(140_50%_18%)]" />

          {/* Ground with perspective lines */}
          <Path />

          {/* Bamboo forest sides */}
          <ForestSides />

          {/* Entities */}
          {entities.map((e) => (
            <EntitySprite key={e.id} entity={e} />
          ))}

          {/* Player */}
          <Player face={face ?? DEFAULT_EMBED_FACE} lane={lane} />

          {gameOver && (
            <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur flex items-center justify-center p-6">
              <div className="bg-card text-card-foreground rounded-3xl p-8 max-w-sm w-full text-center shadow-card">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-accent" />
                <h2 className="text-3xl font-black mb-1">Game Over</h2>
                <p className="text-muted-foreground mb-6">A rock got them. Tragic.</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Stat label="Score" value={Math.floor(score)} />
                  <Stat label="Bugs eaten" value={bugsEaten} />
                  <Stat label="Best" value={Math.floor(highScore)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={startGame} className="flex-1 bg-primary hover:bg-primary/90">
                    Run again
                  </Button>
                  <Link to="/" className="flex-1">
                    <Button variant="outline" className="w-full">Home</Button>
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

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-muted rounded-xl p-3">
    <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className="text-xl font-black text-foreground">{value}</div>
  </div>
);

const Path = () => (
  <div className="absolute inset-0">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(140 50% 25%)" />
          <stop offset="100%" stopColor="hsl(30 40% 20%)" />
        </linearGradient>
      </defs>
      <polygon points="35,50 65,50 100,100 0,100" fill="url(#ground)" />
      {/* Lane lines */}
      <line x1="45" y1="50" x2="33" y2="100" stroke="hsl(30 30% 35%)" strokeWidth="0.4" strokeDasharray="2 1.5" />
      <line x1="55" y1="50" x2="67" y2="100" stroke="hsl(30 30% 35%)" strokeWidth="0.4" strokeDasharray="2 1.5" />
    </svg>
  </div>
);

const ForestSides = () => (
  <>
    <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-[hsl(100_45%_15%)] to-transparent pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-[hsl(100_45%_15%)] to-transparent pointer-events-none" />
    {/* Stylized bamboo silhouettes */}
    {[10, 18, 4, 86, 92, 78].map((left, i) => (
      <div
        key={i}
        className="absolute bottom-0 w-2 bg-bamboo-dark"
        style={{ left: `${left}%`, height: `${50 + (i % 3) * 10}%`, opacity: 0.7 }}
      />
    ))}
  </>
);

const EntitySprite = ({ entity }: { entity: Entity }) => {
  const { lane, z, type } = entity;
  // Perspective: at z=0 small/centered, at z=1 large/spread
  const scale = 0.15 + z * z * 1.2;
  const laneOffset = LANE_X[lane] * z * 28; // % from center
  const top = 50 + z * z * 50; // vertical position

  if (top > 110) return null;

  let content;
  if (type === "bug") {
    content = (
      <img
        src={BUG_FOREST_SPRITES.beetle}
        alt=""
        className="edition-sprite-img edition-sprite-target h-[60px] w-[60px] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
        draggable={false}
      />
    );
  } else if (type === "rock") {
    content = (
      <img
        src={BUG_FOREST_SPRITES.rock}
        alt=""
        className="edition-sprite-img edition-sprite-obstacle h-[60px] w-[72px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
        draggable={false}
      />
    );
  } else {
    content = (
      <div className="bg-bamboo-dark rounded-full" style={{ width: 18, height: 140, boxShadow: "inset -4px 0 0 rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.4)" }} />
    );
  }

  return (
    <div
      className="absolute left-1/2 z-10"
      style={{
        top: `${top}%`,
        transform: `translateX(calc(-50% + ${laneOffset}vw)) scale(${scale})`,
        opacity: Math.min(1, z * 3),
        transition: "none",
      }}
    >
      {content}
    </div>
  );
};

const Player = ({ face, lane }: { face: string; lane: Lane }) => {
  const offset = LANE_X[lane] * 22;
  return (
    <div
      className="absolute bottom-[8%] left-1/2 z-20 transition-transform duration-150"
      style={{ transform: `translateX(calc(-50% + ${offset}vw))` }}
    >
      <div className="relative animate-float">
        {/* Mouth shadow giving "eating" vibe */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent shadow-glow" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
          <img src={face} alt="" className="w-full h-full object-cover" />
        </div>
        {/* Open mouth indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-6 bg-destructive rounded-b-full border-2 border-background opacity-80" />
        {/* Body shadow */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/40 blur-md rounded-full" />
      </div>
    </div>
  );
};

export default BugGame;
