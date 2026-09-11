import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientCheck,
  isPangram,
  rankBarProgress,
  rankForScore,
  rankingsFromMax,
  scoreWord,
} from "./game.ts";

const hive = ["a", "c", "e", "l", "n", "r", "t"];
const center = "a";
const letters = new Set(hive);

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
  it("scales Spellbee-style breakpoints against max score", () => {
    const rankings = rankingsFromMax(380);
    assert.equal(rankings.beginner, 0);
    assert.equal(rankings.novice, 12);
    assert.equal(rankings.okay, 27);
    assert.equal(rankings.good, 46);
    assert.equal(rankings.solid, 88);
    assert.equal(rankings.nice, 133);
    assert.equal(rankings.great, 213);
    assert.equal(rankings.amazing, 274);
    assert.equal(rankings.genius, 380);
    assert.equal(rankForScore(1, rankings), "Beginner");
    assert.equal(rankForScore(12, rankings), "Novice");
    assert.equal(rankForScore(380, rankings), "Genius");
  });

  it("places the rank-bar marker on rank slots and interpolates between them", () => {
    const rankings = rankingsFromMax(380);
    assert.equal(rankBarProgress(0, rankings), 0);
    assert.equal(rankBarProgress(12, rankings), 1 / 8);
    assert.equal(rankBarProgress(6, rankings), 0.5 / 8);
    assert.equal(rankBarProgress(274, rankings), 7 / 8);
    assert.equal(rankBarProgress(380, rankings), 1);
    assert.equal(rankBarProgress(500, rankings), 1);
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
