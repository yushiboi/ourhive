import { nextRank } from "@shared/game";
import { RANKS, type RoomPublic } from "@shared/types";

export function RankBar({ room, onOpenRanks }: { room: RoomPublic; onOpenRanks: () => void }) {
  const upcoming = nextRank(room.rank);
  const nextAt = upcoming ? room.rankings[upcoming.key] : room.geniusScore;
  const remaining = Math.max(0, nextAt - room.score);
  const currentIndex = Math.max(0, RANKS.findIndex((rank) => rank.name === room.rank));

  return (
    <button type="button" onClick={onOpenRanks} className="flex w-full items-center gap-3 text-left">
      <div className="min-w-24">
        <p className="text-lg font-semibold leading-tight text-ink">{room.rank}</p>
        <p className="text-xs text-ink/50">
          {room.queenBee
            ? "Every word found"
            : upcoming
              ? `${remaining} to ${upcoming.name}`
              : "Genius"}
        </p>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-honey text-sm font-bold text-honey-ink">
          {room.score}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-between px-0.5">
          {RANKS.slice(1).map((rank, index) => {
            const reached = currentIndex >= index + 1;
            return (
              <span
                key={rank.key}
                className={`h-2 w-2 rounded-full ${reached ? "bg-honey" : "bg-ink/15"}`}
              />
            );
          })}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/8 text-xs font-semibold text-ink/55">
          {room.geniusScore}
        </span>
      </div>
    </button>
  );
}
