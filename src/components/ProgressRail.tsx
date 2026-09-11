import { RANKS, type RankName, type RoomPublic } from "@shared/types";

export function ProgressRail({ room }: { room: RoomPublic }) {
  const geniusPct = Math.min(100, (room.score / Math.max(1, room.geniusScore)) * 100);
  const index = RANKS.findIndex((rank) => rank.name === room.rank);

  return (
    <section className="rounded-3xl border border-ink/8 bg-white/70 p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">Shared rank</p>
          <p className="font-display text-3xl font-semibold text-ink">{room.rank}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-ink">{room.score}</p>
          <p className="text-xs text-ink/55">
            Genius {room.geniusScore}
            {room.queenBee ? " · every word" : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full bg-linear-to-r from-comb to-terracotta transition-[width] duration-500"
          style={{ width: `${geniusPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-ink/45">
        {RANKS.map((rank) => (
          <span key={rank.name} className={rank.name === room.rank ? "font-semibold text-pine" : ""}>
            {rank.name === "Beginner" || rank.name === "Genius" || rank.name === room.rank ? rank.name : "·"}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        {copyForRank(room.rank, index, room.queenBee, room.found.length, room.puzzle.wordCount)}
      </p>
    </section>
  );
}

function copyForRank(rank: RankName, index: number, queenBee: boolean, found: number, total: number) {
  if (queenBee) return `You found every word (${found}/${total}).`;
  if (rank === "Genius") return `Genius. ${found}/${total} words.`;
  const next = RANKS[index + 1]?.name;
  return `${found}/${total} words · next rank ${next}`;
}
