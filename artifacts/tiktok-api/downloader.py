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
from html import unescape
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class DownloadError(Exception):
    pass


# ── Rotating desktop browser User-Agents — Chrome only ───────────────────────
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
]


def _random_ua() -> str:
    return random.choice(_USER_AGENTS)


# Fixed 7-header set (+ User-Agent set separately) — always en-US language,
# no session priming / cookies.
_BROWSER_HEADERS = {
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer":         "https://www.tiktok.com/",
    "Sec-Fetch-Dest":  "document",
    "Sec-Fetch-Mode":  "navigate",
    "Sec-Fetch-Site":  "same-origin",
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

    # Short link (vm.tiktok.com, vt.tiktok.com, tiktok.com/t/) —
    # Step 1: HEAD request to follow redirects without downloading body.
    # This is fast and sufficient in most cases.
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=8.0),
        follow_redirects=True,
        headers={"User-Agent": _random_ua(), **_BROWSER_HEADERS},
    ) as client:
        try:
            head_resp = await client.head(tiktok_url)
            final_url = str(head_resp.url)
            vid = _extract_video_id_from_url(final_url)
            if vid:
                logger.info("Short URL resolved via HEAD: %s → %s", tiktok_url, final_url)
                return vid
        except Exception as e:
            logger.debug("HEAD request failed for short URL (%s), falling back to GET: %s", tiktok_url, e)
            final_url = tiktok_url  # reset so GET is attempted cleanly

        # Step 2: HEAD didn't yield an ID (some servers block HEAD or don't
        # redirect properly) — fall back to a full GET and search the HTML too.
        try:
            get_resp = await client.get(tiktok_url)
        except Exception as e:
            raise DownloadError(f"Could not resolve URL: {e}")

        final_url = str(get_resp.url)
        html      = get_resp.text

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
    # Try __remixContext first (primary format we target now)
    m = re.search(
        r"<script[^>]*>\s*window\.__remixContext\s*=\s*({[\s\S]*?})\s*;?\s*</script>",
        html,
    )
    if not m:
        m = re.search(
            r'<script\s+id="__remixContext"[^>]*>([\s\S]*?)</script>', html
        )
    if m:
        try:
            return {"data": _json.loads(m.group(1)), "source": "remix"}
        except Exception:
            pass

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


def _find_item_deep(node, video_id: Optional[str], depth: int = 0, seen=None):
    """Recursive fallback — finds a TikTok item object by shape rather than
    a fixed path, since Remix route-loader keys vary by build."""
    if seen is None:
        seen = set()
    if not isinstance(node, (dict, list)) or depth > 8 or id(node) in seen:
        return None
    seen.add(id(node))

    if isinstance(node, dict):
        looks_like_item = (
            (node.get("video") or node.get("imagePost") or node.get("image_post_info"))
            and (node.get("author") or node.get("stats") or node.get("statistics"))
        )
        if looks_like_item and (
            not video_id or node.get("id") == video_id or node.get("itemId") == video_id
        ):
            return node
        values = node.values()
    else:
        values = node

    for v in values:
        if isinstance(v, (dict, list)):
            found = _find_item_deep(v, video_id, depth + 1, seen)
            if found:
                return found
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


def _resolver_url(url_list) -> str:
    """Mirror the worker's resolverUrl(): each url_list usually holds direct
    time-signed CDN links (expire in hours) plus one resolver link
    (.../play/?...&signaturev3=...) that resolves live and never expires.
    Always prefer the signaturev3 link when present.
    NOTE: Use only for VIDEO URLs. For music use _music_url() instead."""
    if not url_list or not isinstance(url_list, list):
        return ""
    for u in url_list:
        if isinstance(u, str) and "signaturev3" in u:
            return u
    for u in url_list:
        if isinstance(u, str) and u.startswith("http"):
            return u
    return ""


def _music_url(url_list) -> str:
    """Pick the best audio CDN URL from a music url_list.

    Priority (mirrors Worker's musicPickUrl):
      1. ies-music canonical CDN  — globally accessible, no shard routing needed
      2. musically-maliva-obj     — shard-specific, needs /api/resolve probing
      3. any non-signaturev3 URL  — direct fallback
      4. any http URL             — last resort

    Always avoids signaturev3 resolver links — TikTok returns
    {"success":-1, "code":4008} for music (unlike video where it gives 302)."""
    if not url_list or not isinstance(url_list, list):
        return ""
    # 1. ies-music canonical (v16-ies-music.tiktokcdn.com or similar)
    ies = next((u for u in url_list if isinstance(u, str) and "ies-music" in u), "")
    if ies:
        return ies
    # 2. musically-maliva-obj shard URL
    maliva = next((u for u in url_list if isinstance(u, str) and "musically-maliva-obj" in u), "")
    if maliva:
        return maliva
    # 3. Any non-signaturev3 direct URL
    for u in url_list:
        if isinstance(u, str) and u.startswith("http") and "signaturev3" not in u:
            return u
    # 4. Last resort
    for u in url_list:
        if isinstance(u, str) and u.startswith("http"):
            return u
    return ""


