# Our Hive

A cooperative Spelling Bee for two people on FaceTime. Each player opens the same room on their own phone or laptop, keeps their own honeycomb and keyboard, and scores into **one shared list**.

Hives are generated from the public ENABLE English word list. We do not use NYT or Spellbee puzzle data.

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
2. **Today’s hive** (same letters for everyone in that timezone) or **a new hive**.
3. Send the room link — or the 5-letter code — to your partner.
4. Both of you type or tap letters. Valid words lock for everyone as soon as the first player submits them.

## Rules

- 7 letters, one required center letter.
- Words must be at least 4 letters and use only hive letters (reuse allowed).
- 4-letter words = 1 point; longer words = 1 point per letter; pangrams get +7.
- Ranks scale as a percentage of that hive’s max score, up to Genius.
- Hints show word lengths and starting letters, not the answers.

## Tests

```bash
npm test
```
