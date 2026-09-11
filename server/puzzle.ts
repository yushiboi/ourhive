import type { PuzzleMode } from "../shared/types.ts";
import {
  archivePuzzle,
  dailyPuzzle,
  puzzleByCode,
  randomPuzzle,
  type Puzzle,
} from "./spellbee.ts";

export type { Puzzle } from "./spellbee.ts";
export { publicPuzzle, puzzleStats } from "./spellbee.ts";

export async function loadPuzzle(opts: {
  mode: PuzzleMode;
  timeZone?: string;
  date?: string;
  spellbeeCode?: string;
}): Promise<Puzzle> {
  if (opts.spellbeeCode) return puzzleByCode(opts.spellbeeCode);
  if (opts.date) return archivePuzzle(opts.date);
  if (opts.mode === "daily") return dailyPuzzle(opts.timeZone ?? "UTC");
  if (opts.mode === "archive") {
    throw new Error("Pick a published Spellbee date");
  }
  return randomPuzzle();
}
