import { dateKeyInZone } from "../shared/game.ts";
import { loadDictionary } from "./dictionary.ts";
import { dailyPuzzle, freshPuzzle, puzzleStats } from "./puzzle.ts";
import { RoomStore } from "./rooms.ts";

export const words = loadDictionary();
export const store = new RoomStore(words);

console.log(`Open word list ready: ${words.length.toLocaleString()} playable words`);
const today = dailyPuzzle(words, dateKeyInZone("UTC"));
console.log("Today's hive", puzzleStats(today));
console.log("Sample fresh hive", puzzleStats(freshPuzzle(words)));
