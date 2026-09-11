import { dateKeyInZone, isPangram, scoreWord } from "../shared/game.ts";
import type { PuzzleMode, Rankings } from "../shared/types.ts";

const SPELLBEE = "https://spellbee.org";
const DEFAULT_RANK_PCTS = [0, 0.03, 0.06, 0.11, 0.22, 0.33, 0.52, 0.67, 1];

export type SpellbeeGame = {
  id?: number;
  date?: string;
  code?: string;
  scores?: number;
  rankings?: Record<string, number>;
  data: {
    code: string;
    letters: string[];
    dictionary: string[];
    center_letter: string;
    letters_sorted?: string[];
    max_score?: number;
    date?: string;
    pangrams?: Record<string, string> | string[];
  };
};

export type Puzzle = {
  source: "spellbee";
  code: string;
  center: string;
  letters: string[];
  hive: string[];
  answers: Map<string, { points: number; pangram: boolean }>;
  maxScore: number;
  pangramCount: number;
  rankings: Rankings;
  mode: PuzzleMode;
  dateKey?: string;
};

const byCode = new Map<string, Puzzle>();
const byDate = new Map<string, Puzzle>();
let catalog: { fetchedAt: number; dates: Record<string, SpellbeeGame> } | null = null;

function extractJsonObject(html: string, assign: string): unknown {
  const needle = assign;
  const i = html.indexOf(needle);
  if (i < 0) throw new Error(`Could not find ${assign} on Spellbee`);
  const start = html.indexOf("{", i);
  if (start < 0) throw new Error(`Could not parse ${assign}`);
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = start; j < html.length; j++) {
    const c = html[j]!;
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(start, j + 1));
    }
  }
  throw new Error(`Unterminated JSON for ${assign}`);
}

