import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashString, isPangram, mulberry32, scoreWord } from "../shared/game.ts";
import { loadDictionary } from "./dictionary.ts";
import { generatePuzzle } from "./puzzle.ts";

const words = loadDictionary();

describe("puzzle generation", () => {
  it("builds hives with a pangram and a healthy word list", () => {
    for (let i = 0; i < 3; i++) {
      const puzzle = generatePuzzle(words, mulberry32(hashString(`test-${i}`)), "fresh");
      assert.equal(puzzle.hive.length, 7);
      assert.equal(new Set(puzzle.hive).size, 7);
      assert.ok(!puzzle.hive.includes("s"), "hives omit S");
      assert.ok(puzzle.answers.size >= 15, `too few words: ${puzzle.answers.size}`);
      assert.ok(puzzle.pangramCount >= 1);
      assert.equal(puzzle.rankings.genius, puzzle.maxScore);
      assert.ok(puzzle.hints.totalWords === puzzle.answers.size);
      let recomputed = 0;
      for (const [word, entry] of puzzle.answers) {
        assert.ok(word.includes(puzzle.center), word);
        assert.ok([...word].every((ch) => puzzle.hive.includes(ch)), word);
        const scored = scoreWord(word, puzzle.hive);
        assert.equal(entry.points, scored.points);
        assert.equal(entry.pangram, isPangram(word, puzzle.hive));
        recomputed += entry.points;
      }
      assert.equal(puzzle.maxScore, recomputed);
    }
  });

  it("is deterministic for a daily seed", () => {
    const a = generatePuzzle(words, mulberry32(hashString("our-hive-daily:2026-09-11")), "daily", "2026-09-11");
    const b = generatePuzzle(words, mulberry32(hashString("our-hive-daily:2026-09-11")), "daily", "2026-09-11");
    assert.equal(a.center, b.center);
    assert.deepEqual(a.letters, b.letters);
    assert.equal(a.answers.size, b.answers.size);
  });
});
