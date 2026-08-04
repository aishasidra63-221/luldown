# LulDown — TikTok Video Downloader

A full-stack TikTok video downloader with no-watermark support, MP3 extraction, multilingual SEO pages, and a download history tracker.

## Stack

- **Frontend** (`artifacts/tikdown`): React 19 + Vite + Tailwind CSS v4 + Wouter + TanStack Query
- **Backend** (`artifacts/tiktok-api`): Python FastAPI + yt-dlp + uvicorn

## How to run

The **Project** workflow starts both services in parallel:

| Service | Port | Command |
|---|---|---|
| TikTok API (backend) | 8000 | `cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py` |
| TikDown Frontend | 5000 | `cd artifacts/tikdown && pnpm dev` |

The preview pane shows the frontend on port 5000.

## User preferences

_(add any preferences here)_
