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
from proxy_pool import build_proxy_pool, pool_stats
from recaptcha import verify_token as verify_recaptcha, is_enabled as recaptcha_enabled
from session import generate_token, verify_token as verify_session_token
from updater import schedule_midnight_update

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


async def _keep_alive(port: int):
    """Ping /health every 14 min so Render free tier stays awake."""
    await asyncio.sleep(60)  # wait for server to be fully up first
    while True:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.get(f"http://localhost:{port}/health")
            logger.info("keep-alive ping sent")
        except Exception as e:
            logger.debug(f"keep-alive ping failed (harmless): {e}")
        await asyncio.sleep(14 * 60)  # 14 minutes


async def _delayed_startup():
    """Delay heavy background tasks so the port opens before network saturation."""
    await asyncio.sleep(5)
    try:
        await asyncio.gather(
            build_proxy_pool(),
            init_redis(),
        )
    except Exception:
        logger.exception("Background startup task failed; server continues running")


@asynccontextmanager
async def lifespan(app: FastAPI):
    port = int(os.environ.get("PORT", 8000))
    asyncio.create_task(_delayed_startup())
    asyncio.create_task(schedule_midnight_update())
    asyncio.create_task(_keep_alive(port))
    yield


app = FastAPI(title="TikTok Downloader API", version="2.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


_ALLOWED_TIKTOK_HOSTS = {
    "tiktok.com", "www.tiktok.com", "vm.tiktok.com",
    "vt.tiktok.com", "m.tiktok.com",
}

_ALLOWED_CDN_DOMAINS = [
    "tiktok.com", "tiktokcdn.com", "tiktokv.com",
    "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com",
]

_CDN_FETCH_HEADERS = {
    "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer":         "https://www.tiktok.com/",
    "Origin":          "https://www.tiktok.com",
    "Accept":          "*/*",
    "Accept-Encoding": "identity",
    "Range":           "bytes=0-",
    "Sec-Fetch-Dest":  "video",
}

PROXY_SECRET = os.environ.get("PROXY_SECRET", "")

def validate_tiktok_url(url: str) -> str:
    from urllib.parse import urlparse
    url = url.strip()
    try:
        parsed = urlparse(url)
        host = parsed.netloc.lower().split(":")[0]
        if parsed.scheme not in ("https", "http") or host not in _ALLOWED_TIKTOK_HOSTS:
            raise ValueError
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid TikTok URL. Please copy the link from TikTok app.")
    return url


# ─── Models ───────────────────────────────────────────────────────────────────

class DownloadRequest(BaseModel):
    url: str
    format: Literal["mp4_720", "mp4_1080", "mp3"] = "mp4_1080"
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
        "engine": "tiktok-html-direct",
        "cache": cache_stats(),
        "history": history_stats(),
        "proxy_pool": pool_stats(),
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
@limiter.limit("20/minute")
async def download(request: Request, body: DownloadRequest):
    """
    Returns a direct CDN URL — zero server bandwidth used.
    Frontend downloads straight from TikTok CDN.
    """
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

    # Cache CDN URLs (30 min TTL)
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

    # Return CDN URL directly — no streaming, no server bandwidth
    return JSONResponse({
        "success": True,
        "cdn_url": cdn_data["cdn_url"],
        "all_images": cdn_data.get("all_images", []),
        "filename": cdn_data["filename"],
        "media_type": cdn_data["media_type"],
        "title": cdn_data.get("title", ""),
        "author": cdn_data.get("author", ""),
        "format": body.format,
    })


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


# ─── Render Proxy ──────────────────────────────────────────────────────────────

@app.get("/proxy")
@limiter.limit("30/minute")
async def proxy_cdn(request: Request, url: str, filename: str = "luldown.mp4"):
    """
    Stream TikTok CDN file through this server.
    Called by Cloudflare Worker with x-proxy-secret header.
    Adds 7 browser-like headers so TikTok CDN accepts the request.
    """
    from urllib.parse import unquote

    # Verify shared secret (Worker → Render)
    incoming = request.headers.get("x-proxy-secret", "")
    if PROXY_SECRET and incoming != PROXY_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Decode and validate CDN URL
    cdn_url = unquote(url)
    if not cdn_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")
    if not any(d in cdn_url for d in _ALLOWED_CDN_DOMAINS):
        raise HTTPException(status_code=403, detail="Only TikTok CDN URLs are supported")

    # Detect media type from filename
    if filename.endswith(".mp3"):
        media_type = "audio/mpeg"
    else:
        media_type = "video/mp4"

    async def _stream():
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(120.0, connect=15.0),
        ) as client:
            async with client.stream("GET", cdn_url, headers=_CDN_FETCH_HEADERS) as resp:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk

    return StreamingResponse(
        _stream(),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
        },
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    workers = int(os.environ.get("WORKERS", 2))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=workers, reload=False)
