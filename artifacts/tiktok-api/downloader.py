"""
TikTok downloader — direct browser-style page fetch (single method).

Just like a real browser opening the video page:
  1. Resolve the video ID from the URL (follow redirects for short links)
  2. Fetch https://www.tiktok.com/@_/video/{id} with real browser headers
  3. Parse the JSON TikTok embeds in the page (__UNIVERSAL_DATA_FOR_REHYDRATION__ /
     SIGI_STATE / __NEXT_DATA__)
  4. Pull title, author, stats and CDN URLs straight out of that JSON

No mobile app API, no third-party services — one path only.
"""
import json as _json
import logging
import random
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class DownloadError(Exception):
    pass


# ── Rotating desktop browser User-Agents ─────────────────────────────────────
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]


def _random_ua() -> str:
    return random.choice(_USER_AGENTS)


_BROWSER_HEADERS = {
    "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language":           "en-US,en;q=0.9",
    "Referer":                   "https://www.tiktok.com/",
    "Sec-Fetch-Dest":            "document",
    "Sec-Fetch-Mode":            "navigate",
    "Sec-Fetch-Site":            "same-origin",
    "Sec-Fetch-User":            "?1",
    "Upgrade-Insecure-Requests": "1",
    "Priority":                  "u=0, i",
}

# Number of attempts before giving up. On a static dev IP this mostly just
# retries with a different UA/header fingerprint (limited benefit — the IP
# doesn't change). In production behind Cloudflare Workers, each attempt can
# land on a different anycast edge IP, which is where retrying actually helps.
_PAGE_FETCH_ATTEMPTS = 2


# ── Step 1: resolve the video ID from any URL shape ──────────────────────────

_REGION_BLOCK_PATHS = ("/in/about", "/about", "/restricted", "/unavailable")


def _extract_video_id_from_url(url: str) -> Optional[str]:
    match = re.search(r"/video/(\d{10,20})", url)
    return match.group(1) if match else None


def _extract_video_id_from_text(text: str) -> Optional[str]:
    for pattern in [
        r'"/video/(\d{15,20})"',
        r'"aweme_id"\s*:\s*"(\d{15,20})"',
        r'"video_id"\s*:\s*"(\d{15,20})"',
        r'/video/(\d{15,20})',
    ]:
        m = re.search(pattern, text)
        if m:
            return m.group(1)
    return None


async def _get_video_id(tiktok_url: str) -> str:
    # Fast path — full URL already has the video ID
    vid = _extract_video_id_from_url(tiktok_url)
    if vid:
        return vid

    # Short link (vm./vt./ /t/) — follow redirects like a real browser would
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=8.0),
        follow_redirects=True,
        headers={"User-Agent": _random_ua(), **_BROWSER_HEADERS},
    ) as client:
        try:
            resp = await client.get(tiktok_url)
        except Exception as e:
            raise DownloadError(f"Could not resolve URL: {e}")
        final_url, html = str(resp.url), resp.text

    if any(p in final_url for p in _REGION_BLOCK_PATHS):
        raise DownloadError(
            "Short link could not be resolved — TikTok is restricted in this server region. "
            "Please paste the full video URL (e.g. https://www.tiktok.com/@username/video/1234...) instead of a short link."
        )

    vid = _extract_video_id_from_url(final_url)
    if vid:
        return vid

    vid = _extract_video_id_from_text(html)
    if vid:
        return vid

    raise DownloadError(
        "Could not extract video ID. Make sure the link is a valid public TikTok video."
    )


# ── Step 2: fetch the TikTok video page directly ─────────────────────────────

async def _fetch_tiktok_page_once(video_id: str) -> str:
    url = f"https://www.tiktok.com/@_/video/{video_id}"
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=8.0),
        follow_redirects=True,
        headers={"User-Agent": _random_ua(), **_BROWSER_HEADERS},
    ) as client:
        resp = await client.get(url)

        final_path = resp.url.path
        if "/about" in final_path or "/login" in final_path:
            raise DownloadError("TikTok blocked this server IP (redirected to /about).")

        if resp.status_code != 200:
            raise DownloadError(f"TikTok page returned HTTP {resp.status_code}")

        return resp.text


async def _fetch_tiktok_page(video_id: str) -> str:
    last_error: Optional[Exception] = None
    for _attempt in range(_PAGE_FETCH_ATTEMPTS):
        try:
            return await _fetch_tiktok_page_once(video_id)
        except DownloadError as e:
            last_error = e
    raise last_error


# ── Step 3: parse the embedded JSON out of the page HTML ─────────────────────

def _extract_json_from_html(html: str) -> Optional[dict]:
    for script_id, source in (
        ("__UNIVERSAL_DATA_FOR_REHYDRATION__", "universal"),
        ("SIGI_STATE", "sigi"),
        ("__NEXT_DATA__", "next"),
    ):
        m = re.search(
            rf'<script\s+id="{script_id}"[^>]*>([\s\S]*?)</script>', html
        )
        if not m:
            continue
        try:
            return {"data": _json.loads(m.group(1)), "source": source}
        except Exception:
            continue
    return None


def _safe_get(obj, *keys):
    cur = obj
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def _first_str(*vals) -> str:
    for v in vals:
        if isinstance(v, str) and v:
            return v
    return ""


