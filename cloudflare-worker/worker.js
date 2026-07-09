/**
 * Luldown — TikTok Downloader Cloudflare Worker (v7.0)
 *
 * TikTok Android Private API — no browser, no HTML scraping, no Puppeteer.
 * Fakes a real Android (Pixel 7) device making requests exactly like TikTok app.
 *   Step 1: Resolve video ID from any URL (full, short, vm., vt., /t/)
 *   Step 2: POST to TikTok's Android private API with fake device identity
 *   Step 3: Parse aweme_details[0] from JSON response
 *   Step 4: Cache metadata 7 days, video URLs 5 hours (in-memory)
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── In-memory cache ───────────────────────────────────────────────────────────
// Cloudflare Worker isolates are long-lived within a colo — this cache persists
// across requests hitting the same isolate. TTL enforced on read.

const _cache = new Map();

function cacheSet(key, value, ttlSeconds) {
  _cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _cache.delete(key); return null; }
  return entry.value;
}

const TTL_META = 7 * 24 * 60 * 60;   // 7 days  — title, author, avatar, thumbnail
const TTL_URL  = 5 * 60 * 60;         // 5 hours — signed video URL (expires in 6h)

// ── Random helpers ────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randHex(len) {
  let s = "";
  while (s.length < len) s += Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0");
  return s.slice(0, len);
}

function randUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Step 1: Resolve video ID from any TikTok URL ─────────────────────────────

function extractIdFromString(s) {
  const m = s.match(/\/video\/(\d{10,20})/);
  return m ? m[1] : null;
}

async function resolveVideoId(rawUrl) {
  const url = rawUrl.trim();

  // Fast path — video ID already in URL
  const direct = extractIdFromString(url);
  if (direct) return direct;

  // Short URL (vm., vt., /t/) — follow redirects to get real URL
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":      "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const fromUrl = extractIdFromString(res.url);
  if (fromUrl) return fromUrl;

  const html = await res.text();
  const fromHtml = html.match(/\/video\/(\d{10,20})/);
  if (fromHtml) return fromHtml[1];

  throw new Error("Could not extract video ID. Make sure the link is a valid public TikTok video.");
}

// ── Step 2: TikTok Android Private API call ───────────────────────────────────
// Fakes a Pixel 7 Android device running TikTok app (com.zhiliaoapp.musically).
// Static device identity + rotating per-request params to avoid fingerprinting.

const STATIC_DEVICE = {
  device_type:     "Pixel 7",
  os_version:      "13",
  device_platform: "android",
  app_name:        "trill",
  app_version:     "32.5.3",
  version_code:    "2023501030",
  channel:         "googleplay",
  sys_region:      "US",
  app_language:    "en",
  timezone_name:   "America/New_York",
  timezone_offset: "-14400",
  host_abi:        "armeabi-v7a",
  aid:             "1988",
  // extra fixed params
  ssmix:           "a",
  residence:       "US",
  app_type:        "normal",
  iid:             "7023456789012345678",
};

function buildQueryParams(videoId) {
  const ts               = Math.floor(Date.now() / 1000);
  const _rticket         = Date.now();
  const device_id        = String(randInt(7250000000000000000, 7325099899999994577));
  const openudid         = randHex(16);
  const cdid             = randUUID();
  const last_install_time = ts - randInt(86400, 1123200);

  const params = new URLSearchParams({
    ...STATIC_DEVICE,
    device_id,
    openudid,
    cdid,
    _rticket: String(_rticket),
    ts:       String(ts),
    last_install_time: String(last_install_time),
  });

  return params.toString();
}

async function callAndroidAPI(videoId) {
  const qs = buildQueryParams(videoId);
  const endpoint = `https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/multi/aweme/detail/?${qs}`;

  const body = new URLSearchParams({
    aweme_ids:      `[${videoId}]`,
    request_source: "0",
  });

  const odinToken = randHex(160);

  const response = await fetch(endpoint, {
    method:  "POST",
    headers: {
      "User-Agent":   "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
      "X-SS-TC":      "0",
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie":       `odin_tt=${odinToken}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`TikTok API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ── Step 3: Parse aweme_details from API response ────────────────────────────

function firstUrl(urlList) {
  if (!urlList || !Array.isArray(urlList)) return "";
  return urlList.find(u => u && u.startsWith("http")) || "";
}

function parseAweme(aweme) {
  const author = aweme.author  || {};
  const video  = aweme.video   || {};
  const music  = aweme.music   || {};
  const stats  = aweme.statistics || aweme.stats || {};

  // Photos (slideshow)
  const imgPost = aweme.image_post_info || aweme.imagePost || null;
  const images  = [];
  if (imgPost) {
    for (const img of (imgPost.images || [])) {
      const u = firstUrl(
        (img.display_image   || img.displayImage   || {}).url_list ||
        (img.display_image   || img.displayImage   || {}).urlList  || [],
      );
      if (u) images.push(u);
    }
  }

  const isPhoto = images.length > 0;

  // Video URLs
  const videoUrl     = firstUrl((video.play_addr      || video.playAddr     || {}).url_list);
  const downloadUrl  = firstUrl((video.download_addr   || video.downloadAddr || {}).url_list);
  const audioUrl     = firstUrl((music.play_url        || music.playUrl      || {}).url_list);

  // Thumbnail
  const thumbnail = firstUrl(
    (video.cover          || {}).url_list ||
    (video.origin_cover   || {}).url_list ||
    (video.dynamic_cover  || {}).url_list || [],
  );

  // Author
  const username = author.unique_id || author.uniqueId || author.nickname || "";
  const avatar   = firstUrl(
    (author.avatar_thumb  || author.avatarThumb  || {}).url_list ||
    (author.avatar_medium || author.avatarMedium || {}).url_list || [],
  );

  return {
    title:         aweme.desc || "TikTok Video",
    username:      username ? `@${username}` : "",
    displayName:   author.nickname || "",
    avatarUrl:     avatar,
    videoUrl:      downloadUrl || videoUrl,
    videoUrlWm:    videoUrl,
    audioUrl,
    thumbUrl:      thumbnail,
    duration:      video.duration || 0,
    view_count:    stats.play_count   || stats.playCount   || 0,
    like_count:    stats.digg_count   || stats.diggCount   || 0,
    comment_count: stats.comment_count || stats.commentCount || 0,
    share_count:   stats.share_count  || stats.shareCount  || 0,
    is_photo:      isPhoto,
    images,
  };
}

// ── Step 4: fetchTikTokVideo — cache → API → parse → cache → return ──────────

async function fetchTikTokVideo(tiktokUrl) {
  const videoId = await resolveVideoId(tiktokUrl);

  // Check meta cache (has everything except signed URL)
  const metaCached = cacheGet(`meta:${videoId}`);
  const urlCached  = cacheGet(`url:${videoId}`);

  if (metaCached && urlCached) {
    return { ...metaCached, ...urlCached };
  }

  // Cache miss — call TikTok Android API
  let data;
  try {
    data = await callAndroidAPI(videoId);
  } catch (e) {
    throw new Error(`TikTok API request failed: ${e.message}`);
  }

  const details = data?.aweme_details;
  if (!details || details.length === 0) {
    const status = data?.status_code ?? data?.status ?? "unknown";
    throw new Error(`Video not found or private (status: ${status}). The video may have been deleted or is region-restricted.`);
  }

  const parsed = parseAweme(details[0]);

  // Cache meta (7 days) — title, username, avatar, thumbnail, stats, photos
  const metaPayload = {
    title:         parsed.title,
    username:      parsed.username,
    displayName:   parsed.displayName,
    avatarUrl:     parsed.avatarUrl,
    thumbUrl:      parsed.thumbUrl,
    duration:      parsed.duration,
    is_photo:      parsed.is_photo,
    images:        parsed.images,
  };
  cacheSet(`meta:${videoId}`, metaPayload, TTL_META);

  // Cache video/audio URLs (5 hours)
  const urlPayload = {
    videoUrl:   parsed.videoUrl,
    videoUrlWm: parsed.videoUrlWm,
    audioUrl:   parsed.audioUrl,
  };
  cacheSet(`url:${videoId}`, urlPayload, TTL_URL);

  // NOTE: likes/comments/shares are NOT cached — always live from API

  return { ...metaPayload, ...urlPayload };
}

// ── Response helpers ──────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(detail, status = 422) {
  return json({ detail }, status);
}

function validateTikTokUrl(raw) {
  const u = (raw || "").trim();
  if (!u.startsWith("http")) return null;
  if (u.includes("tiktok.com") || u.includes("douyin.com")) return u;
  return null;
}

// ── HMAC Token System ─────────────────────────────────────────────────────────

const TOKEN_TTL_SECONDS = 900;

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function generateToken(secret) {
  const ts  = Math.floor(Date.now() / 1000);
  const sig = await hmacSign(secret, String(ts));
  return `${ts}.${sig}`;
}

async function validateToken(token, secret) {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const ts  = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > TOKEN_TTL_SECONDS) return false;
  if (timestamp > now + 30) return false;
  const expected = await hmacSign(secret, ts);
  return sig === expected;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const secret = env.TOKEN_SECRET || null;

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({
        status:        "ok",
        version:       "7.0.0",
        engine:        "tiktok-android-api",
        cf_colo:       request.cf?.colo    || "?",
        cf_country:    request.cf?.country || "?",
        token_enabled: !!secret,
        cache_size:    _cache.size,
      });
    }

    // GET /api/token
    if (pathname === "/api/token" && method === "GET") {
      if (!secret) {
        return json({ token: "", ttl_seconds: TOKEN_TTL_SECONDS, dev_mode: true });
      }
      const token = await generateToken(secret);
      return json({ token, ttl_seconds: TOKEN_TTL_SECONDS });
    }

    // POST /api/info — fetch video metadata + download URLs
    if (pathname === "/api/info" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401);
      }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400);

      let p;
      try {
        p = await fetchTikTokVideo(tiktokUrl);
      } catch (e) {
        return err(e.message);
      }

      return json({
        success:       true,
        title:         p.title,
        author:        p.username,
        author_avatar: p.avatarUrl,
        duration:      p.duration,
        thumbnail:     p.thumbUrl,
        is_photo:      p.is_photo,
        images:        p.images,
        download_urls: {
          mp4_1080: p.videoUrl,
          mp4_720:  p.videoUrlWm,
          mp3:      p.audioUrl,
        },
      });
    }

    // GET /api/proxy — stream TikTok CDN file
    if (pathname === "/api/proxy" && method === "GET") {
      const params   = new URL(request.url).searchParams;
      const rawUrl   = params.get("url");
      const filename = params.get("filename") || "luldown.mp4";

      if (!rawUrl) return err("Missing url parameter", 400);

      let cdnUrl;
      try { cdnUrl = decodeURIComponent(rawUrl); } catch { return err("Invalid URL encoding", 400); }

      const allowed = ["tiktok.com", "tiktokcdn.com", "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com"];
      if (!allowed.some(d => cdnUrl.includes(d))) {
        return err("Only TikTok CDN URLs are supported", 403);
      }

      // Path A: Render proxy (production)
      if (env.RENDER_URL) {
        const renderProxyUrl =
          `${env.RENDER_URL.replace(/\/$/, "")}/proxy` +
          `?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;

        let upstream;
        try {
          upstream = await fetch(renderProxyUrl, {
            headers: { "x-proxy-secret": env.PROXY_SECRET || "" },
          });
        } catch {
          return err("Failed to reach Render proxy server", 502);
        }

        if (!upstream.ok) return err(`Render proxy returned ${upstream.status}`, upstream.status);

        const respHeaders = new Headers({
          ...CORS_HEADERS,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type":        upstream.headers.get("Content-Type") || "video/mp4",
          "Cache-Control":       "no-store",
        });
        const cl = upstream.headers.get("Content-Length");
        if (cl) respHeaders.set("Content-Length", cl);

        return new Response(upstream.body, { status: 200, headers: respHeaders });
      }

      // Path B: Direct CDN fetch from Worker
      let upstream;
      try {
        upstream = await fetch(cdnUrl, {
          headers: {
            "User-Agent":      "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
            "Referer":         "https://www.tiktok.com/",
            "Accept":          "*/*",
            "Accept-Encoding": "identity",
            "Range":           "bytes=0-",
          },
        });
      } catch {
        return err("Failed to fetch from TikTok CDN", 502);
      }

      if (!upstream.ok) return err(`TikTok CDN returned ${upstream.status}`, upstream.status);

      const respHeaders = new Headers({
        ...CORS_HEADERS,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":        upstream.headers.get("Content-Type") || "video/mp4",
        "Cache-Control":       "no-store",
      });
      const ct = upstream.headers.get("Content-Length");
      if (ct) respHeaders.set("Content-Length", ct);

      return new Response(upstream.body, { status: 200, headers: respHeaders });
    }

    // POST /api/download — return CDN URL for direct browser download
    if (pathname === "/api/download" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401);
      }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400);

      const format = body.format || "mp4_1080";
      if (!["mp4_720", "mp4_1080", "mp3"].includes(format)) {
        return err(`Unknown format: ${format}`, 400);
      }

      let p;
      try {
        p = await fetchTikTokVideo(tiktokUrl);
      } catch (e) {
        return err(e.message);
      }

      let cdnUrl   = "";
      let filename = "luldown";
      let ext      = "mp4";
      let mediaType = "video/mp4";

      if (format === "mp4_1080") {
        cdnUrl = p.videoUrl;
        filename = "luldown_1080p";
      } else if (format === "mp4_720") {
        cdnUrl = p.videoUrlWm;
        filename = "luldown_720p";
      } else if (format === "mp3") {
        cdnUrl    = p.audioUrl;
        filename  = "luldown_audio";
        ext       = "mp3";
        mediaType = "audio/mpeg";
      }

      if (!cdnUrl) {
        return err("Download URL not available. The video may be private or region-restricted.");
      }

      return json({
        success:    true,
        cdn_url:    cdnUrl,
        filename:   `${filename}.${ext}`,
        media_type: mediaType,
        title:      p.title,
        author:     p.username,
        format,
      });
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};
