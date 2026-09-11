import { customAlphabet, nanoid } from "nanoid";
import { clientCheck, hiveLetterSet, rankForScore } from "../shared/game.ts";
import type {
  FoundWord,
  PlayerPublic,
  PuzzleMode,
  RankName,
  RoomPublic,
  SubmitError,
  YesterdayPublic,
} from "../shared/types.ts";
import { loadPuzzle, publicPuzzle, publicYesterday, shiftDateKey, type Puzzle } from "./puzzle.ts";
import type { DictWord } from "./dictionary.ts";

const roomCode = customAlphabet("ACDEFGHJKMNPQRTUVWXY", 5);
const ROOM_TTL_MS = 1000 * 60 * 60 * 24;

export type Player = {
  id: string;
  name: string;
  connected: boolean;
  lastSeen: number;
};

export type SubmitResult =
  | { ok: true; word: FoundWord; score: number; rank: RankName; queenBee: boolean }
  | { ok: false; error: SubmitError; word: string };

export class Room {
  readonly code: string;
  readonly createdAt = Date.now();
  lastActivity = Date.now();
  readonly puzzle: Puzzle;
  readonly yesterday?: YesterdayPublic;
  readonly found = new Map<string, FoundWord>();
  readonly players = new Map<string, Player>();
  score = 0;

  constructor(code: string, puzzle: Puzzle, yesterday?: YesterdayPublic) {
    this.code = code;
    this.puzzle = puzzle;
    this.yesterday = yesterday;
  }

  get rank(): RankName {
    return rankForScore(this.score, this.puzzle.rankings);
  }

  get queenBee(): boolean {
    return this.found.size === this.puzzle.answers.size;
  }

  upsertPlayer(id: string, name: string, connected: boolean): Player {
    const existing = this.players.get(id);
    const player: Player = existing
      ? {
          ...existing,
          name: sanitizeName(name) || existing.name,
          connected,
          lastSeen: Date.now(),
        }
      : {
          id,
          name: sanitizeName(name) || "Player",
          connected,
          lastSeen: Date.now(),
        };
    this.players.set(id, player);
    this.lastActivity = Date.now();
    return player;
  }

  setConnected(id: string, connected: boolean) {
    const player = this.players.get(id);
    if (!player) return;
    player.connected = connected;
    player.lastSeen = Date.now();
  }

  submit(playerId: string, raw: string): SubmitResult {
    this.lastActivity = Date.now();
    const word = raw.toLowerCase().replace(/[^a-z]/g, "");
    const letters = hiveLetterSet(this.puzzle.center, this.puzzle.letters);
    const shape = clientCheck(word, this.puzzle.center, letters);
    if (shape) return { ok: false, error: shape, word };

    const already = this.found.get(word);
    if (already) return { ok: false, error: "already_found", word };

    const answer = this.puzzle.answers.get(word);
    if (!answer) return { ok: false, error: "not_in_dictionary", word };

    const player = this.players.get(playerId);
    const found: FoundWord = {
      word,
      playerId,
      playerName: player?.name ?? "Player",
      points: answer.points,
      pangram: answer.pangram,
      at: Date.now(),
    };
    this.found.set(word, found);
    this.score += answer.points;
    return {
      ok: true,
      word: found,
      score: this.score,
      rank: this.rank,
      queenBee: this.queenBee,
    };
  }

  toPublic(): RoomPublic {
    return {
      code: this.code,
      mode: this.puzzle.mode,
      dateKey: this.puzzle.dateKey,
      puzzle: publicPuzzle(this.puzzle),
      found: [...this.found.values()].sort((a, b) => b.at - a.at),
      score: this.score,
      rank: this.rank,
      rankings: this.puzzle.rankings,
      geniusScore: this.puzzle.rankings.genius,
      queenBee: this.queenBee,
      players: this.publicPlayers(),
      yesterday: this.yesterday,
    };
  }

  publicPlayers(): PlayerPublic[] {
    return [...this.players.values()]
      .map((player) => ({
        id: player.id,
        name: player.name,
        connected: player.connected,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

export class RoomStore {
  private readonly rooms = new Map<string, Room>();
  private readonly playerRoom = new Map<string, string>();
  private readonly playerSockets = new Map<string, Set<object>>();

  constructor(private readonly words: DictWord[]) {}

  async create(opts: { mode: PuzzleMode; timeZone?: string; date?: string }): Promise<Room> {
    this.gc();
    const puzzle = loadPuzzle(this.words, opts);
    let yesterday: YesterdayPublic | undefined;
    if (puzzle.mode === "daily" && puzzle.dateKey) {
      const prior = loadPuzzle(this.words, { mode: "daily", date: shiftDateKey(puzzle.dateKey, -1) });
      yesterday = publicYesterday(prior);
    }
    let code = roomCode();
    while (this.rooms.has(code)) code = roomCode();
    const room = new Room(code, puzzle, yesterday);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(normalizeCode(code));
  }

  attach(playerId: string, code: string, socket?: object) {
    this.playerRoom.set(playerId, normalizeCode(code));
    if (!socket) return;
    const sockets = this.playerSockets.get(playerId) ?? new Set<object>();
    sockets.add(socket);
    this.playerSockets.set(playerId, sockets);
  }

  detachSocket(playerId: string, socket?: object) {
    const code = this.playerRoom.get(playerId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (socket) {
      const sockets = this.playerSockets.get(playerId);
      sockets?.delete(socket);
      if (sockets && sockets.size > 0) {
        room?.setConnected(playerId, true);
        return;
      }
    }
    room?.setConnected(playerId, false);
  }

  hasOtherSocket(playerId: string, socket: object): boolean {
    const sockets = this.playerSockets.get(playerId);
    if (!sockets || sockets.size === 0) return false;
    if (sockets.size === 1 && sockets.has(socket)) return false;
    return true;
  }

  roomForPlayer(playerId: string): Room | undefined {
    const code = this.playerRoom.get(playerId);
    return code ? this.rooms.get(code) : undefined;
  }

  private gc() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > ROOM_TTL_MS) {
        this.rooms.delete(code);
        for (const [playerId, playerCode] of this.playerRoom) {
          if (playerCode === code) {
            this.playerRoom.delete(playerId);
            this.playerSockets.delete(playerId);
          }
        }
      }
    }
  }
}

export function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 20);
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
}

export function newPlayerId(): string {
  return nanoid(12);
}

/** Client-supplied ids; reject empty/short/odd values so they cannot collide. */
export function normalizePlayerId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return undefined;
  return id;
}

export function resolveJoinPlayerId(raw: unknown): string {
  return normalizePlayerId(raw) ?? newPlayerId();
}

/**
 * Reusing a live player id with a *different* name is a second person (or a
 * second tab), not a refresh. Mint a new id so they cannot take over the first.
 */
export function claimJoinPlayerId(
  room: Room,
  rawId: unknown,
  name: string,
  isIdLiveOnOtherSocket: (id: string) => boolean,
): string {
  const requested = resolveJoinPlayerId(rawId);
  const existing = room.players.get(requested);
  const incoming = sanitizeName(name);
  if (existing && incoming && incoming !== existing.name && isIdLiveOnOtherSocket(requested)) {
    return newPlayerId();
  }
  return requested;
}
