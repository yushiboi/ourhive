import { nextRank } from "@shared/game";
import { RANKS, type RoomPublic } from "@shared/types";

/** Marker diameter (`h-9 w-9` = 2.25rem). Travel uses this so the pill stays in-bounds. */
const MARKER = "2.25rem";
const MARKER_CENTER = "1.125rem";
const DOT_INSET = "0.875rem"; // marker center − half of h-2/w-2

function scoreProgress(score: number, geniusScore: number) {
  if (geniusScore <= 0) return 0;
  return Math.min(1, Math.max(0, score / geniusScore));
}

export function RankBar({ room, onOpenRanks }: { room: RoomPublic; onOpenRanks: () => void }) {
  const upcoming = nextRank(room.rank);
  const nextAt = upcoming ? room.rankings[upcoming.key] : room.geniusScore;
  const remaining = Math.max(0, nextAt - room.score);
  const currentIndex = Math.max(0, RANKS.findIndex((rank) => rank.name === room.rank));
  const progress = scoreProgress(room.score, room.geniusScore);
  const rankCount = RANKS.length - 1;
  const nearEnd = progress >= 0.9;

  return (
    <button
      type="button"
      onClick={onOpenRanks}
      aria-label={`${room.rank}, ${room.score} of ${room.geniusScore} points`}
      className="flex w-full items-center gap-3 text-left"
    >
      <div className="min-w-24 shrink-0">
        <p className="text-lg font-semibold leading-tight text-ink">{room.rank}</p>
        <p className="text-xs text-ink/50">
          {room.queenBee
            ? "Every word found"
            : upcoming
              ? `${remaining} to ${upcoming.name}`
              : "Genius"}
        </p>
      </div>
      <div className="relative h-9 min-w-0 flex-1">
        <div
          className="pointer-events-none absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink/15"
          style={{ left: MARKER_CENTER, right: MARKER_CENTER }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-honey motion-reduce:transition-none"
          style={{
            left: MARKER_CENTER,
            width: `calc(${progress} * (100% - ${MARKER}))`,
            transition: "width 500ms ease-out",
          }}
        />
        {RANKS.slice(1, -1).map((rank, index) => {
          const rankIndex = index + 1;
          const t = rankIndex / rankCount;
          const reached = currentIndex >= rankIndex;
          return (
            <span
              key={rank.key}
              className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${reached ? "bg-honey" : "bg-ink/15"}`}
              style={{ left: `calc(${t} * (100% - ${MARKER}) + ${DOT_INSET})` }}
            />
          );
        })}
        <span
          className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-xs font-semibold tabular-nums text-ink/55 motion-reduce:transition-none"
          style={{
            left: `calc(100% - ${MARKER})`,
            opacity: nearEnd ? 0 : 1,
            transition: "opacity 280ms ease-out",
          }}
        >
          {room.geniusScore}
        </span>
        <span
          className="absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-honey text-sm font-bold tabular-nums text-honey-ink motion-reduce:transition-none"
          style={{
            left: `calc(${progress} * (100% - ${MARKER}))`,
            transition: "left 500ms ease-out",
          }}
        >
          {room.score}
        </span>
      </div>
    </button>
  );
}
