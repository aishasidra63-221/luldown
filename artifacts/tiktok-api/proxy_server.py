import os
import re
import httpx
from flask import Flask, request, Response, stream_with_context

app = Flask(__name__)

PROXY_SECRET = os.environ.get("PROXY_SECRET", "")
CDN_DOMAINS = ["tiktok.com", "tiktokcdn.com", "tiktokcdn-us.com", "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com"]
CDN_HEADERS = {
    "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer":         "https://www.tiktok.com/",
    "Origin":          "https://www.tiktok.com",
    "Accept":          "*/*",
    "Accept-Encoding": "identity",
    "Range":           "bytes=0-",
    "Sec-Fetch-Dest":  "video",
}

# Music CDN shard retry — sf prefix is not fixed (can be sf1–sf20).
# Try each shard until one returns HTTP 200.
MUSIC_PATH_RE = re.compile(r"https?://sf\d+\.tiktokcdn-us\.com(/obj/musically-maliva-obj/.+\.mp3)")

def resolve_music_url(original_url):
    """Return the first shard URL (sf1–sf20) that returns 200, or None."""
    m = MUSIC_PATH_RE.match(original_url)
    if not m:
        return None
    path = m.group(1)
    client = httpx.Client(timeout=httpx.Timeout(10.0, connect=5.0))
    try:
        for n in range(1, 21):
            url = f"https://sf{n}.tiktokcdn-us.com{path}"
            try:
                r = client.head(url, headers=CDN_HEADERS)
                if r.status_code == 200:
                    return url
            except Exception:
                continue
    finally:
        client.close()
    return None


@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/proxy")
def proxy():
    secret = request.headers.get("x-proxy-secret", "")
    if PROXY_SECRET and secret != PROXY_SECRET:
        return "Forbidden", 403

    url = request.args.get("url", "")
    filename = request.args.get("filename", "luldown.mp4")

    if not url.startswith("http"):
        return "Invalid URL", 400
    if not any(d in url for d in CDN_DOMAINS):
        return "Forbidden", 403

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

    # For music CDN URLs — shard prefix (sf1–sf20) is not fixed.
    # Resolve the correct shard before streaming.
    if "musically-maliva-obj" in url:
        resolved = resolve_music_url(url)
        if resolved:
            url = resolved
        else:
            return "Music not found on any CDN shard", 404

    # Open the upstream connection before building the Flask Response so we
    # know the real Content-Type (from the CDN) up front, instead of always
    # forwarding a hardcoded/guessed type.
    client = httpx.Client(follow_redirects=True, timeout=httpx.Timeout(120.0, connect=15.0))
    try:
        req = client.build_request("GET", url, headers=CDN_HEADERS)
        resp = client.send(req, stream=True)
    except Exception:
        client.close()
        return "Failed to fetch from TikTok CDN", 502

    if resp.is_error:
        resp.close()
        client.close()
        return "TikTok CDN returned an error", resp.status_code

    cdn_content_type = resp.headers.get("content-type", "").split(";")[0].strip()
    if cdn_content_type and not cdn_content_type.startswith(
        ("application/octet-stream", "text/html", "text/plain")
    ):
        media_type = cdn_content_type
    else:
        media_type = fallback_media_type

    def generate():
        try:
            for chunk in resp.iter_bytes(65536):
                yield chunk
        finally:
            resp.close()
            client.close()

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
    }
    content_length = resp.headers.get("content-length")
    if content_length:
        headers["Content-Length"] = content_length
    return Response(stream_with_context(generate()), content_type=media_type, headers=headers)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, threaded=True)
