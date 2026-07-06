/**
 * Luldown — TikTok Downloader Cloudflare Worker (v6.0)
 *
 * Direct TikTok HTML scraping — no third-party APIs, no mobile API.
 *   Step 1: Resolve video ID from any URL (full, short, vm., vt.)
 *   Step 2: Fetch tiktok.com/@_/video/{id} with rotating Chrome User-Agent
 *           + fixed en-US Accept-Language + 7 fixed headers (no session priming)
 *   Step 3: Parse __remixContext JSON (falls back to older formats if missing)
 *   Step 4: Return CDN URLs — browser downloads directly from TikTok CDN
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Language: FIXED — always en-US, matches competitor's approach ───────────
function getLanguage() {
  return "en-US,en;q=0.9";
}

// ── Rotating User-Agents — Chrome only ───────────────────────────────────────
const USER_AGENTS = [
  // Chrome — Windows 10 / 11
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  // Chrome — macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  // Chrome — Linux
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
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
// Fixed 7-header set — no session priming, no cookies. Cloudflare's anycast
// network handles the outbound IP automatically, one IP per request.

const BROWSER_HEADERS = {
  "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer":         "https://www.tiktok.com/",
  "Sec-Fetch-Dest":  "document",
  "Sec-Fetch-Mode":  "navigate",
  "Sec-Fetch-Site":  "same-origin",
};
// + "User-Agent" (set per-request below) = 7 headers total.

// A single real Chrome browser tab always looks the same to the server — one
// User-Agent + header fingerprint for the whole session. We only rotate the
// fingerprint *between* attempts (not mid-request), and rely on Cloudflare's
// anycast network routing each attempt through a different edge IP — the
// browser itself never "closes", the network path underneath just changes.
const PAGE_FETCH_ATTEMPTS = 3;

async function fetchTikTokPageOnce(videoId, lang) {
  const url = `https://www.tiktok.com/@_/video/${videoId}`;
  const ua    = randomUA();

  const res = await fetch(url, {
    redirect: "manual",
    headers: {
      "User-Agent": ua,
      ...BROWSER_HEADERS,
      "Accept-Language": lang || "en-US,en;q=0.9",
    },
  });

  // TikTok redirects datacenter IPs to /about — treat as block
  if (res.status === 302 || res.status === 301) {
    const loc = res.headers.get("location") || "";
    if (loc.includes("/about") || loc.includes("/login")) {
      throw new Error("TikTok blocked this datacenter IP (redirect detected).");
    }
  }

  if (!res.ok && res.status !== 301 && res.status !== 302) {
    throw new Error(`TikTok page returned HTTP ${res.status}`);
  }

  return res.text();
}

async function fetchTikTokPage(videoId, lang) {
  let lastErr;
  for (let attempt = 0; attempt < PAGE_FETCH_ATTEMPTS; attempt++) {
    try {
      return await fetchTikTokPageOnce(videoId, lang);
    } catch (e) {
      lastErr = e;
      // Cloudflare Workers run from a global anycast network — a retry can
      // land on a completely different edge IP, so a block on one attempt
      // doesn't mean the next one is blocked too.
    }
  }
  throw lastErr;
}

// ── Step 3: Parse JSON from HTML ─────────────────────────────────────────────

function extractJsonFromHtml(html) {
  // Try __remixContext first (primary format we target now)
  const m0 = html.match(/<script[^>]*>\s*window\.__remixContext\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/);
  if (m0) {
    try { return { data: JSON.parse(m0[1]), source: "remix" }; } catch (_) {}
  }
  const m0b = html.match(/<script\s+id="__remixContext"[^>]*>([\s\S]*?)<\/script>/);
  if (m0b) {
    try { return { data: JSON.parse(m0b[1]), source: "remix" }; } catch (_) {}
  }

  // Try __UNIVERSAL_DATA_FOR_REHYDRATION__ (newer TikTok)
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

// ── Base64 URL decode ─────────────────────────────────────────────────────────
// TikTok sometimes encodes CDN URLs in Base64 (e.g. ssscdn.io style responses).
// If a "URL" doesn't start with http, try decoding it as Base64.
// If the decoded result starts with http → use it. Otherwise keep original.

function decodeUrl(raw) {
  if (!raw || typeof raw !== "string") return raw;
  if (raw.startsWith("http")) return raw; // already a real URL
  try {
    const decoded = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    if (decoded.startsWith("http")) return decoded;
  } catch (_) {}
  return raw;
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
      const url = decodeUrl(
        safeGet(img, "display_image", "url_list", 0) ||
        safeGet(img, "displayImage", "urlList", 0) ||
        safeGet(img, "ownerWatermarkImage", "urlList", 0) ||
        "",
      );
      if (url) images.push(url);
    }
  }

  const isPhoto = images.length > 0;

  // Video URLs — decodeUrl handles both plain URLs and Base64-encoded ones
  const videoHd = decodeUrl(firstStr(
    safeGet(video, "downloadAddr"),
    safeGet(video, "download_addr"),
    safeGet(video, "playAddr"),
    safeGet(video, "play_addr"),
  ));

  const videoWm = decodeUrl(firstStr(
    safeGet(video, "playAddr"),
    safeGet(video, "play_addr"),
    videoHd,
  ));

  // Audio
  const audio = decodeUrl(firstStr(
    safeGet(music, "playUrl"),
    safeGet(music, "play_url"),
  ));

  // Thumbnail
  const thumbnail = decodeUrl(firstStr(
    safeGet(video, "cover"),
    safeGet(video, "originCover"),
    safeGet(video, "origin_cover"),
    safeGet(video, "dynamicCover"),
  ));

  // Author
  const authorName = firstStr(
    safeGet(author, "uniqueId"),
    safeGet(author, "unique_id"),
    safeGet(author, "nickname"),
  );

  const authorAvatar = decodeUrl(firstStr(
    safeGet(author, "avatarMedium"),
    safeGet(author, "avatar_medium"),
    safeGet(author, "avatarThumb"),
    safeGet(author, "avatar_thumb"),
    safeGet(author, "avatarLarger"),
    safeGet(author, "avatar_larger"),
  ));

  return {
    title:         item.desc || "TikTok Video",
    author:        authorName ? `@${authorName}` : "",
    author_avatar: authorAvatar || "",
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

// Recursive search — finds an object that looks like a TikTok item
// (has "video" or "author" key, and id matches when known). Used as a
// robust fallback when the exact __remixContext path can't be predicted
// (Remix route loader keys vary by build).
function findItemDeep(node, videoId, depth = 0, seen = new Set()) {
  if (!node || typeof node !== "object" || depth > 8 || seen.has(node)) return null;
  seen.add(node);

  if (!Array.isArray(node)) {
    const looksLikeItem =
      (node.video || node.imagePost || node.image_post_info) &&
      (node.author || node.stats || node.statistics);
    if (looksLikeItem && (!videoId || node.id === videoId || node.itemId === videoId)) {
      return node;
    }
  }

  const values = Array.isArray(node) ? node : Object.values(node);
  for (const v of values) {
    if (v && typeof v === "object") {
      const found = findItemDeep(v, videoId, depth + 1, seen);
      if (found) return found;
    }
  }
  return null;
}

function parsePageData(parsed, videoId) {
  const { data, source } = parsed;

  let item = null;

  if (source === "remix") {
    // __remixContext → state.loaderData.<route> → videoInfo/itemInfo/itemStruct
    const loaderData = safeGet(data, "state", "loaderData") || safeGet(data, "loaderData") || {};
    for (const routeData of Object.values(loaderData)) {
      item =
        safeGet(routeData, "videoInfo", "itemInfo", "itemStruct") ||
        safeGet(routeData, "itemInfo", "itemStruct") ||
        safeGet(routeData, "itemStruct");
      if (item) break;
    }
    // Fall back to a deep scan of the whole remix payload
    if (!item) item = findItemDeep(data, videoId);
  }

  if (!item && source === "universal") {
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

async function getVideoData(tiktokUrl, lang) {
  const videoId = await resolveVideoId(tiktokUrl);

  // Single path — fetch the TikTok page directly, like a real browser would.
  const html   = await fetchTikTokPage(videoId, lang);
  const parsed = extractJsonFromHtml(html);

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

// ── HMAC Token System ─────────────────────────────────────────────────────────
// Each page load gets a signed token (timestamp + HMAC-SHA256).
// Worker validates it on every /api/info and /api/download request.
// Bots hitting the API directly won't have a valid token → blocked.
// If TOKEN_SECRET env var is not set, validation is skipped (dev mode).

const TOKEN_TTL_SECONDS = 900; // 15 minutes

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  if (timestamp > now + 30) return false; // clock skew guard
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

    // Cloudflare datacenter country → dynamic Accept-Language for TikTok requests
    const cfCountry = request.cf?.country || null;
    const lang      = getLanguage(cfCountry);

    // Secret for token signing — set TOKEN_SECRET in Cloudflare Worker env vars.
    // If not set, token validation is skipped (dev / local proxy mode).
    const secret = env.TOKEN_SECRET || null;

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({
        status:        "ok",
        version:       "5.2.0",
        engine:        "tiktok-html-direct",
        cf_colo:       request.cf?.colo || "?",
        cf_country:    cfCountry        || "?",
        lang_used:     lang,
        ua_pool:       USER_AGENTS.length,
        token_enabled: !!secret,
      });
    }

    // GET /api/token — generate a real HMAC-signed token
    if (pathname === "/api/token" && method === "GET") {
      if (!secret) {
        // Dev mode — return empty token, validation will be skipped
        return json({ token: "", ttl_seconds: TOKEN_TTL_SECONDS, dev_mode: true });
      }
      const token = await generateToken(secret);
      return json({ token, ttl_seconds: TOKEN_TTL_SECONDS });
    }

    // POST /api/info — fetch video metadata + CDN URLs
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
        p = await getVideoData(tiktokUrl, lang);
      } catch (e) {
        return err(e.message);
      }

      return json({
        success:       true,
        title:         p.title,
        author:        p.author,
        author_avatar: p.author_avatar,
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

    // GET /api/proxy — stream TikTok CDN file
    // If RENDER_URL is set → forward to Render proxy server (recommended for production).
    // If RENDER_URL is not set → fetch CDN directly from Worker (fallback / local dev).
    // Usage: /api/proxy?url=<encoded-cdn-url>&filename=<name.mp4>
    if (pathname === "/api/proxy" && method === "GET") {
      const params   = new URL(request.url).searchParams;
      const rawUrl   = params.get("url");
      const filename = params.get("filename") || "luldown.mp4";

      if (!rawUrl) return err("Missing url parameter", 400);

      let cdnUrl;
      try { cdnUrl = decodeURIComponent(rawUrl); } catch { return err("Invalid URL encoding", 400); }

      // Safety: only proxy known TikTok CDN domains
      const allowed = ["tiktok.com", "tiktokcdn.com", "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com"];
      if (!allowed.some(d => cdnUrl.includes(d))) {
        return err("Only TikTok CDN URLs are supported", 403);
      }

      // ── Path A: Render proxy (production) ──────────────────────────────────
      // Set RENDER_URL + PROXY_SECRET in Cloudflare Worker env vars to enable.
      // Render fetches CDN with proper browser headers → streams to user.
      if (env.RENDER_URL) {
        const renderProxyUrl =
          `${env.RENDER_URL.replace(/\/$/, "")}/proxy` +
          `?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;

        let upstream;
        try {
          upstream = await fetch(renderProxyUrl, {
            headers: { "x-proxy-secret": env.PROXY_SECRET || "" },
          });
        } catch (e) {
          return err("Failed to reach Render proxy server", 502);
        }

        if (!upstream.ok) {
          return err(`Render proxy returned ${upstream.status}`, upstream.status);
        }

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

      // ── Path B: Direct CDN fetch from Worker (fallback / no Render) ─────────
      let upstream;
      try {
        upstream = await fetch(cdnUrl, {
          headers: {
            "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer":         "https://www.tiktok.com/",
            "Origin":          "https://www.tiktok.com",
            "Accept":          "*/*",
            "Accept-Encoding": "identity",
            "Range":           "bytes=0-",
            "Sec-Fetch-Dest":  "video",
          },
        });
      } catch (e) {
        return err("Failed to fetch from TikTok CDN", 502);
      }

      if (!upstream.ok) {
        return err(`TikTok CDN returned ${upstream.status}`, upstream.status);
      }

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

    // POST /api/download — return CDN URL (browser downloads direct from TikTok CDN)
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
        p = await getVideoData(tiktokUrl, lang);
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
