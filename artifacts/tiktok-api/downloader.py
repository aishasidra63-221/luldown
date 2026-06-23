"""
TikTok downloader — tikwm.com API with 4-layer bypass:
  Layer 1: Rotating proxy (country-tagged)
  Layer 2: Country-matched User-Agent
  Layer 3: Country-matched Accept-Language
  Layer 4: Rotating Referer
Random delay 0.5–2.5 s before each request.
Bad proxies auto-evicted on failure.

Formats:
  mp4_720  — no-watermark standard quality
  mp4_1080 — no-watermark HD (hdplay)
  mp3      — audio 192kbps
"""
import asyncio
import logging
import re
from typing import Optional

import httpx

from bypass import get_bypass_headers, random_delay
from proxy_pool import get_random_proxy, remove_proxy

logger = logging.getLogger(__name__)

_ANSI_RE = re.compile(r"\x1b\[[0-9;]*[a-zA-Z]|\[[0-9;]*m")

TIKWM_API = "https://www.tikwm.com/api/"

MAX_RETRIES = 3   # tries: proxy1 → proxy2 → no-proxy fallback


class DownloadError(Exception):
    pass


def strip_ansi(text: str) -> str:
    return _ANSI_RE.sub("", text).strip()


def _parse_tikwm(data: dict) -> dict:
    author = data.get("author", {})
    images = data.get("images", []) or []
    return {
        "success":     True,
        "title":       data.get("title", "TikTok Video"),
        "author":      author.get("nickname", "") if isinstance(author, dict) else str(author),
        "duration":    data.get("duration", 0),
        "thumbnail":   data.get("cover", "") or data.get("origin_cover", ""),
        "view_count":  data.get("play_count", 0),
        "like_count":  data.get("digg_count", 0),
        "is_photo":    len(images) > 0,
        "_images":     images,
        "_play_nowm":  data.get("play", ""),
        "_play_wm":    data.get("wmplay", ""),
        "_music":      data.get("music", ""),
        "_hd_play":    data.get("hdplay", "") or data.get("play", ""),
    }


async def _do_request(proxy_url: Optional[str], country: Optional[str], url: str) -> dict:
    """One attempt at fetching from tikwm using given proxy + bypass headers."""
    headers = get_bypass_headers(country)

    proxy_map = (
        {"http://": proxy_url, "https://": proxy_url}
        if proxy_url else None
    )

    async with httpx.AsyncClient(
        proxies=proxy_map,
        timeout=httpx.Timeout(25.0, connect=8.0),
        follow_redirects=True,
        headers=headers,
        http2=True,
    ) as client:
        resp = await client.post(
            TIKWM_API,
            data={"url": url, "hd": "1"},
        )
        resp.raise_for_status()
        return resp.json()


async def _tikwm_fetch(url: str) -> dict:
    """
    Fetch video data from tikwm.com with proxy rotation + 4-layer bypass.
    Tries up to MAX_RETRIES times; last attempt is always direct (no proxy).
    """
    last_error: Optional[Exception] = None

    for attempt in range(MAX_RETRIES):
        is_last = attempt == MAX_RETRIES - 1
        proxy_url: Optional[str] = None
        country: Optional[str] = None

        if not is_last:
            picked = get_random_proxy()
            if picked:
                proxy_url, country = picked

        await random_delay()

        try:
            body = await _do_request(proxy_url, country, url)
        except Exception as e:
            last_error = e
            if proxy_url:
                remove_proxy(proxy_url)
                logger.warning(f"Proxy {proxy_url} failed ({e}), removed. Attempt {attempt+1}/{MAX_RETRIES}")
            else:
                logger.warning(f"Direct request failed: {e}")
            continue

        if body.get("code") != 0 or not body.get("data"):
            msg = body.get("msg", "Unknown error from download service")
            if proxy_url:
                logger.info(f"tikwm error via proxy {proxy_url}: {msg}")
            raise DownloadError(f"Could not fetch video: {msg}")

        if proxy_url:
            logger.info(f"tikwm success via proxy [{country}] {proxy_url}")
        else:
            logger.info("tikwm success via direct request")

        return body["data"]

    raise DownloadError(
        f"Download service unreachable after {MAX_RETRIES} attempts. "
        f"Last error: {last_error}"
    )


async def get_video_info(url: str) -> dict:
    data = await _tikwm_fetch(url)
    result = _parse_tikwm(data)
    # Expose images for photo posts (CDN URLs — frontend displays directly)
    result["images"] = result.pop("_images", [])
    # Strip internal-only keys
    for k in list(result):
        if k.startswith("_"):
            result.pop(k, None)
    return result


async def get_cdn_url(url: str, format_type: str) -> dict:
    data = await _tikwm_fetch(url)
    parsed = _parse_tikwm(data)

    cdn_url: str = ""
    filename: str = "luldown"
    media_type: str = "video/mp4"
    ext: str = "mp4"

    if format_type == "mp4_720":
        cdn_url = parsed["_play_nowm"] or parsed["_hd_play"]
        filename = "luldown_720p"
        ext = "mp4"
        media_type = "video/mp4"

    elif format_type == "mp4_1080":
        cdn_url = parsed["_hd_play"] or parsed["_play_nowm"]
        filename = "luldown_1080p"
        ext = "mp4"
        media_type = "video/mp4"

    elif format_type == "mp3":
        cdn_url = parsed["_music"]
        filename = "luldown_audio"
        ext = "mp3"
        media_type = "audio/mpeg"

    else:
        raise DownloadError(f"Unknown format: {format_type}")

    if not cdn_url:
        raise DownloadError(
            "Download URL not available. The video may be private or region-restricted."
        )

    return {
        "cdn_url":    cdn_url,
        "filename":   f"{filename}.{ext}",
        "media_type": media_type,
        "title":      parsed["title"],
        "author":     parsed["author"],
        "thumbnail":  parsed["thumbnail"],
        "format":     format_type,
    }


async def stream_download(cdn_url: str) -> httpx.AsyncByteStream:
    headers = get_bypass_headers()
    client = httpx.AsyncClient(headers=headers, follow_redirects=True)
    req = client.build_request("GET", cdn_url)
    return await client.send(req, stream=True)
