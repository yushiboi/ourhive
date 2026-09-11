import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, type WebSocket } from "ws";
import type { ClientMessage, PuzzleMode, ServerMessage } from "../shared/types.ts";
import { store, words } from "./boot.ts";
import { normalizeCode, sanitizeName, type Room } from "./rooms.ts";

type HiveSocket = WebSocket & {
  playerId?: string;
  roomCode?: string;
  isAlive?: boolean;
};

const PORT = Number(process.env.PORT ?? (process.env.NODE_ENV === "production" ? 4317 : 4318));
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, words: words.length });
});

app.post("/api/rooms", async (req, res) => {
  try {
    const mode: PuzzleMode = req.body?.mode === "daily" ? "daily" : "fresh";
    const room = await store.create({
      mode,
      timeZone: typeof req.body?.timeZone === "string" ? req.body.timeZone : "UTC",
    });
    res.json({
      code: room.code,
      mode: room.puzzle.mode,
      dateKey: room.puzzle.dateKey,
      url: `/r/${room.code}`,
    });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Could not create a hive" });
  }
});

app.get("/api/rooms/:code", (req, res) => {
  const room = store.get(String(req.params.code));
  if (!room) {
    res.status(404).json({ exists: false });
    return;
  }
  res.json({
    exists: true,
    code: room.code,
    mode: room.puzzle.mode,
    dateKey: room.puzzle.dateKey,
    players: room.publicPlayers().filter((player) => player.connected).length,
    wordCount: room.puzzle.answers.size,
  });
});

if (isProd) {
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  app.use(express.static(dist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(join(dist, "index.html"));
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(room: Room, except: HiveSocket | null, payload: ServerMessage) {
  for (const client of wss.clients) {
    const socket = client as HiveSocket;
    if (socket.roomCode !== room.code) continue;
    if (except && socket === except) continue;
    send(socket, payload);
  }
}

function broadcastFound(room: Room, result: Extract<ReturnType<Room["submit"]>, { ok: true }>) {
  for (const client of wss.clients) {
    const socket = client as HiveSocket;
    if (socket.roomCode !== room.code) continue;
    send(socket, {
      type: "found",
      word: result.word,
      score: result.score,
      rank: result.rank,
      queenBee: result.queenBee,
      byYou: socket.playerId === result.word.playerId,
    });
  }
}

function handleMessage(socket: HiveSocket, data: string) {
  let parsed: ClientMessage;
  try {
    parsed = JSON.parse(data) as ClientMessage;
  } catch {
    send(socket, { type: "error", message: "Malformed message" });
    return;
  }

  if (parsed.type === "ping") {
    send(socket, { type: "pong" });
    return;
  }

  if (parsed.type === "join") {
    const code = normalizeCode(parsed.code);
    const room = store.get(code);
    if (!room) {
      send(socket, { type: "error", message: "Hive not found. Create a new one?" });
      return;
    }
    const name = sanitizeName(parsed.name);
    if (!name) {
      send(socket, { type: "error", message: "Display name is required" });
      return;
    }
    if (socket.roomCode && socket.roomCode !== code && socket.playerId) {
      store.detachSocket(socket.playerId);
    }
    const player = room.upsertPlayer(parsed.playerId, name, true);
    socket.playerId = player.id;
    socket.roomCode = room.code;
    store.attach(player.id, room.code);
    send(socket, { type: "room", room: room.toPublic(), you: { id: player.id, name: player.name, connected: true } });
    broadcast(room, socket, { type: "presence", players: room.publicPlayers() });
    return;
  }

  const room = socket.roomCode ? store.get(socket.roomCode) : undefined;
  const playerId = socket.playerId;
  if (!room || !playerId) {
    send(socket, { type: "error", message: "Join a hive first" });
    return;
  }

  if (parsed.type === "rename") {
    const player = room.upsertPlayer(playerId, parsed.name, true);
    send(socket, { type: "room", room: room.toPublic(), you: { id: player.id, name: player.name, connected: true } });
    broadcast(room, socket, { type: "presence", players: room.publicPlayers() });
    return;
  }

  if (parsed.type === "submit") {
    const result = room.submit(playerId, parsed.word);
    if (!result.ok) {
      send(socket, { type: "reject", error: result.error, word: result.word });
      return;
    }
    broadcastFound(room, result);
    return;
  }
}

wss.on("connection", (socket: HiveSocket) => {
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });
  socket.on("message", (raw) => {
    handleMessage(socket, typeof raw === "string" ? raw : raw.toString());
  });
  socket.on("close", () => {
    if (!socket.playerId || !socket.roomCode) return;
    const room = store.get(socket.roomCode);
    store.detachSocket(socket.playerId);
    if (room) broadcast(room, socket, { type: "presence", players: room.publicPlayers() });
  });
});

const heartbeat = setInterval(() => {
  for (const client of wss.clients) {
    const socket = client as HiveSocket;
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, 25000);

wss.on("close", () => clearInterval(heartbeat));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Our Hive server on http://127.0.0.1:${PORT}`);
});
