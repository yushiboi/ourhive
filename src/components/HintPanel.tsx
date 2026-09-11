import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWord } from "@/lib/utils";
import type { HiveHints } from "@shared/types";

export function HintPanel({
  open,
  onClose,
  hints,
}: {
  open: boolean;
  onClose: () => void;
  hints: HiveHints;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">Hints</p>
            <h2 className="font-display text-3xl text-ink">A nudge, not the answers</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-2 text-sm text-ink/65">
          {hints.totalWords} words · {hints.maxScore} points · {hints.pangrams} pangram
          {hints.pangrams === 1 ? "" : "s"}
        </p>

        <h3 className="mt-5 text-sm font-semibold text-ink">Word lengths</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/50">
                {hints.byLength.map((row) => (
                  <th key={row.length} className="px-2 py-1 font-medium">
                    {row.length}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {hints.byLength.map((row) => (
                  <td key={row.length} className="px-2 py-1 font-semibold">
                    {row.count}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 text-sm font-semibold text-ink">Starting letters</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {hints.byStart.map((row) => (
            <li key={row.letter} className="rounded-full bg-ink/5 px-3 py-1 text-sm">
              <span className="font-semibold">{formatWord(row.letter)}</span>
              <span className="ml-1 text-ink/50">{row.count}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-semibold text-ink">Two-letter starts</h3>
        <ul className="mt-2 columns-2 gap-x-6 text-sm sm:columns-3">
          {hints.prefixes.map((row) => (
            <li key={row.prefix} className="flex justify-between border-b border-ink/5 py-1">
              <span className="font-medium tracking-wide">{formatWord(row.prefix)}</span>
              <span className="text-ink/50">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
