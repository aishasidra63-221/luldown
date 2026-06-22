import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Literal, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from cache import init_redis, cache_get, cache_set, make_cache_key, cache_stats
from downloader import DownloadError, get_video_info, get_cdn_url, stream_download
from history import add_to_history, get_history, clear_history, history_stats
from proxy_pool import build_proxy_pool
from recaptcha import verify_token as verify_recaptcha, is_enabled as recaptcha_enabled
from session import generate_token, verify_token as verify_session_token
from updater import schedule_midnight_update

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(build_proxy_pool())
    asyncio.create_task(init_redis())
    asyncio.create_task(schedule_midnight_update())
    yield


app = FastAPI(title="TikTok Downloader API", version="2.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def validate_tiktok_url(url: str) -> str:
    url = url.strip()
    if "tiktok.com" not in url:
        raise HTTPException(status_code=400, detail="Invalid TikTok URL. Please copy the link from TikTok app.")
    return url


# ─── Models ───────────────────────────────────────────────────────────────────

class DownloadRequest(BaseModel):
    url: str
    format: Literal["mp4", "mp4_nowm", "mp3", "photo"] = "mp4_nowm"
    recaptcha_token: Optional[str] = None
    session_token: Optional[str] = None


class InfoRequest(BaseModel):
    url: str
    recaptcha_token: Optional[str] = None


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.1.0",
        "engine": "tikwm",
        "cache": cache_stats(),
        "history": history_stats(),
        "recaptcha_enabled": recaptcha_enabled(),
    }


@app.get("/api/token")
async def get_session_token():
    token = generate_token()
    return {"token": token, "ttl_seconds": 300}


@app.post("/api/info")
@limiter.limit("20/minute")
async def video_info(request: Request, body: InfoRequest):
    url = validate_tiktok_url(body.url)
    ip = get_client_ip(request)

    if recaptcha_enabled():
        ok, score, _ = await verify_recaptcha(body.recaptcha_token, ip)
        if not ok:
            raise HTTPException(status_code=403, detail="Bot detected")

    cache_key = make_cache_key(url, "info")
    cached = await cache_get(cache_key)
    if cached:
        cached["from_cache"] = True
        return cached

    try:
        info = await get_video_info(url)
    except DownloadError as e:
        raise HTTPException(status_code=422, detail=str(e))

    await cache_set(cache_key, info)
    return info


@app.post("/api/download")
@limiter.limit("10/minute")
async def download(request: Request, body: DownloadRequest):
    url = validate_tiktok_url(body.url)
    ip = get_client_ip(request)

    if body.session_token:
        valid, reason = verify_session_token(body.session_token)
        if not valid:
            raise HTTPException(status_code=401, detail=f"Invalid session: {reason}")

    if recaptcha_enabled():
        ok, _, _ = await verify_recaptcha(body.recaptcha_token, ip)
        if not ok:
            raise HTTPException(status_code=403, detail="Bot detected")

    # Check cache for CDN URL
    cdn_cache_key = make_cache_key(url, body.format + "_cdn")
    cached_cdn = await cache_get(cdn_cache_key)

    try:
        if cached_cdn and cached_cdn.get("cdn_url"):
            cdn_data = cached_cdn
        else:
            cdn_data = await get_cdn_url(url, body.format)
            await cache_set(cdn_cache_key, cdn_data)
    except DownloadError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Save to history
    add_to_history(
        ip=ip,
        url=url,
        title=cdn_data.get("title", ""),
        author=cdn_data.get("author", ""),
        thumbnail=cdn_data.get("thumbnail", ""),
        format_type=body.format,
    )

    cdn_url = cdn_data["cdn_url"]
    filename = cdn_data["filename"]
    media_type = cdn_data["media_type"]

    # Proxy the stream so user downloads from our domain
    try:
        response = await stream_download(cdn_url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch video from CDN: {e}")

    async def iter_content():
        try:
            async for chunk in response.aiter_bytes(chunk_size=65536):
                yield chunk
        finally:
            await response.aclose()

    return StreamingResponse(
        iter_content(),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Video-Title": (cdn_data.get("title") or "")[:100],
            "X-Video-Author": (cdn_data.get("author") or "")[:50],
        },
    )


@app.get("/api/history")
@limiter.limit("30/minute")
async def get_download_history(request: Request):
    ip = get_client_ip(request)
    history = get_history(ip)
    return {"history": history, "count": len(history), "max": 10}


@app.delete("/api/history")
@limiter.limit("10/minute")
async def delete_history(request: Request):
    ip = get_client_ip(request)
    clear_history(ip)
    return {"success": True, "message": "History cleared"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
