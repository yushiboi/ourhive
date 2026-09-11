import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Delete, HelpCircle, Share2, Shuffle } from "lucide-react";
import { FoundWords } from "@/components/FoundWords";
import { Honeycomb } from "@/components/Honeycomb";
import { HowToPlay } from "@/components/HowToPlay";
import { Presence } from "@/components/Presence";
import { ProgressRail } from "@/components/ProgressRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHiveSocket } from "@/hooks/useHiveSocket";
import { getStoredName, storeName } from "@/lib/player";
import { cn, formatWord } from "@/lib/utils";
import { REJECT_COPY } from "@shared/types";
import { clientCheck, hiveLetterSet, shuffleInPlace } from "@shared/game";

export function Room() {
  const { code } = useParams();
  const [name, setName] = useState(getStoredName);
  const [joinedName, setJoinedName] = useState(() => (getStoredName().trim() ? getStoredName() : ""));
  const { status, error, room, you, event, submit, setEvent } = useHiveSocket(code, joinedName);
  const [draft, setDraft] = useState("");
  const [outer, setOuter] = useState<string[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [copied, setCopied] = useState(false);
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (room) setOuter(room.puzzle.letters.slice());
  }, [room?.puzzle.center, room?.puzzle.letters.join("")]);

  useEffect(() => {
    if (!event) return;
    if (event.kind === "found") {
      setFlash("ok");
      setDraft("");
      setMessage(
        event.pangram
          ? `Pangram! ${formatWord(event.word)} +${event.points}${event.byYou ? "" : ` · ${event.playerName}`}`
          : `${formatWord(event.word)} +${event.points}${event.byYou ? "" : ` · ${event.playerName}`}`,
      );
    } else if (event.kind === "reject") {
      setFlash("bad");
      setMessage(REJECT_COPY[event.error]);
    } else {
      setFlash("bad");
      setMessage(event.message);
    }
    const timer = window.setTimeout(() => {
      setFlash(null);
      setMessage(null);
      setEvent(null);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [event, setEvent]);

  const letters = useMemo(
    () => (room ? hiveLetterSet(room.puzzle.center, room.puzzle.letters) : new Set<string>()),
    [room],
  );

  function addLetter(letter: string) {
    if (draft.length >= 20) return;
    setDraft((value) => value + letter);
  }

  function trySubmit() {
    if (!room) return;
    const word = draft.toLowerCase();
    const local = clientCheck(word, room.puzzle.center, letters);
    if (local) {
      setFlash("bad");
      setMessage(REJECT_COPY[local]);
      window.setTimeout(() => {
        setFlash(null);
        setMessage(null);
      }, 1400);
      return;
    }
    if (room.found.some((item) => item.word === word)) {
      setFlash("bad");
      setMessage(REJECT_COPY.already_found);
      window.setTimeout(() => {
        setFlash(null);
        setMessage(null);
      }, 1400);
      return;
    }
    submit(word);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!joinedName || !room) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter") {
        event.preventDefault();
        trySubmit();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setDraft((value) => value.slice(0, -1));
        return;
      }
      if (event.key === " " || event.key === "Tab") {
        event.preventDefault();
        setOuter((current) => shuffleInPlace(current.slice()));
        return;
      }
      const letter = event.key.toLowerCase();
      if (letter.length === 1 && letters.has(letter)) {
        event.preventDefault();
        addLetter(letter);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Our Hive", text: `Join my hive (${code})`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  }

  if (!joinedName.trim()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Room {code}</p>
        <h1 className="mt-2 font-display text-4xl text-ink">What should we call you?</h1>
        <p className="mt-2 text-ink/65">Your name appears on words you find, so your partner can see who got there first.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            storeName(trimmed);
            setJoinedName(trimmed);
          }}
        >
          <Input value={name} maxLength={20} placeholder="Your name" onChange={(event) => setName(event.target.value)} />
          <Button type="submit" size="lg" className="w-full">
            Enter the hive
          </Button>
        </form>
      </div>
    );
  }

  if (status === "error" && !room) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <h1 className="font-display text-4xl text-ink">Hive not found</h1>
        <p className="mt-2 text-ink/65">{error ?? "That room code doesn’t exist."}</p>
        <Link to="/" className="mt-6 text-terracotta underline">
          Create a new hive
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <p className="font-display text-3xl text-ink">Connecting to the hive…</p>
        <p className="mt-2 text-ink/60">Syncing Spellbee letters and the shared word list.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-4 pb-10 lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-8 lg:py-8">
      <div>
        <header className="flex items-center justify-between gap-2">
          <Link to="/" className="font-display text-2xl text-ink">
            Our Hive
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setHelp(true)} aria-label="How to play">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={share}>
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {code}
            </Button>
          </div>
        </header>

        <p className="mt-2 text-sm text-ink/55">
          {room.mode === "daily" ? "Today’s Spellbee" : room.mode === "archive" ? "Spellbee archive" : "Spellbee hive"}
          {room.dateKey ? ` · ${room.dateKey}` : ""} · center {room.puzzle.center.toUpperCase()}
        </p>

        <div className="mt-3">
          <Presence players={room.players} youId={you?.id} />
        </div>
        <div className="mt-4">
          <ProgressRail room={room} />
        </div>

        <p
          className={cn(
            "mt-5 min-h-12 text-center font-display text-3xl tracking-[0.18em] text-ink",
            flash === "bad" && "shake text-terracotta",
            flash === "ok" && "pop text-pine",
          )}
        >
          {draft ? formatWord(draft) : <span className="tracking-normal text-ink/25">Type or tap letters</span>}
        </p>
        <p className="min-h-6 text-center text-sm font-medium text-pine">{message}</p>

        <Honeycomb center={room.puzzle.center} letters={outer} onLetter={addLetter} />

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="hive" size="icon" aria-label="Delete" onClick={() => setDraft((value) => value.slice(0, -1))}>
            <Delete className="h-6 w-6" />
          </Button>
          <Button variant="hive" size="icon" aria-label="Shuffle" onClick={() => setOuter((current) => shuffleInPlace(current.slice()))}>
            <Shuffle className="h-6 w-6" />
          </Button>
          <Button size="lg" onClick={trySubmit}>
            Enter
          </Button>
        </div>
        <p className="mt-3 hidden text-center text-xs text-ink/45 sm:block">Keyboard: letters, Backspace, Enter, Space to shuffle.</p>
      </div>

      <div className="mt-8 lg:mt-0">
        <FoundWords room={room} youId={you?.id} />
      </div>
      <HowToPlay open={help} onClose={() => setHelp(false)} />
    </div>
  );
}
