"""
TikTok downloader — Direct TikTok Mobile API (aweme/v1/feed)
ssstik-style: no third parties, no proxy pool needed.

Phase 1: TikTok public oembed API  → title, author, thumbnail (metadata)
Phase 2: TikTok mobile API (aweme) → CDN video URL (no watermark baked in)

play_addr URLs from the mobile API are watermark-free when fetched server-side
because the TikTok app overlays the watermark client-side during playback.
"""
import asyncio
import logging
import random
import re
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class DownloadError(Exception):
    pass


# ── TikTok Mobile API hosts ───────────────────────────────────────────────────
MOBILE_API_HOSTS = [
    "api22-normal-c-useast2a.tiktokv.com",
    "api16-normal-c-useast1a.tiktokv.com",
    "api19-normal-c-useast1a.tiktokv.com",
    "api21-normal-c-alisg.tiktokv.com",
    "api26-normal-c-useast2a.tiktokv.com",
]

# ── Android device profiles ───────────────────────────────────────────────────
ANDROID_DEVICES = [
    {"model": "Pixel 6",            "build": "SD1A.210817.015.A4",  "android": "12", "dpi": "411"},
    {"model": "Pixel 7",            "build": "TD1A.220804.009.A2",  "android": "13", "dpi": "411"},
    {"model": "Pixel 8",            "build": "UP1A.231005.007",     "android": "14", "dpi": "428"},
    {"model": "Pixel 7a",           "build": "UP1A.231005.007",     "android": "14", "dpi": "429"},
    {"model": "SM-S921B",           "build": "UP1A.231005.007",     "android": "14", "dpi": "393"},
    {"model": "SM-S918B",           "build": "UP1A.231005.007",     "android": "14", "dpi": "393"},
    {"model": "SM-A546E",           "build": "TP1A.220624.014",     "android": "13", "dpi": "397"},
    {"model": "SM-A135F",           "build": "TP1A.220624.014",     "android": "13", "dpi": "401"},
    {"model": "Redmi Note 12",      "build": "TKQ1.220829.002",     "android": "13", "dpi": "395"},
    {"model": "Redmi Note 12 Pro",  "build": "TKQ1.220829.002",     "android": "13", "dpi": "395"},
    {"model": "POCO X5 Pro",        "build": "TKQ1.220829.002",     "android": "13", "dpi": "395"},
    {"model": "vivo V29e",          "build": "TP1A.220624.014",     "android": "13", "dpi": "393"},
    {"model": "OPPO A77 5G",        "build": "TP1A.220624.014",     "android": "13", "dpi": "401"},
    {"model": "motorola moto g84",  "build": "T2SNS33.73-11-15",    "android": "13", "dpi": "400"},
]


def _random_device() -> dict:
    return random.choice(ANDROID_DEVICES)


def _random_host() -> str:
    return random.choice(MOBILE_API_HOSTS)


def _random_device_id() -> str:
    return str(random.randint(10**17, 10**18 - 1))


def _build_mobile_ua(device: dict, version: str = "300904") -> str:
    return (
        f"com.ss.android.ugc.trill/{version} "
        f"(Linux; U; Android {device['android']}; en_US; {device['model']}; "
        f"Build/{device['build']}; Cronet/TTNetVersion:c5b2a578 3d6d7cd7 MultiProcessNotSupport)"
    )


# ── Phase 1: oembed for metadata ──────────────────────────────────────────────

async def _fetch_oembed(tiktok_url: str) -> dict:
    endpoint = f"https://www.tiktok.com/oembed?url={tiktok_url}"
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=8.0),
        follow_redirects=True,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://www.tiktok.com/",
        },
        http2=True,
    ) as client:
        resp = await client.get(endpoint)
        resp.raise_for_status()
        return resp.json()


# ── Short URL resolution ──────────────────────────────────────────────────────

_BROWSER_UA = (
    "Mozilla/5.0 (Linux; Android 14; SM-S921B) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.6422.82 Mobile Safari/537.36"
)


async def _resolve_url(url: str) -> str:
    """Follow redirects and return the final URL with browser-like headers."""
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=8.0),
        follow_redirects=True,
        headers={
            "User-Agent":      _BROWSER_UA,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer":         "https://www.tiktok.com/",
        },
    ) as client:
        resp = await client.get(url)
        return str(resp.url), resp.text


def _extract_video_id_from_text(text: str) -> Optional[str]:
    """Try to find a video ID inside page HTML (meta, JSON-LD, etc.)."""
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


def _extract_video_id_from_url(url: str) -> Optional[str]:
    match = re.search(r"/video/(\d{10,20})", url)
    return match.group(1) if match else None


