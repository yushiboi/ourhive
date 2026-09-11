import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_WORD_LENGTH } from "../shared/game.ts";
import { BLOCKLIST } from "./blocklist.ts";

const S_BIT = 1 << ("s".charCodeAt(0) - 97);

export type DictWord = {
  word: string;
  mask: number;
};

export function letterMask(word: string): number {
  let mask = 0;
  for (let i = 0; i < word.length; i++) {
    const bit = word.charCodeAt(i) - 97;
    if (bit < 0 || bit > 25) return -1;
    mask |= 1 << bit;
  }
  return mask;
}

export function popcount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n) {
    n &= n - 1;
    count += 1;
  }
  return count;
}

export function loadDictionary(): DictWord[] {
  const root = dirname(fileURLToPath(import.meta.url));
  const path = join(root, "..", "data", "enable1.txt");
  const raw = readFileSync(path, "utf8");
  const words: DictWord[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (word.length < MIN_WORD_LENGTH) continue;
    if (BLOCKLIST.has(word)) continue;
    const mask = letterMask(word);
    if (mask < 0) continue;
    words.push({ word, mask });
  }
  return words;
}

export function pangramSeeds(words: DictWord[]): DictWord[] {
  return words.filter((entry) => popcount(entry.mask) === 7 && (entry.mask & S_BIT) === 0);
}

export { S_BIT };
