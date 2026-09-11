const DEVICE_ID_KEY = "our-hive-player-id";
const TAB_ID_KEY = "our-hive-tab-player-id";
const HOLDER_KEY = "our-hive-player-tab";
const NAME_KEY = "our-hive-name";
const TAB_NAME_KEY = "our-hive-tab-name";
const SECONDARY_KEY = "our-hive-secondary-tab";
const TAB_NONCE_KEY = "our-hive-tab-nonce";

function createId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

function tabNonce(): string {
  const existing = sessionStorage.getItem(TAB_NONCE_KEY);
  if (existing) return existing;
  const nonce = createId();
  sessionStorage.setItem(TAB_NONCE_KEY, nonce);
  return nonce;
}

/**
 * Player ids are tab-scoped in sessionStorage so two tabs in one browser
 * are two people. Refreshing the same tab keeps the id (reconnect).
 *
 * The first tab on a device may adopt `localStorage`'s device id so a
 * normal refresh / return visit stays the same person. A second live tab
 * always gets a fresh id instead of taking over the first player's name.
 */
export function getPlayerId(): string {
  const tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (tabId) return tabId;

  const nonce = tabNonce();
  const holder = localStorage.getItem(HOLDER_KEY);
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!holder) {
    localStorage.setItem(HOLDER_KEY, nonce);
  }

  const claimed = localStorage.getItem(HOLDER_KEY);
  if (claimed === nonce) {
    const id = deviceId || createId();
    localStorage.setItem(DEVICE_ID_KEY, id);
    sessionStorage.setItem(TAB_ID_KEY, id);
    sessionStorage.removeItem(SECONDARY_KEY);
    return id;
  }

  const id = createId();
  sessionStorage.setItem(TAB_ID_KEY, id);
  sessionStorage.setItem(SECONDARY_KEY, "1");
  return id;
}

export function isSecondaryTab(): boolean {
  getPlayerId();
  return sessionStorage.getItem(SECONDARY_KEY) === "1";
}

export function adoptPlayerId(id: string) {
  const next = id.trim();
  if (!next) return;
  sessionStorage.setItem(TAB_ID_KEY, next);
  if (!isSecondaryTab()) {
    localStorage.setItem(DEVICE_ID_KEY, next);
  }
}

export function getStoredName(): string {
  const tabName = sessionStorage.getItem(TAB_NAME_KEY);
  if (tabName) return tabName;
  if (isSecondaryTab()) return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function storeName(name: string) {
  const trimmed = name.trim().slice(0, 20);
  sessionStorage.setItem(TAB_NAME_KEY, trimmed);
  if (!isSecondaryTab()) {
    localStorage.setItem(NAME_KEY, trimmed);
  }
}
