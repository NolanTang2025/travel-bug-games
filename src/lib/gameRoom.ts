export type RoomPlayer = {
  id: string;
  name: string;
  joinedAt: number;
  isHost?: boolean;
};

export type GameRoom = {
  code: string;
  hostName: string;
  gameId: string;
  gameLabel: string;
  gamePath: string;
  createdAt: number;
  status: "open" | "playing";
  players: RoomPlayer[];
};

const ROOMS_KEY = "mnemo_game_rooms";
const PLAYER_KEY = "mnemo_player_id";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function readRooms(): Record<string, GameRoom> {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, GameRoom>;
  } catch {
    return {};
  }
}

function writeRooms(rooms: Record<string, GameRoom>) {
  const pruned = Object.fromEntries(
    Object.entries(rooms).filter(([, r]) => Date.now() - r.createdAt < 1000 * 60 * 60 * 12),
  );
  localStorage.setItem(ROOMS_KEY, JSON.stringify(pruned));
  window.dispatchEvent(new Event("mnemo-room-update"));
}

export function getPlayerId(): string {
  let id = sessionStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = `p-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  const rooms = readRooms();
  if (rooms[code]) return generateRoomCode();
  return code;
}

export function getRoom(code: string): GameRoom | undefined {
  return readRooms()[code.toUpperCase()];
}

export function saveRoom(room: GameRoom) {
  const rooms = readRooms();
  rooms[room.code] = room;
  writeRooms(rooms);
}

export function createRoom(input: {
  hostName: string;
  gameId: string;
  gameLabel: string;
  gamePath: string;
}): GameRoom {
  const code = generateRoomCode();
  const playerId = getPlayerId();
  const room: GameRoom = {
    code,
    hostName: input.hostName.trim(),
    gameId: input.gameId,
    gameLabel: input.gameLabel,
    gamePath: input.gamePath,
    createdAt: Date.now(),
    status: "open",
    players: [
      {
        id: playerId,
        name: input.hostName.trim(),
        joinedAt: Date.now(),
        isHost: true,
      },
    ],
  };
  saveRoom(room);
  return room;
}

export function joinRoom(code: string, playerName: string): GameRoom | null {
  const room = getRoom(code);
  if (!room || room.status !== "open") return null;

  const playerId = getPlayerId();
  const name = playerName.trim();
  if (!name) return null;

  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.name = name;
  } else {
    room.players.push({ id: playerId, name, joinedAt: Date.now() });
  }
  saveRoom(room);
  return room;
}

export function startRoom(code: string): GameRoom | null {
  const room = getRoom(code);
  if (!room) return null;
  room.status = "playing";
  saveRoom(room);
  return room;
}

export function leaveRoom(code: string) {
  const rooms = readRooms();
  const playerId = getPlayerId();
  const room = rooms[code.toUpperCase()];
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.players.length === 0) {
    delete rooms[room.code];
  } else {
    rooms[room.code] = room;
  }
  writeRooms(rooms);
}

export function buildJoinUrl(
  code: string,
  gameId: string,
  hostName: string,
  gameLabel?: string,
): string {
  const params = new URLSearchParams({
    code,
    game: gameId,
    host: hostName,
  });
  if (gameLabel) params.set("label", gameLabel);
  return `${window.location.origin}/games/join?${params.toString()}`;
}

/** Guest on another device: room payload travels in the URL */
export function roomFromShareParams(params: URLSearchParams): GameRoom | null {
  const code = params.get("code")?.toUpperCase();
  const gameId = params.get("game");
  const hostName = params.get("host") ?? "Host";
  if (!code || !gameId) return null;

  const local = getRoom(code);
  if (local) return local;

  const editionPath = gameId === "ai-create" ? "/games/ai-create" : `/games/editions/${gameId}`;
  return {
    code,
    hostName,
    gameId,
    gameLabel: params.get("label") ?? gameId.replace(/-/g, " "),
    gamePath: editionPath,
    createdAt: Date.now(),
    status: "open",
    players: [{ id: "host-remote", name: hostName, joinedAt: Date.now(), isHost: true }],
  };
}

export function subscribeRooms(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ROOMS_KEY) onChange();
  };
  const onLocal = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("mnemo-room-update", onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("mnemo-room-update", onLocal);
  };
}
