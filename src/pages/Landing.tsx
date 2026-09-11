import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Hexagon, HelpCircle } from "lucide-react";
import { HowToPlay } from "@/components/HowToPlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom, listPublishedDays, type PublishedDay } from "@/lib/api";
import { getStoredName, storeName } from "@/lib/player";

export function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState(getStoredName);
  const [joinCode, setJoinCode] = useState("");
  const [days, setDays] = useState<PublishedDay[]>([]);
  const [busy, setBusy] = useState<"daily" | "fresh" | "archive" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    listPublishedDays()
      .then(setDays)
      .catch(() => setDays([]));
  }, []);

  function requireName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Add a display name so your partner can see who found each word.");
      return null;
    }
    storeName(trimmed);
    return trimmed;
  }

  async function start(mode: "daily" | "fresh", date?: string) {
    if (!requireName()) return;
    setBusy(date ? "archive" : mode);
    setError(null);
    try {
      const room = await createRoom({ mode: date ? "archive" : mode, date });
      navigate(room.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open a hive");
    } finally {
      setBusy(null);
    }
  }

  function join(event: FormEvent) {
    event.preventDefault();
    if (!requireName()) return;
    const code = joinCode.toUpperCase().replace(/[^A-Z]/g, "");
    if (code.length < 4) {
      setError("Enter the 5-letter room code from your partner.");
      return;
    }
    setBusy("join");
    navigate(`/r/${code}`);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pb-16">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-pine">
            <Hexagon className="h-4 w-4 fill-honey text-honey-ink" />
            Our Hive
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink">Spell together on FaceTime.</h1>
          <p className="mt-2 text-ink/70">
            Two phones, one Spellbee hive, one score. Words either of you find lock for both of you.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setHelp(true)} aria-label="How to play">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </header>

      <label className="mt-8 block text-sm font-medium text-ink">
        Your name
        <Input
          className="mt-1.5"
          value={name}
          maxLength={20}
          autoComplete="nickname"
          placeholder="What should we call you?"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className="mt-6 grid gap-3">
        <Button size="lg" disabled={busy !== null} onClick={() => start("daily")}>
          {busy === "daily" ? "Opening today’s hive…" : "Play today’s Spellbee"}
        </Button>
        <Button variant="honey" size="lg" disabled={busy !== null} onClick={() => start("fresh")}>
          {busy === "fresh" ? "Finding a hive…" : "Play another Spellbee hive"}
        </Button>
      </div>

      {days.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-pine/80">Published days</h2>
          <p className="mt-1 text-sm text-ink/60">Same letter sets Spellbee is showing right now.</p>
          <ul className="mt-3 grid gap-2">
            {days
              .slice()
              .reverse()
              .map((day) => (
                <li key={day.date}>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => start("daily", day.date)}
                    className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-left hover:border-pine/30"
                  >
                    <span>
                      <span className="block font-medium">{day.date}</span>
                      <span className="text-sm text-ink/55">
                        Center {day.center.toUpperCase()} · {day.wordCount} words
                      </span>
                    </span>
                    <span className="font-mono text-sm tracking-widest text-pine">{day.code}</span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      <form onSubmit={join} className="mt-8 rounded-3xl border border-ink/8 bg-white/60 p-4">
        <h2 className="font-display text-2xl text-ink">Join a room</h2>
        <p className="mt-1 text-sm text-ink/60">Ask your partner for the 5-letter code, or open their link.</p>
        <div className="mt-3 flex gap-2">
          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="K7MNP"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono tracking-[0.3em]"
          />
          <Button type="submit" variant="outline" disabled={busy !== null}>
            Join
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">{error}</p>}

      <HowToPlay open={help} onClose={() => setHelp(false)} />
    </div>
  );
}
