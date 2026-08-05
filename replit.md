# TikDown — TikTok Video Downloader

A full-stack TikTok video downloader with a React frontend and Python FastAPI backend.

## Project structure

```
artifacts/
  tikdown/        # React + Vite frontend (port 5000)
  tiktok-api/     # Python FastAPI backend (port 8000)
```

## How to run

Two workflows must be running simultaneously:

1. **TikDown Frontend** — `cd artifacts/tikdown && pnpm dev`
   - Serves the UI on port 5000
   - Proxies `/tikapi/*` requests to the backend at port 8000

2. **TikTok API** — `cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py`
   - FastAPI server on port 8000
   - Handles video info fetching, downloading, and streaming

## Frontend stack

- React 19 + Vite 7
- Tailwind CSS v4
- Wouter (routing)
- TanStack Query
- 10-language i18n with static prerendering (174 routes)
- PWA support

## Backend stack

- Python FastAPI + Uvicorn
- yt-dlp for video downloading
- In-memory cache (Redis optional)
- Rate limiting via slowapi
- reCAPTCHA v3 support

## Environment secrets

- `SESSION_SECRET` — used for session token signing
- `CLOUDFLARE_API_TOKEN` — Cloudflare integration (e.g. cache purge or Workers)

## User preferences

<!-- Add user preferences here as they are confirmed -->