def _first_num(*vals):
    for v in vals:
        if isinstance(v, (int, float)):
            return v
    return 0


def _parse_item_struct(item: dict) -> dict:
    video  = item.get("video") or {}
    music  = item.get("music") or {}
    author = item.get("author") or {}
    stats  = item.get("stats") or item.get("statistics") or {}
    img_post = item.get("imagePost") or item.get("image_post_info")

    images: list[str] = []
    if img_post:
        for img in img_post.get("images", []):
            url = _first_str(
                _safe_get(img, "displayImage", "urlList", 0)
                if isinstance(_safe_get(img, "displayImage", "urlList"), list)
                else "",
                (img.get("display_image") or {}).get("url_list", [""])[0]
                if (img.get("display_image") or {}).get("url_list") else "",
                (img.get("ownerWatermarkImage") or {}).get("urlList", [""])[0]
                if (img.get("ownerWatermarkImage") or {}).get("urlList") else "",
            )
            if url:
                images.append(url)

    is_photo = len(images) > 0

    video_hd = _first_str(
        video.get("downloadAddr"), video.get("download_addr"),
        video.get("playAddr"), video.get("play_addr"),
    )
    video_sd = _first_str(
        video.get("playAddr"), video.get("play_addr"), video_hd,
    )
    audio_url = _first_str(music.get("playUrl"), music.get("play_url"))
    thumbnail = _first_str(
        video.get("cover"), video.get("originCover"),
        video.get("origin_cover"), video.get("dynamicCover"),
    )

    author_name = _first_str(
        author.get("uniqueId"), author.get("unique_id"), author.get("nickname"),
    )
    author_avatar = _first_str(
        author.get("avatarMedium"), author.get("avatar_medium"),
        author.get("avatarThumb"), author.get("avatar_thumb"),
        author.get("avatarLarger"), author.get("avatar_larger"),
    )

    return {
        "success":       True,
        "title":         item.get("desc") or "TikTok Video",
        "author":        f"@{author_name}" if author_name else "",
        "author_avatar": author_avatar,
        "duration":      int(_first_num(video.get("duration"))),
        "thumbnail":     thumbnail,
        "view_count":    int(_first_num(stats.get("playCount"), stats.get("play_count"))),
        "like_count":    int(_first_num(stats.get("diggCount"), stats.get("digg_count"))),
        "comment_count": int(_first_num(stats.get("commentCount"), stats.get("comment_count"))),
        "share_count":   int(_first_num(stats.get("shareCount"), stats.get("share_count"))),
        "is_photo":      is_photo,
        "images":        images,
        "_hd_url":       video_hd,
        "_sd_url":       video_sd,
        "_audio_url":    audio_url,
    }


def _parse_page_data(parsed: dict, video_id: str) -> dict:
    data, source = parsed["data"], parsed["source"]
    item = None

    if source == "universal":
        item = (
            _safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "itemStruct")
            or _safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "item")
        )

    if not item and source == "sigi":
        item_module = _safe_get(data, "ItemModule")
        if item_module:
            item = item_module.get(video_id) or next(iter(item_module.values()), None)
        if not item:
            item = _safe_get(data, "itemInfo", "itemStruct")

    if not item and source == "next":
        item = (
            _safe_get(data, "props", "pageProps", "itemInfo", "itemStruct")
            or _safe_get(data, "props", "pageProps", "videoData")
        )

    if not item:
        raise DownloadError("Video data not found in TikTok page. The video may be private or deleted.")

    return _parse_item_struct(item)


# ── Step 4: full pipeline — one path, direct page fetch ──────────────────────

async def _get_video_data(url: str) -> dict:
    video_id = await _get_video_id(url)
    html     = await _fetch_tiktok_page(video_id)
    parsed   = _extract_json_from_html(html)

    if not parsed:
        raise DownloadError("TikTok page structure changed — could not find embedded JSON. Please try again.")

    return _parse_page_data(parsed, video_id)


# ── Public interface ──────────────────────────────────────────────────────────

async def get_video_info(url: str) -> dict:
    result = await _get_video_data(url)

    result["download_urls"] = {
        "mp4_1080": result.pop("_hd_url", ""),
        "mp4_720":  result.pop("_sd_url", ""),
        "mp3":      result.pop("_audio_url", ""),
    }
    return result


async def get_cdn_url(url: str, format_type: str) -> dict:
    parsed = await _get_video_data(url)

    cdn_url    = ""
    filename   = "luldown"
    media_type = "video/mp4"
    ext        = "mp4"

    if format_type == "mp4_1080":
        cdn_url  = parsed["_hd_url"]
        filename = "luldown_1080p"
    elif format_type == "mp4_720":
        cdn_url  = parsed["_sd_url"]
        filename = "luldown_720p"
    elif format_type == "mp3":
        cdn_url    = parsed["_audio_url"]
        filename   = "luldown_audio"
        ext        = "mp3"
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


async def stream_download(cdn_url: str) -> httpx.Response:
    client = httpx.AsyncClient(
        headers={"User-Agent": _random_ua(), "Referer": "https://www.tiktok.com/"},
        follow_redirects=True,
    )
    req = client.build_request("GET", cdn_url)
    return await client.send(req, stream=True)