async def _resolve_audio_via_ssstik(tiktok_url: str) -> str:
    """Resolve audio when TikTok detail metadata has no music.play_url.

    SSSTik's public result page exposes a tikcdn.io music wrapper containing
    TikTok's separate audio-asset resolver. This is only an audio fallback;
    video URLs continue to come directly from TikTok.
    """
    browser_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }
    try:
        timeout = httpx.Timeout(20.0, connect=8.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            landing = await client.get("https://ssstik.io/", headers=browser_headers)
            if landing.status_code >= 400:
                return ""
            token_match = re.search(r"\bs_tt\s*=\s*['\"]([^'\"]+)['\"]", landing.text)
            form_match = re.search(r"\bs_furl\s*=\s*['\"]([^'\"]+)['\"]", landing.text)
            token = token_match.group(1) if token_match else ""
            form_path = form_match.group(1) if form_match else "abc"
            if not token:
                return ""

            result = await client.post(
                f"https://ssstik.io/{form_path}?url=dl",
                data={"id": tiktok_url, "locale": "en", "tt": token},
                headers={
                    **browser_headers,
                    "Accept": "text/html, */*; q=0.01",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "HX-Request": "true",
                    "HX-Current-URL": "https://ssstik.io/",
                    "HX-Target": "target",
                    "HX-Trigger": "main_page_text",
                    "Origin": "https://ssstik.io",
                    "Referer": "https://ssstik.io/",
                },
            )
            if result.status_code >= 400:
                return ""

            for match in re.finditer(r"<a\b([^>]*)>(.*?)</a>", result.text, re.I | re.S):
                attrs, label = match.group(1), match.group(2)
                if not re.search(r"\b(?:music|mp3)\b", f"{attrs} {label}", re.I):
                    continue
                href_match = re.search(r"\bhref\s*=\s*['\"]([^'\"]+)['\"]", attrs, re.I)
                if not href_match:
                    continue
                href = unescape(href_match.group(1))
                parsed = httpx.URL(href)
                if (
                    parsed.scheme == "https"
                    and parsed.host == "tikcdn.io"
                    and parsed.path.startswith("/ssstik/m/")
                ):
                    return str(parsed)
    except Exception as exc:
        logger.debug("SSSTik audio fallback failed: %s", exc)
    return ""


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

    # 1080p no-watermark: extract from bit_rate array by gear_name
    video_1080p = ""
    bit_rate = video.get("bitRate") or video.get("bit_rate") or []
    for entry in bit_rate:
        gear_name = entry.get("gearName") or entry.get("gear_name") or ""
        if "1080p" in gear_name:
            play_addr = entry.get("playAddr") or entry.get("play_addr") or {}
            url_list = play_addr.get("urlList") or play_addr.get("url_list") or []
            if url_list:
                video_1080p = url_list[0]
            break

    video_hd = video_1080p or _first_str(
        video.get("downloadAddr"), video.get("download_addr"),
        video.get("playAddr"), video.get("play_addr"),
    )
    video_sd = _first_str(
        video.get("playAddr"), video.get("play_addr"),
    )

    # MP3: music.play_url.url_list -> prefer direct musically-maliva-obj CDN URLs
    # (these return 200 and can be streamed directly via /api/proxy shard probing).
    # signaturev3 resolver links do NOT work for music — TikTok returns JSON
    # {"success":-1, "code":4008} instead of a redirect, so we avoid them here.
    _music_play_url = music.get("play_url") or music.get("playUrl") or {}
    audio_url = ""
    if isinstance(_music_play_url, dict):
        _url_list = _music_play_url.get("url_list") or _music_play_url.get("urlList") or []
        audio_url = _music_url(_url_list) or _music_play_url.get("uri") or ""
    elif isinstance(_music_play_url, str):
        audio_url = _music_play_url
    # Prefer origin_cover (highest quality) over the default low-res "cover"
    # placeholder, falling back to dynamicCover only if neither exists.
    thumbnail = _first_str(
        video.get("originCover"), video.get("origin_cover"),
        video.get("cover"),
        video.get("dynamicCover"), video.get("dynamic_cover"),
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

    if source == "remix":
        loader_data = (
            _safe_get(data, "state", "loaderData") or _safe_get(data, "loaderData") or {}
        )
        for route_data in (loader_data or {}).values():
            item = (
                _safe_get(route_data, "videoInfo", "itemInfo", "itemStruct")
                or _safe_get(route_data, "itemInfo", "itemStruct")
                or _safe_get(route_data, "itemStruct")
            )
            if item:
                break
        if not item:
            item = _find_item_deep(data, video_id)

    if not item and source == "universal":
        item = (
            _safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "itemStruct")
            or _safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "item")
        )

    if not item and source == "sigi":
        item_module = _safe_get(data, "ItemModule")
        if item_module:
            # Only accept an exact video_id match — never fall back to a
            # random/unrelated item in the module (that silently returned the
            # wrong video's music/title in some cases).
            item = item_module.get(video_id)
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


