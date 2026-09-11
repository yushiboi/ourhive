import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RANKS, type RoomPublic } from "@shared/types";

export function RankingsPanel({
  open,
  onClose,
  room,
}: {
  open: boolean;
  onClose: () => void;
  room: RoomPublic;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">Rankings</p>
            <h2 className="font-display text-3xl text-ink">Shared progress</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-2 text-sm text-ink/65">
          Ranks scale with this hive’s max score ({room.puzzle.maxScore}). Genius is every point.
        </p>
        <ul className="mt-4 space-y-2">
          {RANKS.map((rank) => {
            const threshold = room.rankings[rank.key];
            const current = room.rank === rank.name;
            return (
              <li
                key={rank.key}
                className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                  current ? "bg-honey/40 font-semibold" : "bg-ink/4"
                }`}
              >
                <span>{rank.name}</span>
                <span className="tabular-nums text-ink/70">{threshold}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
