export const RANKS = [
  { name: "Beginner", key: "beginner" },
  { name: "Novice", key: "novice" },
  { name: "Okay", key: "okay" },
  { name: "Good", key: "good" },
  { name: "Solid", key: "solid" },
  { name: "Nice", key: "nice" },
  { name: "Great", key: "great" },
  { name: "Amazing", key: "amazing" },
  { name: "Genius", key: "genius" },
] as const;

export type RankName = (typeof RANKS)[number]["name"];
export type RankKey = (typeof RANKS)[number]["key"];

export type PuzzleMode = "fresh" | "daily";

export type Rankings = Record<RankKey, number>;

/** Scaled from Spellbee-style rank breakpoints (e.g. 12/27/46…/380) so Genius = max score. */
export const RANK_PCTS: Record<RankKey, number> = {
  beginner: 0,
  novice: 0.032,
  okay: 0.071,
  good: 0.121,
  solid: 0.232,
  nice: 0.35,
  great: 0.561,
  amazing: 0.721,
  genius: 1,
};

export type HiveHints = {
  totalWords: number;
  maxScore: number;
  pangrams: number;
  byLength: { length: number; count: number }[];
  byStart: { letter: string; count: number }[];
  prefixes: { prefix: string; count: number }[];
};

export type PuzzlePublic = {
  letters: string[];
  center: string;
  wordCount: number;
  pangramCount: number;
  maxScore: number;
  hints: HiveHints;
};

export type YesterdayPublic = {
  date: string;
  center: string;
  letters: string[];
  words: string[];
  pangrams: string[];
  maxScore: number;
};

export type FoundWord = {
  word: string;
  playerId: string;
  playerName: string;
  points: number;
  pangram: boolean;
  at: number;
};

export type PlayerPublic = {
  id: string;
  name: string;
  connected: boolean;
};

export type RoomPublic = {
  code: string;
  mode: PuzzleMode;
  dateKey?: string;
  puzzle: PuzzlePublic;
  found: FoundWord[];
  score: number;
  rank: RankName;
  rankings: Rankings;
  geniusScore: number;
  queenBee: boolean;
  players: PlayerPublic[];
  yesterday?: YesterdayPublic;
};

export type SubmitError =
  | "too_short"
  | "missing_center"
  | "invalid_letters"
  | "not_in_dictionary"
  | "already_found";

export type ClientMessage =
  | { type: "join"; playerId: string; name: string; code: string }
  | { type: "submit"; word: string }
  | { type: "rename"; name: string }
  | { type: "ping" };

export type ServerMessage =
  | { type: "room"; room: RoomPublic; you: PlayerPublic }
  | { type: "presence"; players: PlayerPublic[] }
  | { type: "found"; word: FoundWord; score: number; rank: RankName; queenBee: boolean; byYou: boolean }
  | { type: "reject"; error: SubmitError; word: string }
  | { type: "error"; message: string }
  | { type: "pong" };

export const REJECT_COPY: Record<SubmitError, string> = {
  too_short: "Too short",
  missing_center: "Missing center letter",
  invalid_letters: "Wrong letters",
  not_in_dictionary: "Not in word list",
  already_found: "Already found",
};
