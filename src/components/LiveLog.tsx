import { useEffect, useState } from "react";
import { formatWord, playerColor } from "@/lib/utils";
import type { FoundWord } from "@shared/types";

function timeLabel(at: number, now: number) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 8) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function LiveLog({ found, youId }: { found: FoundWord[]; youId?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const [fresh, setFresh] = useState<string | null>(null);
  const newest = found[0];

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!newest) return;
    setFresh(`${newest.word}:${newest.at}`);
    const timer = window.setTimeout(() => setFresh(null), 1200);
    return () => window.clearTimeout(timer);
  }, [newest?.word, newest?.at]);

  return (
    <section className="flex h-full min-h-56 flex-col rounded-3xl border border-ink/10 bg-white/80 p-4 shadow-sm dark:bg-paper">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">Live log</p>
          <h2 className="font-display text-2xl text-ink">Guesses</h2>
        </div>
        <p className="text-xs text-ink/45">{found.length} found</p>
      </div>

      {found.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-ink/12 bg-cream/50 px-4 py-8 text-center text-sm text-ink/50">
          Waiting for the first word. When either of you finds one, it lands here instantly.
        </div>
      ) : (
        <ol className="flex-1 space-y-2 overflow-y-auto pr-1">
          {found.map((item) => {
            const mine = item.playerId === youId;
            const key = `${item.word}:${item.at}`;
            return (
              <li
                key={item.word}
                className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 ${
                  item.pangram ? "bg-honey/35" : "bg-ink/4"
                } ${fresh === key ? "log-in" : ""}`}
              >
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: playerColor(item.playerId) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink/55">
                    {mine ? "You" : item.playerName} found
                    {item.pangram ? " a pangram" : ""}
                  </p>
                  <p className={`truncate font-display text-xl tracking-wide ${item.pangram ? "text-honey-ink" : "text-ink"}`}>
                    {formatWord(item.word)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-ink">+{item.points}</p>
                  <p className="text-[11px] text-ink/40">{timeLabel(item.at, now)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
