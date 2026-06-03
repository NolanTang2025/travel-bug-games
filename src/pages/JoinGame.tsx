import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { PRINT_EDITIONS } from "@/data/printEditions";
import {
  buildJoinUrl,
  createRoom,
  getPlayerId,
  getRoom,
  joinRoom,
  leaveRoom,
  roomFromShareParams,
  saveRoom,
  startRoom,
  subscribeRooms,
  type GameRoom,
} from "@/lib/gameRoom";
import { toast } from "sonner";

type Mode = "home" | "host" | "join" | "lobby";

const GAME_OPTIONS = [
  ...PRINT_EDITIONS.map((e) => ({
    id: e.id,
    label: `Vol. ${e.n} · ${e.title}`,
    path: `/games/editions/${e.id}`,
  })),
  { id: "ai-create", label: "AI Create · paste photos", path: "/games/ai-create" },
];

const JoinGame = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("home");
  const [hostName, setHostName] = useState(() => sessionStorage.getItem("mnemo_display_name") ?? "");
  const [guestName, setGuestName] = useState("");
  const [joinCode, setJoinCode] = useState(() => searchParams.get("code")?.toUpperCase() ?? "");
  const [selectedGame, setSelectedGame] = useState(GAME_OPTIONS[0].id);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [copied, setCopied] = useState(false);

  const persistName = (name: string) => {
    sessionStorage.setItem("mnemo_display_name", name);
  };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setJoinCode(code.toUpperCase());
      const shared = roomFromShareParams(searchParams);
      if (shared) {
        setRoom(shared);
        setMode("join");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!room?.code) return;
    return subscribeRooms(() => {
      const updated = getRoom(room.code);
      if (updated) {
        setRoom(updated);
        if (updated.status === "playing") {
          navigate(`${updated.gamePath}?room=${updated.code}`);
        }
      }
    });
  }, [room?.code, navigate]);

  const handleCreate = () => {
    const name = hostName.trim();
    if (!name) {
      toast.error("Enter your name first");
      return;
    }
    const game = GAME_OPTIONS.find((g) => g.id === selectedGame)!;
    persistName(name);
    const created = createRoom({
      hostName: name,
      gameId: game.id,
      gameLabel: game.label,
      gamePath: game.path,
    });
    setRoom(created);
    setMode("lobby");
    toast.success("Room created — share the code");
  };

  const handleJoin = () => {
    const name = guestName.trim() || hostName.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name || code.length < 4) {
      toast.error("Name and room code required");
      return;
    }
    persistName(name);

    let joined = joinRoom(code, name);
    if (!joined) {
      const shared = roomFromShareParams(searchParams);
      if (shared && shared.code === code) {
        const playerId = getPlayerId();
        const players = shared.players.some((p) => p.id === playerId)
          ? shared.players.map((p) => (p.id === playerId ? { ...p, name } : p))
          : [...shared.players, { id: playerId, name, joinedAt: Date.now() }];
        joined = { ...shared, players };
        saveRoom(joined);
        setRoom(joined);
        setMode("lobby");
        toast.success("Joined via invite link");
        return;
      }
      toast.error("Room not found on this device. Open the invite link from your friend.");
      return;
    }
    setRoom(joined);
    setMode("lobby");
  };

  const handleStart = () => {
    if (!room) return;
    const playerId = getPlayerId();
    const isHost = room.players.some((p) => p.id === playerId && p.isHost);
    if (!isHost) {
      toast.error("Only the host can start");
      return;
    }
    const updated = startRoom(room.code);
    if (updated) {
      navigate(`${updated.gamePath}?room=${updated.code}`);
    }
  };

  const shareUrl = room
    ? buildJoinUrl(room.code, room.gameId, room.hostName, room.gameLabel)
    : "";
  const roomOnDevice = room ? !!getRoom(room.code) : false;

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room?.players.some((p) => p.id === getPlayerId() && p.isHost) ?? false;

  return (
    <section className="relative mx-auto w-full max-w-[720px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          ▚ Section · Join ▚
        </p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.9] text-riso-ink">
          Join <span className="text-riso-yellow">Game</span>
        </h1>
        <p className="mt-4 font-mono text-sm text-foreground/75 leading-relaxed">
          Host picks an edition, shares a 6-letter code or link. Friends join from the same browser
          or open the invite URL — no account needed.
        </p>
      </header>

      {mode === "home" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("host")}
            className="sticker bg-riso-yellow p-6 text-left rotate--1 hover:rotate-0 transition-transform"
          >
            <Users className="h-8 w-8 text-riso-ink mb-3" />
            <p className="font-display text-xl text-riso-ink">Host a room</p>
            <p className="font-mono text-xs text-foreground/70 mt-2">Create code · pick game</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="sticker bg-riso-cyan p-6 text-left rotate-1 hover:rotate-0 transition-transform"
          >
            <Play className="h-8 w-8 text-riso-ink mb-3" />
            <p className="font-display text-xl text-riso-ink">Enter code</p>
            <p className="font-mono text-xs text-foreground/70 mt-2">Join friend&apos;s lobby</p>
          </button>
        </div>
      )}

      {mode === "host" && (
        <div className="sticker diary-paper-plain p-6 sm:p-8 space-y-5">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Your name
            </span>
            <input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Yuki"
              className="mt-2 w-full rounded-lg border-2 border-riso-ink/20 bg-background px-4 py-3 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Game to play
            </span>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="mt-2 w-full rounded-lg border-2 border-riso-ink/20 bg-background px-4 py-3 font-mono text-sm"
            >
              {GAME_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreate}
              className="sticker inline-flex items-center gap-2 rounded-full bg-riso-ink text-background px-6 py-3 font-display uppercase tracking-wider text-sm"
            >
              Create room
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode("home")}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-4"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {mode === "join" && !room && (
        <div className="sticker diary-paper-plain p-6 sm:p-8 space-y-5">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Room code
            </span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="6 letters"
              className="mt-2 w-full rounded-lg border-2 border-riso-ink/20 bg-background px-4 py-3 font-display text-2xl tracking-[0.35em] uppercase"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Your name
            </span>
            <input
              value={guestName || hostName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Marcus"
              className="mt-2 w-full rounded-lg border-2 border-riso-ink/20 bg-background px-4 py-3 font-mono text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleJoin}
              className="sticker inline-flex items-center gap-2 rounded-full bg-riso-ink text-background px-6 py-3 font-display uppercase tracking-wider text-sm"
            >
              Join lobby
            </button>
            <button
              type="button"
              onClick={() => setMode("home")}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-4"
            >
              Back
            </button>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            Tip: If the code doesn&apos;t work, ask your friend to send the full invite link (works
            across phones).
          </p>
        </div>
      )}

      {mode === "lobby" && room && (
        <div className="sticker bg-background p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Room code
            </p>
            <p className="font-display text-5xl sm:text-6xl tracking-[0.2em] text-riso-ink">
              {room.code}
            </p>
            <p className="mt-3 font-mono text-sm text-foreground/75">{room.gameLabel}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={copyLink}
              className="sticker-sm inline-flex items-center justify-center gap-2 rounded-full bg-riso-yellow px-5 py-2.5 font-display uppercase text-xs tracking-wider text-riso-ink"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy invite link
            </button>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              In the lobby ({room.players.length})
            </p>
            <ul className="space-y-2">
              {room.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-riso-ink/15 px-4 py-2 font-mono text-sm"
                >
                  <span>{p.name}</span>
                  {p.isHost && (
                    <span className="text-[10px] uppercase tracking-widest text-riso-pink">Host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost && roomOnDevice ? (
            <button
              type="button"
              onClick={handleStart}
              className="sticker w-full inline-flex items-center justify-center gap-2 rounded-full bg-riso-pink text-background py-4 font-display uppercase tracking-wider"
            >
              <Play className="h-5 w-5" />
              Start game for everyone
            </button>
          ) : isHost ? (
            <Link
              to={`${room.gamePath}?room=${room.code}`}
              className="sticker w-full inline-flex items-center justify-center gap-2 rounded-full bg-riso-pink text-background py-4 font-display uppercase tracking-wider"
            >
              <Play className="h-5 w-5" />
              Open your game
            </Link>
          ) : roomOnDevice ? (
            <p className="text-center font-mono text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for host to start…
            </p>
          ) : (
            <Link
              to={`${room.gamePath}?room=${room.code}`}
              className="sticker w-full inline-flex items-center justify-center gap-2 rounded-full bg-riso-ink text-background py-4 font-display uppercase tracking-wider"
            >
              <Play className="h-5 w-5" />
              Open game (invite link)
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              leaveRoom(room.code);
              setRoom(null);
              setMode("home");
            }}
            className="w-full font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            Leave room
          </button>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/journal"
          className="font-mono text-xs uppercase tracking-widest text-riso-cyan hover:underline"
        >
          Read community journal →
        </Link>
        <Link
          to="/games/ai-create"
          className="font-mono text-xs uppercase tracking-widest text-riso-pink hover:underline inline-flex items-center gap-1"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Solo AI game →
        </Link>
      </div>
    </section>
  );
};

export default JoinGame;
