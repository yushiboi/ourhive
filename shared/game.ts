import { RANKS, type RankName, type Rankings, type SubmitError } from "./types.ts";

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

export function rankForScore(score: number, rankings: Rankings): RankName {
  let rank: RankName = "Beginner";
  for (const entry of RANKS) {
    const threshold = rankings[entry.key];
    if (score >= threshold) rank = entry.name;
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
