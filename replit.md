# LulDown — TikTok Video Downloader

A full-stack TikTok video downloader with no-watermark downloads, MP3 extraction, and multilingual support.

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`artifacts/tikdown`)
- **Backend**: Python FastAPI (`artifacts/tiktok-api`)

## Running the project

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| `artifacts/tikdown: web` | `pnpm --filter @workspace/tikdown run dev` | auto (proxied) |
| `TikTok API` | `cd artifacts/tiktok-api && pip install --user -r requirements.txt -q && PORT=8000 WORKERS=1 python3 main.py` | 8000 |

The frontend proxies `/tikapi/*` requests to the backend at `http://localhost:8000`.

## Installing dependencies

```bash
# JS/TS (from workspace root)
pnpm install

# Python (handled automatically by the TikTok API workflow)
pip install --user -r artifacts/tiktok-api/requirements.txt
```

## Project structure

```
artifacts/
  tikdown/          # React frontend
    src/
      pages/        # Route pages
      components/   # UI components
      i18n/         # Translations (10 languages)
  tiktok-api/       # FastAPI backend
    main.py         # Entry point
    downloader.py   # yt-dlp video fetching
    cache.py        # In-memory / Redis cache
    history.py      # Download history
    session.py      # Session tokens
```

## User preferences
