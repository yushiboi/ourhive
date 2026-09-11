const ID_KEY = "our-hive-player-id";
const NAME_KEY = "our-hive-name";

export function getPlayerId(): string {
  const existing = localStorage.getItem(ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  localStorage.setItem(ID_KEY, id);
  return id;
}

export function getStoredName(): string {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function storeName(name: string) {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 20));
}
