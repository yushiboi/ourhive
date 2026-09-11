import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dailyPuzzle, listPublishedDays, randomPuzzle } from "./spellbee.ts";

describe("live Spellbee catalog", () => {
  it("loads published days and a random hive", async () => {
    const days = await listPublishedDays();
    assert.ok(days.length >= 1, "expected Spellbee to list at least one daily");
    const daily = await dailyPuzzle("UTC");
    assert.equal(daily.hive.length, 7);
    assert.ok(daily.answers.size >= 10);
    assert.ok(daily.pangramCount >= 1);
    const extra = await randomPuzzle();
    assert.equal(extra.source, "spellbee");
    assert.ok(extra.answers.size >= 10);
  });
});
