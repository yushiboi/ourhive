import {
  buildHints,
  dateKeyInZone,
  hashString,
  mulberry32,
  rankingsFromMax,
  scoreWord,
  shiftDateKey,
} from "../shared/game.ts";
import type { HiveHints, PuzzleMode, PuzzlePublic, Rankings, YesterdayPublic } from "../shared/types.ts";
import { letterMask, pangramSeeds, type DictWord } from "./dictionary.ts";

export type Puzzle = {
  center: string;
  letters: string[];
  hive: string[];
  answers: Map<string, { points: number; pangram: boolean }>;
  maxScore: number;
  pangramCount: number;
  rankings: Rankings;
  hints: HiveHints;
  mode: PuzzleMode;
  dateKey?: string;
};

const dailyCache = new Map<string, Puzzle>();

function maskToLetters(mask: number): string[] {
  const letters: string[] = [];
  for (let i = 0; i < 26; i++) {
    if (mask & (1 << i)) letters.push(String.fromCharCode(97 + i));
  }
  return letters;
}

function pickCenter(letters: string[], rand: () => number): string {
  const vowels = letters.filter((letter) => "aeiou".includes(letter));
  const pool = vowels.length && rand() < 0.7 ? vowels : letters;
  return pool[Math.floor(rand() * pool.length)]!;
}

function buildAnswers(
  words: DictWord[],
  hiveMask: number,
  centerBit: number,
  hive: string[],
): Map<string, { points: number; pangram: boolean }> {
  const answers = new Map<string, { points: number; pangram: boolean }>();
  for (const entry of words) {
    if ((entry.mask & centerBit) === 0) continue;
    if ((entry.mask & ~hiveMask) !== 0) continue;
    answers.set(entry.word, scoreWord(entry.word, hive));
  }
  return answers;
}

function fromAnswers(
  center: string,
  letters: string[],
  answers: Map<string, { points: number; pangram: boolean }>,
  mode: PuzzleMode,
  dateKey?: string,
): Puzzle {
  const hive = [center, ...letters];
  let maxScore = 0;
  let pangramCount = 0;
  for (const entry of answers.values()) {
    maxScore += entry.points;
    if (entry.pangram) pangramCount += 1;
  }
  return {
    center,
    letters,
    hive,
    answers,
    maxScore,
    pangramCount,
    rankings: rankingsFromMax(maxScore),
    hints: buildHints(answers),
    mode,
    dateKey,
  };
}

const TARGETS = [
  { min: 25, max: 65 },
  { min: 20, max: 80 },
  { min: 15, max: 90 },
];

export function generatePuzzle(
  words: DictWord[],
  rand: () => number,
  mode: PuzzleMode,
  dateKey?: string,
): Puzzle {
  const seeds = pangramSeeds(words);
  if (seeds.length === 0) throw new Error("Word list has no 7-letter pangram seeds");

  const order = seeds.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const cur = order[i]!;
    order[i] = order[j]!;
    order[j] = cur;
  }

  for (const target of TARGETS) {
    const maxTries = Math.min(order.length, 400);
    for (let n = 0; n < maxTries; n++) {
      const seed = seeds[order[n]!]!;
      const allLetters = maskToLetters(seed.mask);
      const center = pickCenter(allLetters, rand);
      const letters = allLetters.filter((letter) => letter !== center);
      const hive = [center, ...letters];
      const answers = buildAnswers(words, seed.mask, 1 << (center.charCodeAt(0) - 97), hive);
      const pangramCount = [...answers.values()].filter((entry) => entry.pangram).length;
      if (pangramCount < 1) continue;
      if (answers.size < target.min || answers.size > target.max) continue;
      return fromAnswers(center, letters, answers, mode, dateKey);
    }
  }

  const seed = seeds[order[0]!]!;
  const allLetters = maskToLetters(seed.mask);
  const center = allLetters[0]!;
  const letters = allLetters.slice(1);
  const hive = [center, ...letters];
  const answers = buildAnswers(words, seed.mask, letterMask(center), hive);
  return fromAnswers(center, letters, answers, mode, dateKey);
}

export function freshPuzzle(words: DictWord[]): Puzzle {
  return generatePuzzle(words, Math.random, "fresh");
}

export function dailyPuzzle(words: DictWord[], dateKey: string): Puzzle {
  const cached = dailyCache.get(dateKey);
  if (cached) return cached;
  const puzzle = generatePuzzle(words, mulberry32(hashString(`our-hive-daily:${dateKey}`)), "daily", dateKey);
  dailyCache.set(dateKey, puzzle);
  return puzzle;
}

export function loadPuzzle(
  words: DictWord[],
  opts: { mode: PuzzleMode; timeZone?: string; date?: string },
): Puzzle {
  if (opts.mode === "daily" || opts.date) {
    const dateKey = opts.date ?? dateKeyInZone(opts.timeZone ?? "UTC");
    return dailyPuzzle(words, dateKey);
  }
  return freshPuzzle(words);
}

export function publicPuzzle(puzzle: Puzzle): PuzzlePublic {
  return {
    letters: puzzle.letters,
    center: puzzle.center,
    wordCount: puzzle.answers.size,
    pangramCount: puzzle.pangramCount,
    maxScore: puzzle.maxScore,
    hints: puzzle.hints,
  };
}

export function publicYesterday(puzzle: Puzzle): YesterdayPublic {
  return {
    date: puzzle.dateKey ?? "",
    center: puzzle.center,
    letters: puzzle.letters,
    words: [...puzzle.answers.keys()].sort(),
    pangrams: [...puzzle.answers.entries()].filter(([, entry]) => entry.pangram).map(([word]) => word),
    maxScore: puzzle.maxScore,
  };
}

export function puzzleStats(puzzle: Puzzle) {
  return {
    words: puzzle.answers.size,
    pangrams: puzzle.pangramCount,
    maxScore: puzzle.maxScore,
    genius: puzzle.rankings.genius,
    letters: `${puzzle.center.toUpperCase()} / ${puzzle.letters.join(" ").toUpperCase()}`,
    date: puzzle.dateKey,
  };
}

export { shiftDateKey };
