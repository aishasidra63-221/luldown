/**
 * Luldown — TikTok Downloader Cloudflare Worker (v8.0)
 *
 * TikTok Android Private API — no browser, no HTML scraping, no Puppeteer.
 * Fakes a real Android (Pixel 7) device making requests exactly like TikTok app.
 *   Step 1: Resolve video ID from any URL (full, short, vm., vt., /t/)
 *   Step 2: POST to TikTok's Android private API with fake device identity
 *   Step 3: Parse aweme_details[0] from JSON response
 *   Step 4: Cache via Cloudflare Cache API — global, persistent across isolate restarts
 *           meta: 30 days  |  CDN URL: 5 hours (expires in ~6h, 1h buffer)
 */

const ALLOWED_ORIGINS = [
  "https://luldown.com",
  "https://www.luldown.com",
];

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  return {
    "Access-Control-Allow-Origin":  allowed ? origin : "https://luldown.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const TTL_META = 30 * 24 * 60 * 60;  // 30 days — title, author, avatar, thumbnail (static)
const TTL_URL  = 5  * 60 * 60;        // 5 hours — CDN URL expires in ~6h (1h safety buffer)

// ── Cloudflare KV — globally-replicated metadata cache ────────────────────────
// The Cache API above is per-datacenter: a user hitting the Mumbai PoP and a
// user hitting the Singapore PoP do NOT share a cache entry. Metadata (title,
// author, avatar, thumbnail) needs to be shared across every PoP worldwide —
// once ANY user triggers a scrape, every other user anywhere should get the
// cached copy instead of re-scraping. KV replicates globally, so it's used
// for meta only. The CDN url (short-lived, 5h) stays on the per-PoP Cache API.

async function kvGetMeta(env, videoId) {
  if (!env.META_KV) return null;
  try {
    const raw = await env.META_KV.get(`meta:${videoId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function kvSetMeta(env, videoId, value) {
  if (!env.META_KV) return;
  try {
    await env.META_KV.put(`meta:${videoId}`, JSON.stringify(value), {
      expirationTtl: TTL_META,
    });
  } catch (e) {
    // Non-fatal — worst case, meta gets re-scraped next time.
  }
}

// CDN url — same KV, shorter TTL (5h, matches TikTok's signed-URL expiry).
// Previously this lived on the per-datacenter Cache API, which meant a
// request landing on a different PoP than the one that scraped it would
// ALWAYS miss and force a full re-scrape — defeating the point of caching
// for anyone not hitting that exact datacenter. KV fixes that: once any
// PoP scrapes a video, every PoP gets the fast cached URL for the next 5h.
async function kvGetUrl(env, videoId) {
  if (!env.META_KV) return null;
  try {
    const raw = await env.META_KV.get(`url:${videoId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function kvSetUrl(env, videoId, value) {
  if (!env.META_KV) return;
  try {
    await env.META_KV.put(`url:${videoId}`, JSON.stringify(value), {
      expirationTtl: TTL_URL,
    });
  } catch (e) {
    // Non-fatal — worst case, url gets re-scraped next time.
  }
}

// ── Random helpers ────────────────────────────────────────────────────────────

function randInt(min, max) {
  // Use crypto.getRandomValues for full 64-bit precision on large numbers
  // (Math.random only has 53-bit precision — last digits of 19-digit IDs would be 0)
  const range = BigInt(max) - BigInt(min) + 1n;
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  const rand = (BigInt(buf[0]) << 32n) | BigInt(buf[1]);
  return Number(BigInt(min) + (rand % range));
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

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const TIKTOK_ALLOWED_HOSTS = ["tiktok.com", "douyin.com", "musical.ly"];

async function resolveVideoId(rawUrl) {
  const url = rawUrl.trim();

  // Fast path — video ID already in URL
  const direct = extractIdFromString(url);
  if (direct) return direct;

  // Follow all redirects automatically — Cloudflare sets res.url to the FINAL URL.
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":      BROWSER_UA,
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  // SSRF guard — final URL after redirects must land on TikTok/Douyin
  const finalHost = new URL(res.url).hostname;
  if (!TIKTOK_ALLOWED_HOSTS.some(d => finalHost === d || finalHost.endsWith("." + d))) {
    throw new Error("URL did not resolve to a TikTok domain.");
  }

  // Check final URL first — fastest, no body read needed
  const fromUrl = extractIdFromString(res.url);
  if (fromUrl) return fromUrl;

  // Read body and search for video ID in HTML / JSON
  const html = await res.text();

  const fromHtml = html.match(/\/video\/(\d{10,20})/);
  if (fromHtml) return fromHtml[1];

  // Also check canonical / og:url meta tags
  const ogUrl = html.match(/(?:og:url|canonical)[^>]*content="([^"]+)"/);
  if (ogUrl) {
    const fromOg = extractIdFromString(ogUrl[1]);
    if (fromOg) return fromOg;
  }

  // Check aweme_id in embedded JSON (TikTok __UNIVERSAL_DATA_FOR_REHYDRATION__)
  const awemeId = html.match(/"aweme_id"\s*:\s*"(\d{10,20})"/);
  if (awemeId) return awemeId[1];

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
};

function buildQueryParams(videoId) {
  const ts               = Math.floor(Date.now() / 1000);
  const _rticket         = Date.now();
  const device_id        = String(randInt(7250000000000000000, 7325099899999994577));
  const iid              = String(randInt(7023000000000000000, 7999999999999999999));
  const openudid         = randHex(16);
  const cdid             = randUUID();
  const last_install_time = ts - randInt(86400, 1123200);

  const params = new URLSearchParams({
    ...STATIC_DEVICE,
    device_id,
    iid,
    openudid,
    cdid,
    _rticket: String(_rticket),
    ts:       String(ts),
    last_install_time: String(last_install_time),
  });

  return params.toString();
}

// Multiple endpoints — same US East datacenter, different servers.
// If one is slow or rate-limiting, next one is tried automatically.
const TIKTOK_API_ENDPOINTS = [
  "api16-normal-c-useast1a.tiktokv.com",
  "api19-normal-c-useast1a.tiktokv.com",
  "api21-normal-c-useast1a.tiktokv.com",
  "api16-normal-useast5.tiktokv.com",
];

// Rotating User-Agents — different TikTok app versions
// Prevents fingerprinting on a single static UA string
const TIKTOK_USER_AGENTS = [
  "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
  "com.zhiliaoapp.musically/2024100030 (Linux; U; Android 14; en_US; Pixel 8; Build/AD1A.240405.004; Cronet/113.0.5672.129)",
  "com.zhiliaoapp.musically/2025300040 (Linux; U; Android 14; en_US; Pixel 8 Pro; Build/AP2A.240805.005; Cronet/119.0.6045.163)",
  "com.zhiliaoapp.musically/2023200020 (Linux; U; Android 12; en_US; SM-G991B; Build/SP1A.210812.016; Cronet/58.0.2991.0)",
  "com.zhiliaoapp.musically/2024200035 (Linux; U; Android 13; en_US; SM-S901B; Build/TP1A.220624.014; Cronet/108.0.5359.128)",
];

function randUserAgent() {
  return TIKTOK_USER_AGENTS[Math.floor(Math.random() * TIKTOK_USER_AGENTS.length)];
}

async function callAndroidAPI(videoId) {
  const body = new URLSearchParams({
    aweme_ids:      `[${videoId}]`,
    request_source: "0",
  });

  let lastError = null;

  for (const host of TIKTOK_API_ENDPOINTS) {
    const qs        = buildQueryParams(videoId);
    const endpoint  = `https://${host}/aweme/v1/multi/aweme/detail/?${qs}`;
    const odinToken = randHex(160);

    try {
      const response = await fetch(endpoint, {
        method:  "POST",
        headers: {
          "User-Agent":   randUserAgent(),
          "X-SS-TC":      "0",
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie":       `odin_tt=${odinToken}`,
        },
        body: body.toString(),
      });

      if (!response.ok) {
        lastError = new Error(`TikTok API ${host} returned HTTP ${response.status}`);
        continue; // try next endpoint
      }

      const data = await response.json();

      // If TikTok returned an error status in the body, try next endpoint
      if (data?.status_code && data.status_code !== 0) {
        lastError = new Error(`TikTok API ${host} body status: ${data.status_code}`);
        continue;
      }

      return data; // success
    } catch (e) {
      lastError = new Error(`TikTok API ${host} failed: ${e.message}`);
      // network error — try next endpoint
    }
  }

  throw lastError || new Error("All TikTok API endpoints failed");
}

// ── Step 3: Parse aweme_details from API response ────────────────────────────

function firstUrl(urlList) {
  if (!urlList || !Array.isArray(urlList)) return "";
  return urlList.find(u => u && u.startsWith("http")) || "";
}

// Each url_list usually holds 2 direct CDN links (tiktokcdn.com, time-signed
// with bt=/ft=, expire in hours) followed by ONE resolver link
// (.../aweme/v1/play/?...&signaturev3=...) that resolves live on every hit
// and does not expire. Always prefer the resolver link when present.
function resolverUrl(urlList) {
  if (!urlList || !Array.isArray(urlList)) return "";
  return urlList.find(u => u && u.includes("signaturev3")) || firstUrl(urlList);
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

  // Video URLs — each url_list has 2 direct tiktokcdn.com links (expire in
  // hours, bt=/ft= tokens) plus one tiktokv.com/tiktok.com resolver link
  // (.../aweme/v1/play/?...&signaturev3=...) that never expires — that's
  // the domain check that decides "clean" vs "wrong" per gear.
  const isCleanDomain = (u) => /aweme\/v1\/play\//.test(u || "");

  const downloadUrl = resolverUrl((video.download_addr || video.downloadAddr || {}).url_list);
  const videoUrlAny = resolverUrl((video.play_addr      || video.playAddr     || {}).url_list);
  const musicPlayUrl = music.play_url || music.playUrl || {};
  const audioUrl = resolverUrl(musicPlayUrl.url_list) || musicPlayUrl.uri || "";
  const _debugMusic = { keys: Object.keys(music), playUrl: musicPlayUrl, multiBitRate: music.multi_bit_rate_play_info };

  // video.bit_rate[] holds per-quality gears (e.g. "adapt_lower_720_1",
  // "adapt_540_1") — no guaranteed "1080" gear exists, but every gear's own
  // url_list also carries a resolver link. If download_addr didn't have a
  // resolver entry (still landed on tiktokcdn.com), fall back to whichever
  // bit_rate gear DOES have a clean tiktokv.com resolver link.
  const bitRates = video.bit_rate || video.bitRate || [];
  const gearResolverUrls = bitRates
    .map(g => resolverUrl((g.play_addr || g.playAddr || {}).url_list))
    .filter(isCleanDomain);

  const gear720 = bitRates.find(g => String(g.gear_name || g.gearName || "").includes("720"));
  const url720FromGear = gear720 ? resolverUrl((gear720.play_addr || gear720.playAddr || {}).url_list) : "";

  // 1080 slot: keep download_addr's URL if it's already a clean tiktokv.com
  // resolver link (watermark=1 query param on it is irrelevant — the domain
  // is what matters). Only if it's still a tiktokcdn.com link, replace it
  // with the first clean resolver link found among the bit_rate gears.
  const url1080 = isCleanDomain(downloadUrl)
    ? downloadUrl
    : (gearResolverUrls[0] || downloadUrl || videoUrlAny);

  const url720 = url720FromGear || downloadUrl || videoUrlAny;

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
    videoUrl:      url1080,
    videoUrl720:   url720,
    audioUrl,
    _debugMusic,
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

async function fetchTikTokVideo(tiktokUrl, env) {
  const videoId = await resolveVideoId(tiktokUrl);

  // Both meta and url now live in Cloudflare KV — globally replicated.
  // Once ANY PoP scrapes a video, every other PoP worldwide sees the same
  // cached meta AND url — no matter which datacenter the next user's
  // request lands on. Url still expires faster (5h) since TikTok signs it.
  const [metaCached, urlCached] = await Promise.all([
    kvGetMeta(env, videoId),
    kvGetUrl(env, videoId),
  ]);

  // Both fresh — return immediately, zero API calls
  if (metaCached && urlCached) {
    return { ...metaCached, ...urlCached };
  }

  // Call TikTok Android API — same request regardless of what expired.
  // There is no TikTok endpoint that returns only the CDN URL.
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

  // Only re-cache meta if it was missing — URL-only expiry keeps 30-day meta untouched
  const metaPayload = metaCached || {
    title:       parsed.title,
    username:    parsed.username,
    displayName: parsed.displayName,
    avatarUrl:   parsed.avatarUrl,
    thumbUrl:    parsed.thumbUrl,
    duration:    parsed.duration,
    is_photo:    parsed.is_photo,
    images:      parsed.images,
  };

  // Always refresh the signed CDN URL
  const urlPayload = {
    videoUrl:    parsed.videoUrl,
    videoUrl720: parsed.videoUrl720,
    audioUrl:   parsed.audioUrl,
  };

  // Write to cache (parallel)
  await Promise.all([
    metaCached ? Promise.resolve() : kvSetMeta(env, videoId, metaPayload),
    kvSetUrl(env, videoId, urlPayload),
  ]);

  return { ...metaPayload, ...urlPayload, _debugMusic: parsed._debugMusic };
}

// ── Response helpers ──────────────────────────────────────────────────────────

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function err(detail, status = 422, cors = {}) {
  return json({ detail }, status, cors);
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
  // Timing-safe comparison — prevents HMAC timing attacks
  const sigBytes      = new TextEncoder().encode(sig);
  const expectedBytes = new TextEncoder().encode(expected);
  if (sigBytes.length !== expectedBytes.length) return false;
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(sigBytes, expectedBytes)
    : sig === expected; // fallback for envs without timingSafeEqual
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (e) {
      const cors = corsHeaders(request);
      return new Response(JSON.stringify({ detail: `Internal error: ${e.message}` }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};

// ── Rate limiting — KV-based, 20 requests/min per IP ─────────────────────────
async function checkRateLimit(env, ip) {
  if (!env.META_KV) return true; // KV not bound — allow
  const key = `rl:${ip}`;
  try {
    const raw  = await env.META_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 20) return false; // blocked
    await env.META_KV.put(key, String(count + 1), { expirationTtl: 60 });
    return true;
  } catch {
    return true; // KV error — allow rather than block real users
  }
}

async function handleRequest(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;
    const cors   = corsHeaders(request);

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const secret = env.TOKEN_SECRET || null;

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({ status: "ok", version: "8.2.0", engine: "tiktok-android-api", token_enabled: !!secret }, 200, cors);
    }

    // GET /api/token
    if (pathname === "/api/token" && method === "GET") {
      if (!secret) {
        return json({ token: "", ttl_seconds: TOKEN_TTL_SECONDS, dev_mode: true }, 200, cors);
      }
      const token = await generateToken(secret);
      return json({ token, ttl_seconds: TOKEN_TTL_SECONDS }, 200, cors);
    }

    // POST /api/info — fetch video metadata + download URLs
    if (pathname === "/api/info" && method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await checkRateLimit(env, ip)) return err("Too many requests. Please slow down.", 429, cors);

      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400, cors); }

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401, cors);
      }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400, cors);

      let p;
      try {
        p = await fetchTikTokVideo(tiktokUrl, env);
      } catch (e) {
        return err(e.message, 422, cors);
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
          mp4_720:  p.videoUrl720,
          mp3:      p.audioUrl,
        },
      }, 200, cors);
    }

    // GET /api/proxy — stream TikTok CDN file
    if (pathname === "/api/proxy" && method === "GET") {
      const params   = new URL(request.url).searchParams;
      const rawUrl   = params.get("url");
      const filename = params.get("filename") || "luldown.mp4";

      if (!rawUrl) return err("Missing url parameter", 400, cors);

      let cdnUrl;
      try { cdnUrl = decodeURIComponent(rawUrl); } catch { return err("Invalid URL encoding", 400, cors); }

      const allowed = ["tiktok.com", "tiktokcdn.com", "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com"];
      let cdnHostname;
      try { cdnHostname = new URL(cdnUrl).hostname; } catch { return err("Invalid CDN URL", 400, cors); }
      if (!allowed.some(d => cdnHostname === d || cdnHostname.endsWith("." + d))) {
        return err("Only TikTok CDN URLs are supported", 403, cors);
      }

      // Path A: Python proxy server (Render/any host) — REQUIRED.
      // Cloudflare Worker IPs are blocked by TikTok CDN (403).
      // The Python server uses non-Cloudflare IPs + browser-like headers, so CDN allows it.
      if (env.RENDER_URL) {
        const proxyUrl =
          `${env.RENDER_URL.replace(/\/$/, "")}/proxy` +
          `?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;

        let upstream;
        try {
          upstream = await fetch(proxyUrl, {
            headers: { "x-proxy-secret": env.PROXY_SECRET || "" },
          });
        } catch {
          return err("Proxy server unreachable. Please try again shortly.", 502, cors);
        }

        if (!upstream.ok) return err(`Proxy server returned ${upstream.status}`, upstream.status, cors);

        const respHeaders = new Headers({
          ...cors,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type":        upstream.headers.get("Content-Type") || "video/mp4",
          "Cache-Control":       "no-store",
        });
        const cl = upstream.headers.get("Content-Length");
        if (cl) respHeaders.set("Content-Length", cl);

        return new Response(upstream.body, { status: 200, headers: respHeaders });
      }

      // Path B: Direct CDN fetch — only works if TikTok CDN hasn't blocked this Worker's IP.
      // Kept as fallback for dev/testing. In production RENDER_URL must be set.
      let upstream;
      try {
        upstream = await fetch(cdnUrl, {
          headers: {
            "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Referer":         "https://www.tiktok.com/",
            "Accept":          "video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
      } catch {
        return err("Failed to fetch from TikTok CDN", 502, cors);
      }

      if (!upstream.ok) return err(`TikTok CDN returned ${upstream.status}. Set RENDER_URL in Worker env for reliable downloads.`, upstream.status, cors);

      const respHeaders2 = new Headers({
        ...cors,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":        upstream.headers.get("Content-Type") || "video/mp4",
        "Cache-Control":       "no-store",
      });
      const cl2 = upstream.headers.get("Content-Length");
      if (cl2) respHeaders2.set("Content-Length", cl2);

      return new Response(upstream.body, { status: 200, headers: respHeaders2 });
    }

    // POST /api/download — return CDN URL for direct browser download
    if (pathname === "/api/download" && method === "POST") {
      const ip2 = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await checkRateLimit(env, ip2)) return err("Too many requests. Please slow down.", 429, cors);

      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400, cors); }

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401, cors);
      }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400, cors);

      const format = body.format || "mp4_1080";
      if (!["mp4_720", "mp4_1080", "mp3"].includes(format)) {
        return err(`Unknown format: ${format}`, 400, cors);
      }

      let p;
      try {
        p = await fetchTikTokVideo(tiktokUrl, env);
      } catch (e) {
        return err(e.message, 422, cors);
      }

      let cdnUrl   = "";
      let filename = "luldown";
      let ext      = "mp4";
      let mediaType = "video/mp4";

      if (format === "mp4_1080") {
        cdnUrl = p.videoUrl;   filename = "luldown_1080p";
      } else if (format === "mp4_720") {
        cdnUrl = p.videoUrl720; filename = "luldown_720p";
      } else if (format === "mp3") {
        cdnUrl = p.audioUrl; filename = "luldown_audio"; ext = "mp3"; mediaType = "audio/mpeg";
      }

      if (!cdnUrl) return err("Download URL not available. The video may be private or region-restricted.", 422, cors);

      return json({ success: true, cdn_url: cdnUrl, filename: `${filename}.${ext}`, media_type: mediaType, title: p.title, author: p.username, format }, 200, cors);
    }

    return new Response("Not found", { status: 404, headers: cors });
}
