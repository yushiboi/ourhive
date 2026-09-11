import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

type MemoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

function memoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

const local = memoryStorage();
const sessions = { a: memoryStorage(), b: memoryStorage() };
let active: MemoryStorage = sessions.a;

const localProxy: MemoryStorage = {
  getItem: (key) => local.getItem(key),
  setItem: (key, value) => local.setItem(key, value),
  removeItem: (key) => local.removeItem(key),
  clear: () => local.clear(),
};

const sessionProxy: MemoryStorage = {
  getItem: (key) => active.getItem(key),
  setItem: (key, value) => active.setItem(key, value),
  removeItem: (key) => active.removeItem(key),
  clear: () => active.clear(),
};

Object.defineProperty(globalThis, "localStorage", { value: localProxy, configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: sessionProxy, configurable: true });

const player = await import("./player.ts");

function useTab(tab: "a" | "b") {
  active = sessions[tab];
}

afterEach(() => {
  local.clear();
  sessions.a.clear();
  sessions.b.clear();
  useTab("a");
});

describe("tab-scoped player ids", () => {
  it("reuses the same id after a same-tab refresh", () => {
    const first = player.getPlayerId();
    const again = player.getPlayerId();
    assert.equal(again, first);
    sessions.a.removeItem("our-hive-tab-nonce");
    const refreshed = player.getPlayerId();
    assert.equal(refreshed, first);
  });

  it("gives a second tab its own id instead of the first player's", () => {
    useTab("a");
    const first = player.getPlayerId();
    player.storeName("Maya");

    useTab("b");
    const second = player.getPlayerId();
    assert.notEqual(second, first);
    assert.equal(player.isSecondaryTab(), true);
    assert.equal(player.getStoredName(), "");

    player.storeName("Jules");
    useTab("a");
    assert.equal(player.getPlayerId(), first);
    assert.equal(player.getStoredName(), "Maya");
  });

  it("does not let a secondary tab overwrite the device name", () => {
    useTab("a");
    player.getPlayerId();
    player.storeName("Maya");

    useTab("b");
    player.getPlayerId();
    player.storeName("Jules");

    useTab("a");
    assert.equal(player.getStoredName(), "Maya");
    assert.equal(local.getItem("our-hive-name"), "Maya");
  });
});
