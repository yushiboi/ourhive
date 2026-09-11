import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWord } from "@/lib/utils";
import type { YesterdayPublic } from "@shared/types";

export function YesterdayPanel({
  open,
  onClose,
  yesterday,
}: {
  open: boolean;
  onClose: () => void;
  yesterday?: YesterdayPublic;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">Yesterday</p>
            <h2 className="font-display text-3xl text-ink">{yesterday?.date ?? "No prior hive"}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {!yesterday ? (
          <p className="mt-3 text-sm text-ink/65">Yesterday’s answers appear on today’s shared hive.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/65">
              Center {formatWord(yesterday.center)} · {yesterday.letters.map(formatWord).join(" ")} · {yesterday.words.length}{" "}
              words · {yesterday.maxScore} points
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {yesterday.words.map((word) => (
                <li
                  key={word}
                  className={`rounded-full px-3 py-1 text-sm ${
                    yesterday.pangrams.includes(word) ? "bg-honey/50 font-semibold" : "bg-ink/5"
                  }`}
                >
                  {formatWord(word)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
