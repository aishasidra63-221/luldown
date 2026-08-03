# TikDown — TikTok Video Downloader

A full-stack TikTok video downloader with a React/Vite frontend and a Python FastAPI backend.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (`artifacts/tikdown`)
- **Backend**: Python FastAPI (`artifacts/tiktok-api`)
- **Package manager**: pnpm (workspace monorepo)

## How to run (development)

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| `artifacts/tikdown: web` | `pnpm --filter @workspace/tikdown run dev` | 25828 |
| `TikTok API` | `cd artifacts/tiktok-api && python3 main.py` | 8000 |

The Vite dev server proxies `/tikapi/*` → `http://localhost:8000` so the frontend and API run as one origin.

## Production build (with static prerendering)

```bash
pnpm --filter @workspace/tikdown run prerender
```

This runs `vite build` then `tsx prerender.mts` to generate static HTML for all **174 routes** (20 lang × tool pages + blog posts + competitor pages). Each route gets its own `dist/public/<route>/index.html` with full HTML content injected — Google indexes instantly without waiting for JS.

Key files:
- `artifacts/tikdown/src/entry-server.tsx` — SSR render entry (not bundled into client)
- `artifacts/tikdown/prerender.mts` — prerender script, run after build

## Environment / secrets

| Secret | Purpose |
|---|---|
| `SESSION_SECRET` | Session token signing |
| `CLOUDFLARE_API_TOKEN` | Cloudflare deployment (Workers / Pages) |

Optional (app works without them):
- **Redis**: Falls back to in-memory cache if unavailable.
- **reCAPTCHA**: Feature-flagged; disabled when no site key is set.

## Project structure

```
artifacts/
  tikdown/          # React frontend (Vite artifact)
  tiktok-api/       # FastAPI backend
scripts/            # Post-merge setup script
```

## User preferences

<!-- Add remembered preferences here -->
