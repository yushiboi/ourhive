import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Check, HelpCircle, Moon, Share2, Sun, Trophy } from "lucide-react";
import { FoundWords } from "@/components/FoundWords";
import { GameControls } from "@/components/GameControls";
import { HintPanel } from "@/components/HintPanel";
import { Honeycomb } from "@/components/Honeycomb";
import { HowToPlay } from "@/components/HowToPlay";
import { Presence } from "@/components/Presence";
import { RankBar } from "@/components/RankBar";
import { RankingsPanel } from "@/components/RankingsPanel";
import { YesterdayPanel } from "@/components/YesterdayPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHiveSocket } from "@/hooks/useHiveSocket";
import { getStoredName, storeName } from "@/lib/player";
import { applyTheme, getTheme, toggleTheme, type Theme } from "@/lib/theme";
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
  const [hints, setHints] = useState(false);
  const [ranks, setRanks] = useState(false);
  const [yesterday, setYesterday] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (typeof document === "undefined" ? "light" : getTheme()));
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(draft);
  const feedbackTimer = useRef<number>(0);
  draftRef.current = draft;

  const lettersKey = room?.puzzle.letters.join("") ?? "";
  useEffect(() => {
    if (room) setOuter(room.puzzle.letters.slice());
  }, [room, room?.puzzle.center, lettersKey]);

  function showFeedback(kind: "ok" | "bad", text: string) {
    window.clearTimeout(feedbackTimer.current);
    setFlash(kind);
    setMessage(text);
    feedbackTimer.current = window.setTimeout(() => {
      setFlash(null);
      setMessage(null);
    }, 2200);
  }

  useEffect(() => {
    if (!event) return;
    if (event.kind === "found") {
      setDraft("");
      showFeedback(
        "ok",
        event.pangram
          ? `Pangram! ${formatWord(event.word)} +${event.points}${event.byYou ? "" : ` · ${event.playerName}`}`
          : `${formatWord(event.word)} +${event.points}${event.byYou ? "" : ` · ${event.playerName}`}`,
      );
    } else if (event.kind === "reject") {
      showFeedback("bad", REJECT_COPY[event.error]);
    } else {
      showFeedback("bad", event.message);
    }
    setEvent(null);
  }, [event, setEvent]);

  const letters = useMemo(
    () => (room ? hiveLetterSet(room.puzzle.center, room.puzzle.letters) : new Set<string>()),
    [room],
  );

  function focusInput() {
    inputRef.current?.focus();
  }

  function addLetter(letter: string) {
    setDraft((value) => (value.length >= 20 ? value : value + letter));
    focusInput();
  }

  function trySubmit() {
    if (!room) return;
    const word = draftRef.current.toLowerCase();
    const local = clientCheck(word, room.puzzle.center, letters);
    if (local) {
      showFeedback("bad", REJECT_COPY[local]);
      focusInput();
      return;
    }
    if (room.found.some((item) => item.word === word)) {
      showFeedback("bad", REJECT_COPY.already_found);
      focusInput();
      return;
    }
    submit(word);
    focusInput();
  }

  useEffect(() => {
    if (room) focusInput();
  }, [room?.code]);

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
        <p className="mt-2 text-ink/65">{error ?? "That room code doesn’t exist. Create a new hive and send the fresh link."}</p>
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
        <p className="mt-2 text-ink/60">Syncing letters and the shared word list.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-3 pb-10" onClick={focusInput}>
      <header className="flex items-center justify-between gap-2">
        <Link to="/" className="font-display text-xl text-ink">
          Our Hive
        </Link>
        <div className="flex items-center gap-0.5">
          {room.mode === "daily" && (
            <Button variant="ghost" size="sm" aria-label="Yesterday" onClick={() => setYesterday(true)}>
              <CalendarDays className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-label="Rankings" onClick={() => setRanks(true)}>
            <Trophy className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle dark mode"
            onClick={() => {
              const next = toggleTheme();
              applyTheme(next);
              setTheme(next);
            }}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setHelp(true)} aria-label="How to play">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async (event) => {
              event.stopPropagation();
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
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {code}
          </Button>
        </div>
      </header>

      <p className="mt-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-ink/45">
        {room.mode === "daily" ? `Today · ${room.dateKey}` : "Shared hive"}
      </p>
      <div className="mt-2 flex justify-center">
        <Presence players={room.players} youId={you?.id} />
      </div>

      <div className="mt-4">
        <RankBar room={room} onOpenRanks={() => setRanks(true)} />
      </div>

      <div className="mt-4">
        <FoundWords room={room} youId={you?.id} />
      </div>

      <div className="mt-5">
        <input
          ref={inputRef}
          value={formatWord(draft)}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Current word"
          placeholder="Type or tap letters"
          className={cn(
            "h-12 w-full bg-transparent text-center font-display text-3xl tracking-[0.2em] text-ink outline-none placeholder:text-base placeholder:tracking-normal placeholder:text-ink/30",
            flash === "bad" && "shake text-terracotta",
            flash === "ok" && "pop text-pine",
          )}
          onChange={(event) => {
            const next = event.target.value
              .toLowerCase()
              .replace(/[^a-z]/g, "")
              .slice(0, 20);
            setDraft([...next].filter((ch) => letters.has(ch)).join(""));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              trySubmit();
            } else if (event.key === " ") {
              event.preventDefault();
              setOuter((current) => shuffleInPlace(current.slice()));
            }
          }}
        />
        <p
          className={cn(
            "min-h-6 text-center text-sm font-semibold",
            flash === "bad" ? "text-terracotta" : "text-pine",
          )}
          role="status"
        >
          {message}
        </p>
      </div>

      <Honeycomb center={room.puzzle.center} letters={outer} onLetter={addLetter} />

      <GameControls
        onDelete={() => {
          setDraft((value) => value.slice(0, -1));
          focusInput();
        }}
        onHint={() => setHints(true)}
        onShuffle={() => {
          setOuter((current) => shuffleInPlace(current.slice()));
          focusInput();
        }}
        onEnter={trySubmit}
      />

      <HowToPlay open={help} onClose={() => setHelp(false)} />
      <HintPanel open={hints} onClose={() => setHints(false)} hints={room.puzzle.hints} />
      <RankingsPanel open={ranks} onClose={() => setRanks(false)} room={room} />
      <YesterdayPanel open={yesterday} onClose={() => setYesterday(false)} yesterday={room.yesterday} />
    </div>
  );
}
