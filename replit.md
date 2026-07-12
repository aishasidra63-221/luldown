# LulDown — TikTok Downloader

A TikTok video and audio downloader that provides direct CDN links. Supports MP4 (1080p/720p), MP3 audio, and photo posts with no watermark.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Wouter, TanStack Query
- **Dev API:** Python FastAPI (`artifacts/tiktok-api/`) — runs on port 8000, proxied via Vite at `/tikapi`
- **Production API:** Cloudflare Worker (`cloudflare-worker/worker.js`) — deployed separately via Wrangler
- **Monorepo:** pnpm workspaces

## How to run (dev mode)

Two workflows run in parallel:

1. **TikTok API** — Python FastAPI server on port 8000
   ```
   cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py
   ```

2. **Start application** — React/Vite frontend on port 5000
   ```
   PORT=5000 pnpm --filter @workspace/tikdown run dev
   ```

The Vite dev server proxies `/tikapi` → `http://localhost:8000`, so the frontend hits the local Python API in dev mode.

## Environment variables (optional for dev)

| Variable | Purpose |
|---|---|
| `WORKER_URL` | Points frontend to the deployed Cloudflare Worker (production only) |
| `RENDER_URL` | Proxy server URL for CDN streaming (production only) |
| `PROXY_SECRET` | HMAC secret for the proxy (production only) |
| `TOKEN_SECRET` | API request validation token (production only) |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key (optional) |

Without `WORKER_URL` set, the frontend falls back to the local Python API automatically.

## Project structure

```
artifacts/
  tikdown/        # React frontend
  tiktok-api/     # Python FastAPI dev backend
cloudflare-worker/ # Production Cloudflare Worker
lib/              # Shared packages (API specs, Zod schemas, DB)
scripts/          # Workspace utilities
```

## User preferences
