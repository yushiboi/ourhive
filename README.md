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

## Deploy

This is a single Node process: Vite/React/TypeScript UI plus an Express + `ws` server. There is no PartyKit, no database, and no API keys. Production (`npm run build && npm start`) serves the built client and the WebSocket game API on one port (`PORT`, default `4317`).

### Preferred: Render Web Service

1. Put the repo on GitHub (from the Origin project, use **Create repo** if you have not already).
2. In [Render](https://render.com), **New → Web Service** and connect that GitHub repo.
3. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Instance:** Free or Starter
4. Leave **Environment** empty except Render’s own `PORT` (do not set secrets).
5. Deploy. Open the `https://….onrender.com` URL on both phones, create a hive, and share the room link.

Render free instances sleep after idle time; the first load may take a minute. After wake, create a new room — in-memory rooms do not survive restarts.

### Alternative: Railway or Fly.io

Same build/start: `npm install && npm run build`, then `npm start`. Bind is already `0.0.0.0`. Set only `PORT` if the platform does not inject it.

### Same-day tunnel (this machine)

```bash
npm run build
PORT=4329 NODE_ENV=production npm start
cloudflared tunnel --url http://127.0.0.1:4329
```

Share the `https://….trycloudflare.com` URL. It lasts only while this process (and this VM) stay up.

### What not to use without a rewrite

- **Vercel / Netlify / Cloudflare Pages:** no long-lived WebSocket process.
- **PartyKit:** would replace the Express/`ws` server; not in this repo.
