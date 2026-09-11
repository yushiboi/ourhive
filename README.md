# Our Hive

A cooperative [Spelling Bee](https://en.wikipedia.org/wiki/Spelling_Bee_(puzzle)) for two people on FaceTime. Each player opens the same room on their own phone or laptop, keeps their own honeycomb and keyboard, and scores into **one shared list**.

Hives are **Spellbee’s published puzzles** — today’s daily, the days they currently list, or another hive from their catalog. This app does not scrape NYT and does not generate its own letter sets.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317). The Vite dev server proxies `/api` and `/ws` to the game server on port `4318`.

Production-style:

```bash
npm run build
npm start
```

`npm start` serves the built client and WebSocket API together on port `4317` (or `PORT`).

## Play

1. Enter a display name.
2. **Play today’s Spellbee** (same letters as spellbee.org for your timezone) or **another Spellbee hive** (`/random` from their catalog).
3. Send the room link — or the 5-letter code — to your partner.
4. Both of you type or tap letters. Valid words lock for everyone as soon as the first player submits them.

## Rules

- 7 letters, one required center letter.
- Words must be at least 4 letters and use only hive letters (reuse allowed).
- 4-letter words = 1 point; longer words = 1 point per letter; pangrams get +7.
- Ranks use Spellbee’s thresholds for that hive, with a bar toward Genius.
- The server checks answers against Spellbee’s dictionary for that puzzle.

## Tests

```bash
npm test
```
