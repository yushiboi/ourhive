import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { formatWord, playerColor } from "@/lib/utils";
import type { FoundWord, RoomPublic } from "@shared/types";

export function FoundWords({ room, youId }: { room: RoomPublic; youId?: string }) {
  const [open, setOpen] = useState(false);
  const count = room.found.length;
  const label =
    count === 0 ? "Your words …" : `You have found ${count} ${count === 1 ? "word" : "words"}`;

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3 text-left shadow-sm dark:bg-paper"
      >
        <span className="text-sm text-ink/70">{label}</span>
        <ChevronDown className={`h-4 w-4 text-ink/40 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-3 dark:bg-paper">
          {count === 0 ? (
            <p className="px-1 py-2 text-sm text-ink/50">Words either of you find land here, with a name attached.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {[...room.found]
                .slice()
                .sort((a, b) => a.word.localeCompare(b.word))
                .map((item) => (
                  <WordChip key={item.word} item={item} youId={youId} />
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function WordChip({ item, youId }: { item: FoundWord; youId?: string }) {
  const color = playerColor(item.playerId);
  const mine = item.playerId === youId;
  return (
    <li
      className={`rounded-full px-3 py-1 text-sm ${item.pangram ? "bg-honey/50 font-semibold" : "bg-ink/5"}`}
      title={`${item.playerName} · ${item.points} pts${item.pangram ? " · pangram" : ""}`}
    >
      <span className="tracking-wide">{formatWord(item.word)}</span>
      <span className="ml-1.5 text-xs" style={{ color }}>
        {mine ? "you" : item.playerName.split(" ")[0]}
      </span>
    </li>
  );
}
