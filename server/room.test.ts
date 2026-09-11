import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mulberry32 } from "../shared/game.ts";
import { loadDictionary } from "./dictionary.ts";
import { generatePuzzle } from "./puzzle.ts";
import {
  Room,
  RoomStore,
  claimJoinPlayerId,
  normalizePlayerId,
  resolveJoinPlayerId,
} from "./rooms.ts";

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

describe("player identity", () => {
  it("keeps two distinct joiners as two people", () => {
    const room = new Room("IDONE", puzzle);
    const maya = room.upsertPlayer("mayaid1234", "Maya", true);
    const jules = room.upsertPlayer("julesid1234", "Jules", true);

    assert.equal(maya.id, "mayaid1234");
    assert.equal(jules.id, "julesid1234");
    assert.equal(room.players.size, 2);
    assert.deepEqual(
      room.publicPlayers().map((player) => player.name),
      ["Jules", "Maya"],
    );
  });

  it("does not rename the first player when a second id joins", () => {
    const room = new Room("IDTWO", puzzle);
    room.upsertPlayer("mayaid1234", "Maya", true);
    room.upsertPlayer("julesid1234", "Jules", true);
    assert.equal(room.players.get("mayaid1234")?.name, "Maya");
    assert.equal(room.players.get("julesid1234")?.name, "Jules");
  });

  it("treats a same-id join as a reconnect that may update the name", () => {
    const room = new Room("IDTHR", puzzle);
    room.upsertPlayer("sharedid1234", "Maya", true);
    room.upsertPlayer("sharedid1234", "Maya-2", true);
    assert.equal(room.players.size, 1);
    assert.equal(room.players.get("sharedid1234")?.name, "Maya-2");
  });

  it("mints a new id when a live id is reused with a different name", () => {
    const room = new Room("IDFOR", puzzle);
    room.upsertPlayer("sharedid1234", "Maya", true);
    const second = claimJoinPlayerId(room, "sharedid1234", "Jules", () => true);
    assert.notEqual(second, "sharedid1234");
    room.upsertPlayer(second, "Jules", true);
    assert.equal(room.players.size, 2);
    assert.equal(room.players.get("sharedid1234")?.name, "Maya");
    assert.equal(room.players.get(second)?.name, "Jules");
  });

  it("keeps the same id on refresh while the previous socket is still closing", () => {
    const room = new Room("IDFIV", puzzle);
    room.upsertPlayer("sharedid1234", "Maya", true);
    const again = claimJoinPlayerId(room, "sharedid1234", "Maya", () => true);
    assert.equal(again, "sharedid1234");
  });

  it("rejects blank or tiny client ids so they cannot collide", () => {
    assert.equal(normalizePlayerId(""), undefined);
    assert.equal(normalizePlayerId("abc"), undefined);
    assert.equal(normalizePlayerId(undefined), undefined);
    assert.equal(normalizePlayerId("goodid01"), "goodid01");
    const a = resolveJoinPlayerId("");
    const b = resolveJoinPlayerId("");
    assert.notEqual(a, b);
    assert.match(a, /^[A-Za-z0-9_-]{8,64}$/);
  });

  it("attributes found words to the submitting player after a second person joins", () => {
    const room = new Room("IDSIX", puzzle);
    room.upsertPlayer("mayaid1234", "Maya", true);
    room.upsertPlayer("julesid1234", "Jules", true);
    const result = room.submit("mayaid1234", sampleWord);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.word.playerId, "mayaid1234");
      assert.equal(result.word.playerName, "Maya");
    }
  });

  it("keeps a player connected while another socket for the same id closes", async () => {
    const store = new RoomStore(words);
    const room = await store.create({ mode: "fresh" });
    room.upsertPlayer("sharedid1234", "Maya", true);
    const first = { n: 1 };
    const second = { n: 2 };
    store.attach("sharedid1234", room.code, first);
    store.attach("sharedid1234", room.code, second);
    store.detachSocket("sharedid1234", first);
    assert.equal(room.players.get("sharedid1234")?.connected, true);
    store.detachSocket("sharedid1234", second);
    assert.equal(room.players.get("sharedid1234")?.connected, false);
  });
});
