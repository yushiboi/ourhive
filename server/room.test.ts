import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { fromSpellbee, type SpellbeeGame } from "./spellbee.ts";
import { Room } from "./rooms.ts";

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "data", "fixtures", "spellbee-game.json"), "utf8"),
) as SpellbeeGame;

const puzzle = fromSpellbee(fixture, "fresh");

describe("room scoring", () => {
  it("locks a word after the first successful submit", () => {
    const room = new Room("TESTA", puzzle);
    room.upsertPlayer("p1", "Maya", true);
    room.upsertPlayer("p2", "Jules", true);

    const first = room.submit("p1", "lane");
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.word.playerId, "p1");
      assert.equal(first.word.playerName, "Maya");
      assert.equal(first.word.points, 1);
    }

    const second = room.submit("p2", "lane");
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.error, "already_found");
    assert.equal(room.found.size, 1);
    assert.equal(room.score, 1);
  });

  it("rejects words that fit the hive but are not on Spellbee's list", () => {
    const room = new Room("TESTB", puzzle);
    room.upsertPlayer("p1", "Maya", true);
    const result = room.submit("p1", "taller");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "not_in_dictionary");
  });

  it("scores a pangram with the bonus", () => {
    const room = new Room("TESTC", puzzle);
    room.upsertPlayer("p2", "Jules", true);
    const result = room.submit("p2", "central");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.word.pangram, true);
      assert.equal(result.word.points, 14);
    }
  });
});
