import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mulberry32 } from "../shared/game.ts";
import { loadDictionary } from "./dictionary.ts";
import { generatePuzzle } from "./puzzle.ts";
import { Room } from "./rooms.ts";

const words = loadDictionary();
const puzzle = generatePuzzle(words, mulberry32(11), "fresh");
const sampleWord = [...puzzle.answers.keys()].find((word) => !puzzle.answers.get(word)?.pangram)!;
const pangram = [...puzzle.answers.entries()].find(([, entry]) => entry.pangram)![0];

describe("room scoring", () => {
  it("locks a word after the first successful submit", () => {
    const room = new Room("TESTA", puzzle);
    room.upsertPlayer("p1", "Maya", true);
    room.upsertPlayer("p2", "Jules", true);

    const first = room.submit("p1", sampleWord);
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.word.playerId, "p1");
      assert.equal(first.word.playerName, "Maya");
    }

    const second = room.submit("p2", sampleWord);
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.error, "already_found");
    assert.equal(room.found.size, 1);
  });

  it("rejects words that fit the hive but are not in the open list", () => {
    const room = new Room("TESTB", puzzle);
    room.upsertPlayer("p1", "Maya", true);
    const result = room.submit("p1", `${puzzle.center}${puzzle.center}${puzzle.center}qxyz`);
    assert.equal(result.ok, false);
  });

  it("scores a pangram with the bonus", () => {
    const room = new Room("TESTC", puzzle);
    room.upsertPlayer("p2", "Jules", true);
    const result = room.submit("p2", pangram);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.word.pangram, true);
      assert.equal(result.word.points, puzzle.answers.get(pangram)!.points);
    }
  });
});
