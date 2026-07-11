# Luldown — TikTok Downloader

TikTok video/audio downloader that gives users direct CDN links (no server bandwidth used).

## Run & Operate

- `pnpm --filter @workspace/tikdown run dev` — React frontend (port 5000)
- `cd artifacts/tiktok-api && PORT=8000 python main.py` — Python API (local dev fallback)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Workflows (Replit)

- **artifacts/tikdown: web** — React frontend (webview, port assigned by Replit)
- **TikTok API** — Python FastAPI on port 8000 (console, local dev only)

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS 4 + Radix UI
- Backend: Cloudflare Worker (`cloudflare-worker/worker.js`) — production
- Backend (dev): Python FastAPI (`artifacts/tiktok-api/`) — local dev proxy
- DB: PostgreSQL + Drizzle ORM (schema currently empty — history is localStorage)

## Where things live

- `artifacts/tikdown/` — React frontend
- `artifacts/tikdown/src/lib/api.ts` — all API calls (source of truth)
- `artifacts/tikdown/vite.config.ts` — Vite config, proxy, env vars
- `cloudflare-worker/worker.js` — Cloudflare Worker (production backend)
- `cloudflare-worker/wrangler.toml` — Worker deployment config
- `artifacts/tiktok-api/` — Python FastAPI (local dev only)
- `lib/db/` — Drizzle schema

## Architecture decisions

- **Direct TikTok page fetch — no third-party extraction API.** The backend (`artifacts/tiktok-api/downloader.py`) hits `https://www.tiktok.com/@_/video/{id}` directly with rotating real Chrome/Android User-Agents and browser headers, then parses the embedded `__UNIVERSAL_DATA_FOR_REHYDRATION__` / `SIGI_STATE` JSON for title, author, stats, and CDN links. No mobile-app API, no tikwm.com or similar service.
- **Cloudflare Worker as backend** — No server needed in production. Cloudflare's global IPs replace the proxy pool. Rate limiting is CF built-in. It should do the same direct page-fetch approach as the Python dev API, not call a third-party extraction service.
- **CDN-direct downloads** — Server returns CDN URL only, browser fetches file directly from TikTok CDN. Zero server bandwidth.
- **History in localStorage** — Fully private, no server storage needed.
- **`WORKER_URL` env var** — Set this to your deployed worker URL. If empty, dev proxy (`/tikapi` → Python on 8000) is used automatically.

## Deploying the Cloudflare Worker

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler deploy
# Copy the *.workers.dev URL, set it as WORKER_URL env var in Replit Secrets
```

## Product

- Paste any TikTok URL → fetch video info (title, author, thumbnail, stats)
- Download as MP4 1080p, MP4 720p (no watermark), or MP3 192kbps
- Photo posts: download individual images or all at once
- Download history saved locally (last 10, auto-FIFO)

## User preferences

- Cloudflare Worker preferred over Python server for production backend
- No proxy pool, no 4-layer bypass, no random delays — Cloudflare handles it
- Keep things simple: 3 fake Chrome headers (UA + Referer + Language) only

## Gotchas

- `WORKER_URL` must be set in Replit Secrets after deploying the worker, otherwise dev uses Python API on port 8000
- Python API uses in-memory cache (no Redis) and 0 healthy proxies — fine for local dev, not for production
- Worker rate limit: 20 req/60s per IP (configured in `wrangler.toml`)