async def _get_video_id(tiktok_url: str) -> str:
    # Fast path — full URL already has the video ID
    vid = _extract_video_id_from_url(tiktok_url)
    if vid:
        return vid

    # Short link or /t/ link — follow redirects with browser UA
    try:
        final_url, html = await _resolve_url(tiktok_url)
    except Exception as e:
        raise DownloadError(f"Could not resolve URL: {e}")

    # Check the resolved URL
    vid = _extract_video_id_from_url(final_url)
    if vid:
        return vid

    # Scrape the HTML for the video ID
    vid = _extract_video_id_from_text(html)
    if vid:
        return vid

    raise DownloadError(
        "Could not extract video ID. Make sure the link is a valid public TikTok video."
    )


# ── Phase 2: TikTok Mobile API ────────────────────────────────────────────────

async def _fetch_mobile_api(video_id: str) -> dict:
    device  = _random_device()
    host    = _random_host()
    version = "300904"
    app_ver = "30.9.4"
    dev_id  = _random_device_id()

    params = {
        "aweme_id":              video_id,
        "version_code":          version,
        "version_name":          app_ver,
        "app_name":              "musical_ly",
        "app_version":           app_ver,
        "channel":               "App",
        "device_id":             dev_id,
        "os_version":            device["android"],
        "device_platform":       "android",
        "device_type":           device["model"],
        "resolution":            f"{device['dpi']}*{device['dpi']}",
        "dpi":                   device["dpi"],
        "app_type":              "normal",
        "manifest_version_code": "2022600030",
        "ts":                    str(int(time.time())),
    }

    ua = _build_mobile_ua(device, version)
    url = f"https://{host}/aweme/v1/feed/"

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(20.0, connect=8.0),
        follow_redirects=True,
        http2=True,
        headers={
            "User-Agent":  ua,
            "Accept":      "application/json",
            "sdk-version": "2",
            "X-SS-DP":     "1233",
        },
    ) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    aweme_list = data.get("aweme_list", [])
    if not aweme_list:
        raise DownloadError("Video not found or private")

    return aweme_list[0]


# ── Parse aweme response ──────────────────────────────────────────────────────

def _parse_aweme(aweme: dict) -> dict:
    video   = aweme.get("video", {})
    music   = aweme.get("music", {})
    author  = aweme.get("author", {})
    stats   = aweme.get("statistics", {})
    img_post = aweme.get("image_post_info")

    images: list[str] = []
    if img_post:
        for img in img_post.get("images", []):
            urls = (
                img.get("display_image", {}).get("url_list", [])
                or img.get("owner_watermark_image", {}).get("url_list", [])
            )
            if urls:
                images.append(urls[0])

    is_photo = len(images) > 0

    bit_rates = sorted(
        [b for b in video.get("bit_rate", []) if b.get("play_addr", {}).get("url_list")],
        key=lambda b: b.get("bit_rate", 0),
        reverse=True,
    )

    hd_url    = (bit_rates[0]["play_addr"]["url_list"][0] if bit_rates
                 else (video.get("play_addr", {}).get("url_list", [""])[0]))
    sd_url    = (bit_rates[1]["play_addr"]["url_list"][0] if len(bit_rates) > 1
                 else video.get("play_addr", {}).get("url_list", [""])[0] or hd_url)
    audio_url = music.get("play_url", {}).get("url_list", [""])[0]

    thumbnail = (
        video.get("cover", {}).get("url_list", [""])[0]
        or video.get("origin_cover", {}).get("url_list", [""])[0]
        or ""
    )

    return {
        "success":    True,
        "title":      aweme.get("desc", "TikTok Video"),
        "author":     author.get("nickname") or author.get("unique_id", ""),
        "duration":   int((aweme.get("duration") or video.get("duration") or 0) / 1000),
        "thumbnail":  thumbnail,
        "view_count": stats.get("play_count", 0),
        "like_count": stats.get("digg_count", 0),
        "is_photo":   is_photo,
        "images":     images,
        "_hd_url":    hd_url,
        "_sd_url":    sd_url,
        "_audio_url": audio_url,
    }


# ── Public interface ──────────────────────────────────────────────────────────

async def get_video_info(url: str) -> dict:
    video_id = await _get_video_id(url)
    aweme    = await _fetch_mobile_api(video_id)
    result   = _parse_aweme(aweme)

    if not result["thumbnail"]:
        try:
            oembed = await _fetch_oembed(url)
            result["thumbnail"] = oembed.get("thumbnail_url", "")
            if not result["title"] or result["title"] == "TikTok Video":
                result["title"] = oembed.get("title", result["title"])
            if not result["author"]:
                result["author"] = oembed.get("author_name", "")
        except Exception:
            pass

    for k in list(result):
        if k.startswith("_"):
            result.pop(k, None)

    return result


async def get_cdn_url(url: str, format_type: str) -> dict:
    video_id = await _get_video_id(url)
    aweme    = await _fetch_mobile_api(video_id)
    parsed   = _parse_aweme(aweme)

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


async def stream_download(cdn_url: str) -> httpx.AsyncByteStream:
    device = _random_device()
    ua     = _build_mobile_ua(device)
    client = httpx.AsyncClient(
        headers={"User-Agent": ua},
        follow_redirects=True,
    )
    req = client.build_request("GET", cdn_url)
    return await client.send(req, stream=True)
