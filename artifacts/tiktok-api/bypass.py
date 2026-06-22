import random
import asyncio
from typing import Optional

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
]

ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "id-ID,id;q=0.9,en;q=0.8",
    "pt-BR,pt;q=0.9,en;q=0.8",
]

# TikTok API hostnames to try
TIKTOK_API_HOSTS = [
    "api22-normal-c-useast2a.tiktokv.com",
    "api19-normal-c-useast1a.tiktokv.com",
    "api16-normal-c-useast1a.tiktokv.com",
]


def get_bypass_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": random.choice(ACCEPT_LANGUAGES),
        "Referer": "https://www.tiktok.com/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


async def random_delay():
    await asyncio.sleep(random.uniform(0.5, 2.5))


def build_ydl_opts(
    format_type: str,
    output_path: str,
    proxy: Optional[str] = None,
    api_host: Optional[str] = None,
) -> dict:
    headers = get_bypass_headers()
    host = api_host or random.choice(TIKTOK_API_HOSTS)

    opts: dict = {
        "outtmpl": output_path,
        "http_headers": headers,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        # Force TikTok mobile API — avoids geo-redirect issues
        "extractor_args": {
            "tiktok": {
                "api_hostname": [host],
                "app_version": ["20.9.3"],
                "manifest_app_version": ["291"],
            }
        },
    }

    if proxy:
        opts["proxy"] = proxy

    if format_type in ("mp4", "mp4_nowm"):
        opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
        opts["merge_output_format"] = "mp4"

    elif format_type == "mp3":
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]

    elif format_type == "photo":
        opts["format"] = "best"
        opts["write_all_thumbnails"] = True
        opts["skip_download"] = True

    return opts
