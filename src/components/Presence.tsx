import { playerColor } from "@/lib/utils";
import type { PlayerPublic } from "@shared/types";

export function Presence({ players, youId }: { players: PlayerPublic[]; youId?: string }) {
  if (players.length === 0) {
    return <p className="text-sm text-ink/55">Waiting for players…</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
            player.connected ? "border-ink/10 bg-white/80 dark:bg-paper" : "border-ink/8 bg-white/40 text-ink/45 dark:bg-paper/50"
          }`}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: player.connected ? playerColor(player.id) : "#b9b2a3" }}
          />
          <span>
            {player.id === youId ? `${player.name} (you)` : player.name}
            {!player.connected ? " · away" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
