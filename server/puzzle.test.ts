import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { isPangram, scoreWord } from "../shared/game.ts";
import { fromSpellbee, type SpellbeeGame } from "./spellbee.ts";

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data", "fixtures", "spellbee-game.json"), "utf8"),
) as SpellbeeGame;

describe("spellbee puzzle import", () => {
  it("uses Spellbee letters, center, and answer list", () => {
    const puzzle = fromSpellbee(fixture, "daily", "2026-01-15");
    assert.equal(puzzle.source, "spellbee");
    assert.equal(puzzle.center, "l");
    assert.equal(puzzle.letters.length, 6);
    assert.ok(!puzzle.letters.includes("l"));
    assert.equal(puzzle.answers.size, fixture.data.dictionary.length);
    assert.ok(puzzle.answers.has("central"));
    assert.equal(puzzle.answers.get("central")?.pangram, true);
    assert.equal(puzzle.rankings.genius, 36);
  });

  it("scores imported words with Spelling Bee rules", () => {
    const puzzle = fromSpellbee(fixture, "archive", "2026-01-15");
    const hive = puzzle.hive;
    let total = 0;
    for (const [word, entry] of puzzle.answers) {
      const scored = scoreWord(word, hive);
      assert.equal(entry.pangram, isPangram(word, hive));
      assert.equal(entry.points, scored.points);
      total += entry.points;
    }
    assert.equal(puzzle.maxScore, total);
  });
});
