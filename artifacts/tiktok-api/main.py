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

from cache import init_redis, cache_get, cache_set, make_cache_key, cache_stats, cache_flush, _mem_cache
from downloader import DownloadError, get_video_info, get_cdn_url, stream_download, get_raw_item
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


# This service is only ever called browser-side through the Vite dev proxy
# (same-origin — CORS doesn't apply) or server-side from the Cloudflare
# Worker/Render (not a browser — CORS doesn't apply there either). "*" was
# wide open for no real benefit; restrict to the actual production/dev
# origins in case this ever gets hit directly from a browser.
_ALLOWED_CORS_ORIGINS = [
    "https://luldown.com",
    "https://www.luldown.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https://luldown\.com$|^https://www\.luldown\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
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


@app.post("/api/debug/raw")
@limiter.limit("20/minute")
async def debug_raw(request: Request, body: InfoRequest):
    """Returns raw itemStruct summary — for dev debugging only.
    Disabled by default (fail-closed): only works if ENABLE_DEBUG_ENDPOINTS=1
    is explicitly set. Previously this had zero protection (no auth, no rate
    limit) and could be hit directly to pull raw TikTok data for free."""
    if os.environ.get("ENABLE_DEBUG_ENDPOINTS") != "1":
        raise HTTPException(status_code=404, detail="Not found")
    url = validate_tiktok_url(body.url)
    try:
        return await get_raw_item(url)
    except DownloadError as e:
        raise HTTPException(status_code=422, detail=str(e))


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


# ─── Admin ────────────────────────────────────────────────────────────────────

@app.post("/api/admin/flush")
async def admin_flush_cache(request: Request):
    """Flush all in-memory (and Redis if available) cache entries.
    Use after deploying a fix so stale cached CDN URLs stop being served.
    Gated by SESSION_SECRET env var if set."""
    from session import SECRET_KEY
    admin_key = os.environ.get("SESSION_SECRET", "")
    auth = request.headers.get("x-admin-key", "")
    # Fail-closed: if SESSION_SECRET isn't configured, refuse rather than
    # silently letting anyone flush the cache with no key at all.
    if not admin_key or auth != admin_key:
        raise HTTPException(status_code=403, detail="Forbidden — set x-admin-key header")
    before = len(_mem_cache)
    await cache_flush()
    return {"flushed": True, "entries_cleared": before, "backend": cache_stats()["backend"]}


@app.get("/api/admin/cache-check")
async def admin_cache_check(request: Request):
    """Return current cache state: backend, entry count, and a sample of keys.
    Useful to confirm a fresh request stored a new URL correctly."""
    admin_key = os.environ.get("SESSION_SECRET", "")
    auth = request.headers.get("x-admin-key", "")
    # Fail-closed: no configured secret means no access, not open access.
    if not admin_key or auth != admin_key:
        raise HTTPException(status_code=403, detail="Forbidden — set x-admin-key header")
    stats = cache_stats()
    sample_keys = list(_mem_cache.keys())[:20]
    return {**stats, "sample_keys": sample_keys}


# ─── Render Proxy ──────────────────────────────────────────────────────────────

@app.get("/api/proxy")
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

    # Decode and validate CDN URL — parse hostname to prevent SSRF via substring tricks
    from urllib.parse import urlparse
    cdn_url = unquote(url)
    try:
        parsed = urlparse(cdn_url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("bad scheme")
        host = parsed.netloc.lower().split(":")[0]
        if not host or not any(host == d or host.endswith("." + d) for d in _ALLOWED_CDN_DOMAINS):
            raise ValueError("disallowed host")
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="Only TikTok CDN URLs are supported") from exc

    # Fallback media type guessed from the filename extension — only used if
    # the CDN response doesn't send a usable Content-Type header of its own.
    lower_name = filename.lower()
    if lower_name.endswith(".mp3"):
        fallback_media_type = "audio/mpeg"
    elif lower_name.endswith(".webp"):
        fallback_media_type = "image/webp"
    elif lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
        fallback_media_type = "image/jpeg"
    elif lower_name.endswith(".png"):
        fallback_media_type = "image/png"
    else:
        fallback_media_type = "video/mp4"

    # StreamingResponse needs its media_type up front, before any bytes are
    # sent — so open the upstream connection first (this returns headers as
    # soon as the CDN responds, before the body is read) to learn the real
    # Content-Type, then stream the body through afterwards.
    client = httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(120.0, connect=15.0),
    )
    try:
        req = client.build_request("GET", cdn_url, headers=_CDN_FETCH_HEADERS)
        resp = await client.send(req, stream=True)
    except Exception as exc:
        await client.aclose()
        raise HTTPException(status_code=502, detail="Failed to fetch from TikTok CDN") from exc

    if resp.is_error:
        await resp.aclose()
        await client.aclose()
        raise HTTPException(status_code=resp.status_code, detail="TikTok CDN returned an error")

    cdn_content_type = resp.headers.get("content-type", "").split(";")[0].strip()
    # Ignore generic/unhelpful upstream types so the filename-based fallback
    # still wins for those cases.
    if cdn_content_type and not cdn_content_type.startswith(
        ("application/octet-stream", "text/html", "text/plain")
    ):
        media_type = cdn_content_type
    else:
        media_type = fallback_media_type

    async def _stream():
        try:
            async for chunk in resp.aiter_bytes(chunk_size=65536):
                yield chunk
        finally:
            await resp.aclose()
            await client.aclose()

    response_headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
    }
    content_length = resp.headers.get("content-length")
    if content_length:
        response_headers["Content-Length"] = content_length

    return StreamingResponse(
        _stream(),
        media_type=media_type,
        headers=response_headers,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    workers = int(os.environ.get("WORKERS", 2))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=workers, reload=False)
