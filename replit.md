# TikDown

A TikTok video downloader with no watermark. Consists of two services:

## Architecture

- **Frontend** (`artifacts/tikdown/`) — React + Vite + Tailwind, multilingual (10 languages), runs on port 5000
- **Backend** (`artifacts/tiktok-api/`) — Python FastAPI, handles TikTok video fetching/downloading, runs on port 8000

The Vite dev server proxies `/tikapi` → `http://localhost:8000`, so the frontend and backend communicate automatically in development.

## How to Run

Both workflows start automatically:
- **TikDown Frontend** — `cd artifacts/tikdown && pnpm dev` (port 5000)
- **TikTok API** — `cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py` (port 8000)

Or run both together with the **Project** workflow.

## Environment Variables / Secrets

| Variable | Used by | Purpose | Required? |
|---|---|---|---|
| `SESSION_SECRET` | Backend | Signs session tokens and admin auth | Yes (set in Replit Secrets) |
| `REDIS_URL` | Backend | Cache (falls back to in-memory if absent) | No |
| `RECAPTCHA_SECRET` | Backend | reCAPTCHA v3 validation | No |
| `WORKER_URL` | Frontend build | Cloudflare Worker URL (production only) | No |

## Package Management

- Frontend: `pnpm` (workspace root, run `pnpm install` from `/`)
- Backend: `pip install -r requirements.txt` (inside `artifacts/tiktok-api/`)

## User Preferences

- Keep existing project structure and stack
