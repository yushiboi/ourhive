import { RANK_PCTS, RANKS, type HiveHints, type RankName, type Rankings, type SubmitError } from "./types.ts";

export const MIN_WORD_LENGTH = 4;

export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z]/g, "");
}

export function isPangram(word: string, hive: string[]): boolean {
  const used = new Set(word);
  return hive.every((letter) => used.has(letter));
}

export function scoreWord(word: string, hive: string[]): { points: number; pangram: boolean } {
  const pangram = isPangram(word, hive);
  const base = word.length === 4 ? 1 : word.length;
  return { points: base + (pangram ? 7 : 0), pangram };
}

export function rankingsFromMax(maxScore: number): Rankings {
  const rankings = {} as Rankings;
  for (const entry of RANKS) {
    const raw = Math.round(maxScore * RANK_PCTS[entry.key]);
    rankings[entry.key] = entry.key === "genius" ? maxScore : entry.key === "beginner" ? 0 : Math.max(1, raw);
  }
  return rankings;
}

export function rankForScore(score: number, rankings: Rankings): RankName {
  let rank: RankName = "Beginner";
  for (const entry of RANKS) {
    if (score >= rankings[entry.key]) rank = entry.name;
  }
  return rank;
}

export function nextRank(rank: RankName): (typeof RANKS)[number] | null {
  const index = RANKS.findIndex((entry) => entry.name === rank);
  if (index < 0 || index >= RANKS.length - 1) return null;
  return RANKS[index + 1] ?? null;
}

export function hiveLetterSet(center: string, letters: string[]): Set<string> {
  return new Set([center, ...letters]);
}

export function clientCheck(
  word: string,
  center: string,
  letters: Set<string>,
): SubmitError | null {
  if (word.length < MIN_WORD_LENGTH) return "too_short";
  if (!word.includes(center)) return "missing_center";
  for (const ch of word) {
    if (!letters.has(ch)) return "invalid_letters";
  }
  return null;
}

export function shuffleInPlace<T>(items: T[], rand: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const current = items[i]!;
    items[i] = items[j]!;
    items[j] = current;
  }
  return items;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dateKeyInZone(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildHints(
  answers: Map<string, { points: number; pangram: boolean }>,
): HiveHints {
  const byLength = new Map<number, number>();
  const byStart = new Map<string, number>();
  const prefixes = new Map<string, number>();
  let pangrams = 0;
  let maxScore = 0;
  for (const [word, entry] of answers) {
    maxScore += entry.points;
    if (entry.pangram) pangrams += 1;
    byLength.set(word.length, (byLength.get(word.length) ?? 0) + 1);
    const start = word[0]!;
    byStart.set(start, (byStart.get(start) ?? 0) + 1);
    if (word.length >= 2) {
      const prefix = word.slice(0, 2);
      prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1);
    }
  }
  return {
    totalWords: answers.size,
    maxScore,
    pangrams,
    byLength: [...byLength.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([length, count]) => ({ length, count })),
    byStart: [...byStart.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, count]) => ({ letter, count })),
    prefixes: [...prefixes.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([prefix, count]) => ({ prefix, count })),
  };
}
