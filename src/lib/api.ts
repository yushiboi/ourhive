import type { PuzzleMode } from "@shared/types";

export async function createRoom(mode: PuzzleMode): Promise<{ code: string; url: string; mode: PuzzleMode; dateKey?: string }> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Could not create a hive");
  return body;
}

export async function peekRoom(code: string): Promise<{ exists: boolean; players?: number; wordCount?: number; mode?: string }> {
  const res = await fetch(`/api/rooms/${code}`);
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error("Could not look up hive");
  return res.json();
}
