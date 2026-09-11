import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">How to play</p>
            <h2 className="font-display text-3xl text-ink">One hive, two phones</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
          <li>
            <strong className="text-ink">Share the room link</strong> over FaceTime. Each of you keeps your own
            honeycomb and keyboard.
          </li>
          <li>
            <strong className="text-ink">Words need 4+ letters</strong> and must include the gold center letter.
            Letters may be reused. No proper nouns or hyphenated words.
          </li>
          <li>
            <strong className="text-ink">Scoring:</strong> 4-letter words are 1 point. Longer words score 1 per
            letter. A pangram (all 7 letters) adds 7 bonus points.
          </li>
          <li>
            <strong className="text-ink">One shared score.</strong> If either of you finds a word, it locks for both
            of you and shows who got there first.
          </li>
          <li>
            <strong className="text-ink">Hives come from Spellbee.</strong> Today’s puzzle matches their daily, and
            “another hive” pulls from their published catalog — we don’t invent letter sets.
          </li>
        </ol>
      </div>
    </div>
  );
}