def _audio_debug_summary(item: dict) -> dict:
    """Return bounded, JSON-safe evidence for investigating hidden audio data.

    This intentionally reports identifiers and URL locations rather than the
    whole item payload. It is only exposed through the protected debug route.
    """
    music_objects = {
        "music": item.get("music") or {},
        "added_sound_music_info": item.get("added_sound_music_info")
        or item.get("addedSoundMusicInfo")
        or {},
    }
    result: dict = {
        "music_object_keys": {
            name: list(value.keys()) if isinstance(value, dict) else type(value).__name__
            for name, value in music_objects.items()
        },
        "identifiers": {},
        "extra": {},
        "original_song_asset_ids": [],
        "audio_url_candidates": [],
        "resolver_urls": [],
        "candidate_32hex": [],
        "relevant_fields": [],
    }

    def add_identifier(source: str, key: str, value) -> None:
        if value not in (None, "") and isinstance(value, (str, int, float, bool)):
            result["identifiers"].setdefault(source, {})[key] = str(value)

    for source, music in music_objects.items():
        if not isinstance(music, dict):
            continue
        for key in ("mid", "id_str", "id", "music_ugid", "music_vid", "video_id", "file_id"):
            if key in music:
                add_identifier(source, key, music[key])

        extra = music.get("extra")
        if isinstance(extra, str):
            try:
                extra = _json.loads(extra)
            except Exception:
                extra = {"_parse_error": True, "raw_prefix": extra[:500]}
        if isinstance(extra, dict):
            result["extra"][source] = {
                key: str(extra[key])
                for key in (
                    "music_vid",
                    "extract_item_id",
                    "original_song_url",
                    "owner_id",
                    "resource_status",
                )
                if key in extra
            }
            original_url = extra.get("original_song_url")
            if isinstance(original_url, str):
                match = re.search(r"/([0-9]{10,25})\.mp3(?:[?#]|$)", original_url)
                if match:
                    result["original_song_asset_ids"].append(
                        {
                            "source": f"{source}.extra.original_song_url",
                            "asset_id": match.group(1),
                            "url": original_url,
                        }
                    )

        play = music.get("play_url") or music.get("playUrl")
        if isinstance(play, dict):
            for key in ("uri", "url_list", "urlList"):
                value = play.get(key)
                if isinstance(value, list):
                    result["audio_url_candidates"].extend(
                        {"source": f"{source}.play_url.{key}", "url": str(url)}
                        for url in value
                        if isinstance(url, str) and url.startswith(("http://", "https://"))
                    )
                elif isinstance(value, str) and value.startswith(("http://", "https://")):
                    result["audio_url_candidates"].append(
                        {"source": f"{source}.play_url.{key}", "url": value}
                    )

    def walk(value, path="item"):
        if isinstance(value, dict):
            for key, child in value.items():
                child_path = f"{path}.{key}"
                key_lower = str(key).lower()
                if isinstance(child, (str, int, float, bool)) or child is None:
                    text = "" if child is None else str(child)
                    relevant = any(
                        term in key_lower
                        for term in ("music", "audio", "play", "file", "sign", "url", "uri")
                    )
                    if relevant and len(result["relevant_fields"]) < 300:
                        result["relevant_fields"].append(
                            {"path": child_path, "value": text[:2000]}
                        )
                    if re.fullmatch(r"(?i)[a-f0-9]{32}", text):
                        if len(result["candidate_32hex"]) < 300:
                            result["candidate_32hex"].append(
                                {"path": child_path, "value": text}
                            )
                    if text.startswith(("http://", "https://")):
                        if "/aweme/v1/play/" in text and "signaturev3" in text:
                            if len(result["resolver_urls"]) < 100:
                                result["resolver_urls"].append(
                                    {"path": child_path, "url": text}
                                )
                        if any(term in key_lower for term in ("music", "audio", "play")):
                            if len(result["audio_url_candidates"]) < 300:
                                result["audio_url_candidates"].append(
                                    {"source": child_path, "url": text}
                                )
                else:
                    walk(child, child_path)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, f"{path}[{index}]")

    walk(item)
    # De-duplicate URLs while preserving their first source path.
    for key in ("audio_url_candidates", "resolver_urls"):
        seen = set()
        unique = []
        for entry in result[key]:
            if entry["url"] not in seen:
                seen.add(entry["url"])
                unique.append(entry)
        result[key] = unique
    return result


