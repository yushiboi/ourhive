import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientCheck, isPangram, rankForScore, scoreWord } from "./game.ts";
import type { Rankings } from "./types.ts";

const hive = ["a", "c", "e", "l", "n", "r", "t"];
const center = "a";
const letters = new Set(hive);

const rankings: Rankings = {
  beginner: 0,
  novice: 2,
  okay: 5,
  good: 8,
  solid: 15,
  nice: 25,
  great: 40,
  amazing: 60,
  genius: 100,
};

describe("scoring", () => {
  it("awards 1 point for four-letter words", () => {
    assert.deepEqual(scoreWord("lane", hive), { points: 1, pangram: false });
  });

  it("awards one point per letter for longer words", () => {
    assert.deepEqual(scoreWord("clear", hive), { points: 5, pangram: false });
  });

  it("adds a 7-point pangram bonus", () => {
    assert.equal(isPangram("central", hive), true);
    assert.deepEqual(scoreWord("central", hive), { points: 14, pangram: true });
  });
});

describe("ranks", () => {
  it("uses Spellbee absolute thresholds", () => {
    assert.equal(rankForScore(0, rankings), "Beginner");
    assert.equal(rankForScore(2, rankings), "Novice");
    assert.equal(rankForScore(8, rankings), "Good");
    assert.equal(rankForScore(60, rankings), "Amazing");
    assert.equal(rankForScore(100, rankings), "Genius");
  });
});

describe("client checks", () => {
  it("rejects short words first", () => {
    assert.equal(clientCheck("cat", center, letters), "too_short");
  });

  it("requires the center letter", () => {
    assert.equal(clientCheck("lent", center, letters), "missing_center");
  });

  it("rejects letters outside the hive", () => {
    assert.equal(clientCheck("plant", center, letters), "invalid_letters");
  });

  it("allows letter reuse", () => {
    assert.equal(clientCheck("tattletale", center, letters), null);
  });
});
