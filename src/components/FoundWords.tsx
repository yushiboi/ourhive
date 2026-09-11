import { formatWord, playerColor } from "@/lib/utils";
import type { FoundWord, RoomPublic } from "@shared/types";

export function FoundWords({ room, youId }: { room: RoomPublic; youId?: string }) {
  if (room.found.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-ink/12 bg-white/40 p-5 text-center">
        <p className="font-display text-xl text-ink">The comb is empty</p>
        <p className="mt-1 text-sm text-ink/60">Words either of you find land here, with a name attached.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-ink/8 bg-white/70 p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl text-ink">Found words</h2>
        <p className="text-sm text-ink/55">
          {room.found.length}/{room.puzzle.wordCount}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {room.found.map((item) => (
          <WordChip key={item.word} item={item} youId={youId} />
        ))}
      </ul>
    </section>
  );
}

function WordChip({ item, youId }: { item: FoundWord; youId?: string }) {
  const color = playerColor(item.playerId);
  const mine = item.playerId === youId;
  return (
    <li
      className={`rounded-full border px-3 py-1 text-sm ${item.pangram ? "border-honey bg-honey/40" : "border-ink/8 bg-paper"}`}
      title={`${item.playerName} · ${item.points} pts${item.pangram ? " · pangram" : ""}`}
    >
      <span className={`font-semibold tracking-wide ${item.pangram ? "text-honey-ink" : "text-ink"}`}>
        {formatWord(item.word)}
      </span>
      <span className="ml-2 text-xs" style={{ color }}>
        {mine ? "you" : item.playerName.split(" ")[0]}
      </span>
    </li>
  );
}
