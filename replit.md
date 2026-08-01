# TikDown — TikTok Video Downloader

A full-stack TikTok video downloader with a React/Vite frontend and a Python FastAPI backend.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (`artifacts/tikdown`)
- **Backend**: Python FastAPI (`artifacts/tiktok-api`)
- **Package manager**: pnpm (workspace monorepo)

## How to run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| `artifacts/tikdown: web` | `pnpm --filter @workspace/tikdown run dev` | 25828 |
| `TikTok API` | `cd artifacts/tiktok-api && python3 main.py` | 8000 |

The Vite dev server proxies `/tikapi/*` → `http://localhost:8000` so the frontend and API run as one origin.

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
