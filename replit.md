# LulDown — TikTok Video Downloader

A TikTok video downloader that strips watermarks and supports MP4/MP3 output.

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query, Wouter
- **Dev backend:** Python 3.11 + FastAPI (`artifacts/tiktok-api/`) — proxied from Vite at `/tikapi`
- **Production backend:** Cloudflare Worker (`cloudflare-worker/worker.js`)
- **Monorepo:** pnpm workspaces

## How to run

Two workflows run concurrently:

| Workflow | Command | Port |
|---|---|---|
| **Start application** | `PORT=5000 pnpm --filter @workspace/tikdown run dev` | 5000 |
| **TikTok API** | `cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py` | 8000 |

Install dependencies once with `pnpm install` from the repo root before starting.

## Optional environment variables

| Variable | Purpose |
|---|---|
| `WORKER_URL` | Cloudflare Worker URL (production API) |
| `RENDER_URL` | Render.com fallback URL |
| `PROXY_SECRET` | Shared secret between frontend and worker |
| `TOKEN_SECRET` | JWT signing secret |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key |

These are optional in dev — the Python backend handles scraping locally without them.

## Key directories

- `artifacts/tikdown/` — React frontend
- `artifacts/tiktok-api/` — Python FastAPI dev backend
- `cloudflare-worker/` — Production Cloudflare Worker
- `lib/` — Shared packages (`api-spec`, `api-zod`, `db`)

## User preferences

_None recorded yet._