# ── Step 4: full pipeline — one path, direct page fetch ──────────────────────

async def _get_video_data(url: str) -> dict:
    video_id = await _get_video_id(url)
    html     = await _fetch_tiktok_page(video_id)
    parsed   = _extract_json_from_html(html)

    if not parsed:
        raise DownloadError("TikTok page structure changed — could not find embedded JSON. Please try again.")

    result = _parse_page_data(parsed, video_id)
    if not result.get("_audio_url", "").startswith(("http://", "https://")):
        fallback_audio = await _resolve_audio_via_ssstik(url)
        if fallback_audio:
            result["_audio_url"] = fallback_audio
            logger.info("Obtained SSSTik audio resolver fallback")
    return result


# ── Public interface ──────────────────────────────────────────────────────────

async def get_raw_item(url: str) -> dict:
    """Return the raw itemStruct from TikTok page — no custom parsing."""
    video_id = await _get_video_id(url)
    html     = await _fetch_tiktok_page(video_id)
    parsed   = _extract_json_from_html(html)
    if not parsed:
        raise DownloadError("Could not find embedded JSON in TikTok page.")
    data, source = parsed["data"], parsed["source"]
    item = None
    if source == "remix":
        loader_data = (_safe_get(data, "state", "loaderData") or _safe_get(data, "loaderData") or {})
        for route_data in (loader_data or {}).values():
            item = (_safe_get(route_data, "videoInfo", "itemInfo", "itemStruct")
                    or _safe_get(route_data, "itemInfo", "itemStruct")
                    or _safe_get(route_data, "itemStruct"))
            if item: break
    if not item and source == "universal":
        item = (_safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "itemStruct")
                or _safe_get(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "item"))
    if not item and source == "sigi":
        item_module = _safe_get(data, "ItemModule")
        if item_module:
            # Only accept an exact video_id match — never fall back to a
            # random/unrelated item in the module (that silently returned the
            # wrong video's music/title in some cases).
            item = item_module.get(video_id)
        if not item:
            item = _safe_get(data, "itemInfo", "itemStruct")
    if not item and source == "next":
        item = (_safe_get(data, "props", "pageProps", "itemInfo", "itemStruct")
                or _safe_get(data, "props", "pageProps", "videoData"))
    if not item:
        raise DownloadError("Video data not found.")

    video = item.get("video") or {}
    music = item.get("music") or {}

    def summarise_url_obj(obj):
        if not obj: return None
        return {
            "keys":     list(obj.keys()) if isinstance(obj, dict) else type(obj).__name__,
            "url_list": obj.get("url_list", []) if isinstance(obj, dict) else [],
            "urlList":  obj.get("urlList",  []) if isinstance(obj, dict) else [],
            "uri":      obj.get("uri",       "") if isinstance(obj, dict) else "",
        }

    bit_rate_raw = video.get("bit_rate") or video.get("bitRate") or []

    return {
        "source": source,
        "video_top_keys": list(video.keys()),
        "music_top_keys": list(music.keys()),
        "download_addr":  summarise_url_obj(video.get("download_addr") or video.get("downloadAddr")),
        "play_addr":      summarise_url_obj(video.get("play_addr")      or video.get("playAddr")),
        "bit_rate_count": len(bit_rate_raw),
        "bit_rate_gears": [
            {
                "gear_name": g.get("gear_name") or g.get("gearName"),
                "bit_rate":  g.get("bit_rate")  or g.get("bitRate"),
                "play_addr": summarise_url_obj(g.get("play_addr") or g.get("playAddr")),
            }
            for g in bit_rate_raw
        ],
        "music_play_url":  summarise_url_obj(music.get("play_url") or music.get("playUrl")),
        "music_play_url_raw_type": type(music.get("play_url") or music.get("playUrl")).__name__,
        "audio_debug": _audio_debug_summary(item),
    }


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