async function spellbeeFetch(path: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(`${SPELLBEE}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/html",
        "User-Agent": "OurHive/1.0 (cooperative dual-device spelling bee)",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function pangramSet(raw: SpellbeeGame["data"]["pangrams"]): Set<string> {
  if (!raw) return new Set();
  if (Array.isArray(raw)) return new Set(raw.map((w) => w.toLowerCase()));
  return new Set(Object.values(raw).map((w) => w.toLowerCase()));
}

function defaultRankings(maxScore: number): Rankings {
  const [b, n, o, g, s, ni, gr, a, ge] = DEFAULT_RANK_PCTS;
  return {
    beginner: Math.round(maxScore * (b ?? 0)),
    novice: Math.round(maxScore * (n ?? 0)),
    okay: Math.round(maxScore * (o ?? 0)),
    good: Math.round(maxScore * (g ?? 0)),
    solid: Math.round(maxScore * (s ?? 0)),
    nice: Math.round(maxScore * (ni ?? 0)),
    great: Math.round(maxScore * (gr ?? 0)),
    amazing: Math.round(maxScore * (a ?? 0)),
    genius: Math.round(maxScore * (ge ?? 1)),
  };
}

export function fromSpellbee(raw: SpellbeeGame, mode: PuzzleMode, dateKey?: string): Puzzle {
  const center = raw.data.center_letter.toLowerCase();
  const letters = raw.data.letters
    .map((letter) => letter.toLowerCase())
    .filter((letter) => letter !== center);
  if (letters.length !== 6) {
    const unique = [...new Set(raw.data.letters.map((letter) => letter.toLowerCase()))];
    const rest = unique.filter((letter) => letter !== center);
    letters.splice(0, letters.length, ...rest);
  }
  const hive = [center, ...letters];
  const listedPangrams = pangramSet(raw.data.pangrams);
  const answers = new Map<string, { points: number; pangram: boolean }>();
  for (const item of raw.data.dictionary) {
    const word = item.toLowerCase();
    const scored = scoreWord(word, hive);
    const pangram = scored.pangram || listedPangrams.has(word) || isPangram(word, hive);
    const points = pangram && !scored.pangram ? scored.points + 7 : scored.points;
    answers.set(word, { points, pangram });
  }
  let maxScore = 0;
  let pangramCount = 0;
  for (const entry of answers.values()) {
    maxScore += entry.points;
    if (entry.pangram) pangramCount += 1;
  }
  const rankings = raw.rankings
    ? {
        beginner: raw.rankings.beginner ?? 0,
        novice: raw.rankings.novice ?? 0,
        okay: raw.rankings.okay ?? 0,
        good: raw.rankings.good ?? 0,
        solid: raw.rankings.solid ?? 0,
        nice: raw.rankings.nice ?? 0,
        great: raw.rankings.great ?? 0,
        amazing: raw.rankings.amazing ?? 0,
        genius: raw.rankings.genius ?? maxScore,
      }
    : defaultRankings(maxScore);

  const puzzle: Puzzle = {
    source: "spellbee",
    code: (raw.data.code || raw.code || hive.join("")).toLowerCase(),
    center,
    letters,
    hive,
    answers,
    maxScore,
    pangramCount,
    rankings,
    mode,
    dateKey: dateKey ?? raw.data.date ?? raw.date,
  };
  byCode.set(puzzle.code, puzzle);
  if (puzzle.dateKey) byDate.set(puzzle.dateKey, puzzle);
  return puzzle;
}

export async function loadDailyCatalog(force = false): Promise<Record<string, SpellbeeGame>> {
  if (!force && catalog && Date.now() - catalog.fetchedAt < 10 * 60 * 1000) {
    return catalog.dates;
  }
  const res = await spellbeeFetch("/");
  if (!res.ok) throw new Error(`Spellbee homepage HTTP ${res.status}`);
  const html = await res.text();
  const dates = extractJsonObject(html, "window.games =") as Record<string, SpellbeeGame>;
  catalog = { fetchedAt: Date.now(), dates };
  for (const [date, game] of Object.entries(dates)) {
    fromSpellbee(game, date === Object.keys(dates).sort().at(-1) ? "daily" : "archive", date);
  }
  return dates;
}

export async function listPublishedDays(): Promise<string[]> {
  const dates = await loadDailyCatalog();
  return Object.keys(dates).sort();
}

export async function dailyPuzzle(timeZone = "UTC"): Promise<Puzzle> {
  const dates = await loadDailyCatalog();
  const today = dateKeyInZone(timeZone);
  if (dates[today]) return fromSpellbee(dates[today], "daily", today);
  const available = Object.keys(dates).sort();
  const previous = [...available].reverse().find((day) => day <= today);
  const pick = previous ?? available.at(-1);
  if (!pick || !dates[pick]) throw new Error("Spellbee did not publish a daily hive");
  return fromSpellbee(dates[pick], "daily", pick);
}

export async function archivePuzzle(date: string): Promise<Puzzle> {
  const cached = byDate.get(date);
  if (cached) return cached;
  const dates = await loadDailyCatalog();
  const game = dates[date];
  if (!game) throw new Error(`No Spellbee hive published for ${date}`);
  return fromSpellbee(game, "archive", date);
}

export async function puzzleByCode(code: string): Promise<Puzzle> {
  const key = code.toLowerCase().replace(/[^a-z]/g, "");
  const cached = byCode.get(key);
  if (cached) return cached;
  const res = await spellbeeFetch(`/game?id=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Spellbee hive ${key} HTTP ${res.status}`);
  const raw = (await res.json()) as SpellbeeGame | Record<string, never>;
  if (!raw || !("data" in raw) || !raw.data?.dictionary) {
    throw new Error(`Spellbee has no hive named ${key}`);
  }
  return fromSpellbee(raw as SpellbeeGame, "archive", raw.data.date ?? raw.date);
}

export async function randomPuzzle(): Promise<Puzzle> {
  const res = await spellbeeFetch("/random");
  if (!res.ok) throw new Error(`Spellbee /random HTTP ${res.status}`);
  const raw = (await res.json()) as SpellbeeGame;
  if (!raw?.data?.dictionary) throw new Error("Spellbee returned an empty hive");
  return fromSpellbee(raw, "fresh", raw.data.date ?? raw.date);
}

export function publicPuzzle(puzzle: Puzzle) {
  return {
    letters: puzzle.letters,
    center: puzzle.center,
    wordCount: puzzle.answers.size,
    pangramCount: puzzle.pangramCount,
    maxScore: puzzle.maxScore,
    spellbeeCode: puzzle.code,
    sourceDate: puzzle.dateKey,
  };
}

export function puzzleStats(puzzle: Puzzle) {
  return {
    code: puzzle.code,
    date: puzzle.dateKey,
    words: puzzle.answers.size,
    pangrams: puzzle.pangramCount,
    maxScore: puzzle.maxScore,
    letters: `${puzzle.center.toUpperCase()} / ${puzzle.letters.join(" ").toUpperCase()}`,
  };
}
