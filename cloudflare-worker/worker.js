/**
 * Luldown — TikTok Downloader Cloudflare Worker (v5.0)
 *
 * Direct TikTok HTML scraping — no third-party APIs, no mobile API.
 *   Step 1: Resolve video ID from any URL (full, short, vm., vt.)
 *   Step 2: Fetch tiktok.com/@_/video/{id} with rotating browser headers
 *   Step 3: Parse __UNIVERSAL_DATA_FOR_REHYDRATION__ or SIGI_STATE JSON
 *   Step 4: Return CDN URLs — browser downloads directly from TikTok CDN
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Rotating User-Agents ─────────────────────────────────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ── Step 1: Extract video ID ─────────────────────────────────────────────────

function extractIdFromString(s) {
  const m = s.match(/\/video\/(\d{10,20})/);
  return m ? m[1] : null;
}

async function resolveVideoId(rawUrl) {
  const url = rawUrl.trim();

  // Fast path — video ID already in full URL
  const direct = extractIdFromString(url);
  if (direct) return direct;

  // Short URL (vm., vt., /t/) — follow HTTP redirects
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":      randomUA(),
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer":         "https://www.tiktok.com/",
    },
  });

  // Check the resolved URL
  const fromUrl = extractIdFromString(res.url);
  if (fromUrl) return fromUrl;

  // Scrape HTML for video ID
  const html = await res.text();
  const fromHtml = html.match(/\/video\/(\d{10,20})/);
  if (fromHtml) return fromHtml[1];

  throw new Error("Could not extract video ID. Make sure the link is a valid public TikTok video.");
}

// ── Step 2: Fetch TikTok HTML page ───────────────────────────────────────────

const BROWSER_HEADERS = {
  "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer":         "https://www.tiktok.com/",
  "Sec-Fetch-Dest":  "document",
  "Sec-Fetch-Mode":  "navigate",
  "Sec-Fetch-Site":  "same-origin",
};

async function fetchTikTokPage(videoId) {
  const url = `https://www.tiktok.com/@_/video/${videoId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      ...BROWSER_HEADERS,
    },
  });

  if (!res.ok) {
    throw new Error(`TikTok page returned HTTP ${res.status}`);
  }

  return res.text();
}

// ── Step 3: Parse JSON from HTML ─────────────────────────────────────────────

function extractJsonFromHtml(html) {
  // Try __UNIVERSAL_DATA_FOR_REHYDRATION__ first (newer TikTok)
  const m1 = html.match(/<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
  if (m1) {
    try { return { data: JSON.parse(m1[1]), source: "universal" }; } catch (_) {}
  }

  // Try SIGI_STATE (older TikTok)
  const m2 = html.match(/<script\s+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
  if (m2) {
    try { return { data: JSON.parse(m2[1]), source: "sigi" }; } catch (_) {}
  }

  // Try __NEXT_DATA__ (legacy)
  const m3 = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (m3) {
    try { return { data: JSON.parse(m3[1]), source: "next" }; } catch (_) {}
  }

  return null;
}

function safeGet(obj, ...keys) {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return cur;
}

function firstStr(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

function firstNum(...vals) {
  for (const v of vals) {
    if (typeof v === "number") return v;
  }
  return 0;
}

function parseItemStruct(item) {
  const video   = item.video   || {};
  const music   = item.music   || {};
  const author  = item.author  || {};
  const stats   = item.stats   || item.statistics || {};
  const imgPost = item.imagePost || item.image_post_info || null;

  // Photos (slideshow)
  const images = [];
  if (imgPost) {
    const imgList = imgPost.images || [];
    for (const img of imgList) {
      const url =
        safeGet(img, "display_image", "url_list", 0) ||
        safeGet(img, "displayImage", "urlList", 0) ||
        safeGet(img, "ownerWatermarkImage", "urlList", 0) ||
        "";
      if (url) images.push(url);
    }
  }

  const isPhoto = images.length > 0;

  // Video URLs
  const videoHd = firstStr(
    safeGet(video, "downloadAddr"),
    safeGet(video, "download_addr"),
    safeGet(video, "playAddr"),
    safeGet(video, "play_addr"),
  );

  const videoWm = firstStr(
    safeGet(video, "playAddr"),
    safeGet(video, "play_addr"),
    videoHd,
  );

  // Audio
  const audio = firstStr(
    safeGet(music, "playUrl"),
    safeGet(music, "play_url"),
  );

  // Thumbnail
  const thumbnail = firstStr(
    safeGet(video, "cover"),
    safeGet(video, "originCover"),
    safeGet(video, "origin_cover"),
    safeGet(video, "dynamicCover"),
  );

  // Author
  const authorName = firstStr(
    safeGet(author, "uniqueId"),
    safeGet(author, "unique_id"),
    safeGet(author, "nickname"),
  );

  return {
    title:         item.desc || "TikTok Video",
    author:        authorName ? `@${authorName}` : "",
    duration:      firstNum(video.duration),
    thumbnail,
    view_count:    firstNum(stats.playCount,   stats.play_count),
    like_count:    firstNum(stats.diggCount,   stats.digg_count),
    comment_count: firstNum(stats.commentCount, stats.comment_count),
    share_count:   firstNum(stats.shareCount,  stats.share_count),
    is_photo:      isPhoto,
    images,
    _hd_url:       videoHd,
    _sd_url:       videoWm,
    _audio_url:    audio,
  };
}

function parsePageData(parsed, videoId) {
  const { data, source } = parsed;

  let item = null;

  if (source === "universal") {
    // __UNIVERSAL_DATA_FOR_REHYDRATION__ → __DEFAULT_SCOPE__ → webapp.video-detail
    item =
      safeGet(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "itemStruct") ||
      safeGet(data, "__DEFAULT_SCOPE__", "webapp.video-detail", "itemInfo", "item");
  }

  if (!item && source === "sigi") {
    // SIGI_STATE → ItemModule → {videoId}
    const itemModule = safeGet(data, "ItemModule");
    if (itemModule) {
      item = itemModule[videoId] || Object.values(itemModule)[0];
    }
    // SIGI_STATE → itemInfo → itemStruct (mobile web)
    if (!item) {
      item = safeGet(data, "itemInfo", "itemStruct");
    }
  }

  if (!item && source === "next") {
    // __NEXT_DATA__ → props → pageProps → itemInfo → itemStruct
    item =
      safeGet(data, "props", "pageProps", "itemInfo", "itemStruct") ||
      safeGet(data, "props", "pageProps", "videoData");
  }

  // Generic fallback — search any structure for video with matching id
  if (!item) {
    const candidates = [
      safeGet(data, "webapp.video-detail", "itemInfo", "itemStruct"),
      safeGet(data, "itemInfo", "itemStruct"),
    ];
    for (const c of candidates) {
      if (c && (c.id === videoId || !videoId)) { item = c; break; }
    }
  }

  if (!item) {
    throw new Error("Video data not found in TikTok page. The video may be private or deleted.");
  }

  return parseItemStruct(item);
}

// ── Step 4: Full pipeline ─────────────────────────────────────────────────────

async function getVideoData(tiktokUrl) {
  const videoId = await resolveVideoId(tiktokUrl);
  const html    = await fetchTikTokPage(videoId);
  const parsed  = extractJsonFromHtml(html);

  if (!parsed) {
    throw new Error("TikTok page structure changed — could not find embedded JSON. Please try again.");
  }

  return parsePageData(parsed, videoId);
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

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({ status: "ok", version: "5.0.0", engine: "tiktok-html-direct" });
    }

    // GET /api/token — compatibility stub
    if (pathname === "/api/token" && method === "GET") {
      return json({ token: "", ttl_seconds: 300 });
    }

    // POST /api/info — fetch video metadata + CDN URLs
    if (pathname === "/api/info" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400);

      let p;
      try {
        p = await getVideoData(tiktokUrl);
      } catch (e) {
        return err(e.message);
      }

      return json({
        success:       true,
        title:         p.title,
        author:        p.author,
        duration:      p.duration,
        thumbnail:     p.thumbnail,
        view_count:    p.view_count,
        like_count:    p.like_count,
        comment_count: p.comment_count,
        share_count:   p.share_count,
        is_photo:      p.is_photo,
        images:        p.images,
        download_urls: {
          mp4_1080: p._hd_url,
          mp4_720:  p._sd_url,
          mp3:      p._audio_url,
        },
      });
    }

    // POST /api/download — return CDN URL (browser downloads direct from TikTok CDN)
    if (pathname === "/api/download" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400);

      const format = body.format || "mp4_1080";
      if (!["mp4_720", "mp4_1080", "mp3"].includes(format)) {
        return err(`Unknown format: ${format}`, 400);
      }

      let p;
      try {
        p = await getVideoData(tiktokUrl);
      } catch (e) {
        return err(e.message);
      }

      let cdnUrl    = "";
      let filename  = "luldown";
      let ext       = "mp4";
      let mediaType = "video/mp4";

      if (format === "mp4_1080") {
        cdnUrl   = p._hd_url;
        filename = "luldown_1080p";
      } else if (format === "mp4_720") {
        cdnUrl   = p._sd_url;
        filename = "luldown_720p";
      } else if (format === "mp3") {
        cdnUrl    = p._audio_url;
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
        author:     p.author,
        format,
      });
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },
};
