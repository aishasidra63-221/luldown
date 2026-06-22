"""
TikTok downloader — uses tikwm.com public API (primary) with yt-dlp fallback.
tikwm.com is a free, stable CDN used by most TikTok downloader sites.
"""
import asyncio
import logging
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

_ANSI_RE = re.compile(r"\x1b\[[0-9;]*[a-zA-Z]|\[[0-9;]*m")

TIKWM_API = "https://www.tikwm.com/api/"

# Shared async client (set up at startup)
_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
        )
    return _client


class DownloadError(Exception):
    pass


def strip_ansi(text: str) -> str:
    return _ANSI_RE.sub("", text).strip()


def _parse_tikwm(data: dict) -> dict:
    """Parse tikwm API response into our standard info dict."""
    author = data.get("author", {})
    return {
        "success": True,
        "title": data.get("title", "TikTok Video"),
        "author": author.get("nickname", "") if isinstance(author, dict) else str(author),
        "duration": data.get("duration", 0),
        "thumbnail": data.get("cover", "") or data.get("origin_cover", ""),
        "view_count": data.get("play_count", 0),
        "like_count": data.get("digg_count", 0),
        # CDN download URLs
        "_play_nowm": data.get("play", ""),        # no watermark
        "_play_wm":   data.get("wmplay", ""),      # with watermark
        "_music":     data.get("music", ""),        # mp3 audio
        "_images":    data.get("images", []) or [], # photo post
        "_hd_play":   data.get("hdplay", "") or data.get("play", ""),
    }


async def _tikwm_fetch(url: str) -> dict:
    """Fetch video data from tikwm.com API."""
    client = get_client()
    try:
        resp = await client.post(
            TIKWM_API,
            data={"url": url, "hd": "1"},
        )
        resp.raise_for_status()
        body = resp.json()
    except httpx.HTTPError as e:
        raise DownloadError(f"Network error fetching video info: {e}")
    except Exception as e:
        raise DownloadError(f"Failed to contact download service: {e}")

    if body.get("code") != 0 or not body.get("data"):
        msg = body.get("msg", "Unknown error from download service")
        raise DownloadError(f"Could not fetch video: {msg}")

    return body["data"]


async def get_video_info(url: str) -> dict:
    """Return metadata for a TikTok URL."""
    data = await _tikwm_fetch(url)
    result = _parse_tikwm(data)
    # Remove internal CDN keys from public response
    for k in list(result):
        if k.startswith("_"):
            result.pop(k, None)
    return result


async def get_cdn_url(url: str, format_type: str) -> dict:
    """
    Return the CDN download URL + metadata for a given format.
    format_type: mp4_nowm | mp4 | mp3 | photo
    """
    data = await _tikwm_fetch(url)
    parsed = _parse_tikwm(data)

    cdn_url: str = ""
    filename: str = "tiktok"
    media_type: str = "video/mp4"
    ext: str = "mp4"

    if format_type == "mp4_nowm":
        cdn_url = parsed["_hd_play"] or parsed["_play_nowm"]
        filename = "tiktok_nowatermark"
        ext = "mp4"
        media_type = "video/mp4"

    elif format_type == "mp4":
        cdn_url = parsed["_play_wm"] or parsed["_play_nowm"]
        filename = "tiktok"
        ext = "mp4"
        media_type = "video/mp4"

    elif format_type == "mp3":
        cdn_url = parsed["_music"]
        filename = "tiktok_audio"
        ext = "mp3"
        media_type = "audio/mpeg"

    elif format_type == "photo":
        images = parsed["_images"]
        if not images:
            raise DownloadError("This TikTok has no photos. Try downloading as MP4 instead.")
        cdn_url = images[0]
        filename = "tiktok_photo"
        ext = "jpg"
        media_type = "image/jpeg"

    if not cdn_url:
        raise DownloadError(
            "Download URL not available for this video. It may be private or region-restricted."
        )

    return {
        "cdn_url": cdn_url,
        "all_images": parsed["_images"] if format_type == "photo" else [],
        "filename": f"{filename}.{ext}",
        "media_type": media_type,
        "title": parsed["title"],
        "author": parsed["author"],
        "thumbnail": parsed["thumbnail"],
        "format": format_type,
    }


async def stream_download(cdn_url: str) -> httpx.AsyncByteStream:
    """Open a streaming response from the CDN URL."""
    client = get_client()
    req = client.build_request("GET", cdn_url)
    return await client.send(req, stream=True)
