# KPL Auctioneer

Standalone control panel for the Kinniya Premier League live auction. It is a
thin client — all auction state lives in the **screen app** (`../kpl`), which
this app reaches over the network.

## Run

1. Start the screen app first (in `../kpl`): `npm run dev` → http://localhost:3000
2. Point this app at it. Same machine works out of the box; for a different
   machine edit `.env.local`:

   ```
   NEXT_PUBLIC_AUCTION_API=http://<screen-machine-ip>:3000
   ```

3. Start this app: `npm run dev` → http://localhost:3001

The auctioneer drives the auction here; every action streams live to the big
screen via the screen app's SSE feed.

## How it talks to the screen app

- `GET  {API}/api/auction/meta`   — roster + tuning (loaded on startup)
- `GET  {API}/api/auction/stream` — live state (SSE)
- `POST {API}/api/auction/action` — auctioneer actions

The screen app sends permissive CORS headers so this separate origin can call it.
