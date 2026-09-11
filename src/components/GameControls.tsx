import { Delete, Lightbulb, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GameControls({
  onDelete,
  onHint,
  onShuffle,
  onEnter,
}: {
  onDelete: () => void;
  onHint: () => void;
  onShuffle: () => void;
  onEnter: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button variant="outline" className="h-12 min-w-24 px-5" onClick={onDelete}>
        <Delete className="h-4 w-4" />
        Delete
      </Button>
      <Button variant="outline" size="icon" className="h-12 w-12" aria-label="Hints" onClick={onHint}>
        <Lightbulb className="h-5 w-5" />
      </Button>
      <Button variant="outline" size="icon" className="h-12 w-12" aria-label="Shuffle" onClick={onShuffle}>
        <RotateCw className="h-5 w-5" />
      </Button>
      <Button variant="enter" className="h-12 min-w-24 px-6" onClick={onEnter}>
        Enter
      </Button>
    </div>
  );
}
