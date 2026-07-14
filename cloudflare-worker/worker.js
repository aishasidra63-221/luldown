/**
 * Luldown — TikTok Downloader Cloudflare Worker (v8.0)
 *
 * TikTok Android Private API — no browser, no HTML scraping, no Puppeteer.
 * Fakes a real Android (Pixel 7) device making requests exactly like TikTok app.
 *   Step 1: Resolve video ID from any URL (full, short, vm., vt., /t/)
 *   Step 2: POST to TikTok's Android private API with fake device identity
 *   Step 3: Parse aweme_details[0] from JSON response
 *   Step 4: Cache via Cloudflare Cache API — global, persistent across isolate restarts
 *           meta: 30 days  |  CDN URL (resolver link): 30 days
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
const TTL_URL  = 30 * 24 * 60 * 60;  // 30 days — resolver link (aweme/v1/play/?...signaturev3=...)
                                       // signs on video_id/file_id/item_id, not on time, so it
                                       // resolves fresh live on every hit and doesn't time-expire.
                                       // Matches TTL_META; same staleness risk as meta (deleted/
                                       // private video), nothing new introduced by the longer TTL.

// ── Cloudflare KV — globally-replicated metadata cache ────────────────────────
// The Cache API above is per-datacenter: a user hitting the Mumbai PoP and a
// user hitting the Singapore PoP do NOT share a cache entry. Metadata (title,
// author, avatar, thumbnail) needs to be shared across every PoP worldwide —
// once ANY user triggers a scrape, every other user anywhere should get the
// cached copy instead of re-scraping. KV replicates globally, so it's used
// for meta only. The CDN url (now also 30 days, resolver link) is stored here too.

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

// CDN url — same KV, now 30 days (matches TTL_META). The cached value is the
// resolver link (aweme/v1/play/?...&signaturev3=...), which signs on stable
// video_id/file_id/item_id rather than time, so it resolves fresh live on
// every hit and doesn't time-expire. Previously this lived on the per-
// datacenter Cache API, which meant a request landing on a different PoP
// than the one that scraped it would ALWAYS miss and force a full re-scrape
// — defeating the point of caching for anyone not hitting that exact
// datacenter. KV fixes that: once any PoP scrapes a video, every PoP gets
// the fast cached URL for the next 30 days.
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

// ── Phone Pool ────────────────────────────────────────────────────────────────
// 500 persistent phones stored in KV — each lives exactly 1 year.
// Phones rotate via LRU with a 60-second gap between reuses.
// Failure types are distinguished: a 404 (API endpoint change) never
// penalises the phone; only status_code -1/8 (device block) counts as a
// real phone failure and retires it after 3 strikes, replacing with a fresh phone.

const POOL_SIZE     = 500;
const POOL_KV_KEY   = "pool:phones";
const PHONE_YEAR    = 365 * 24 * 60 * 60; // 1 year in seconds
const PHONE_GAP_SEC = 60;                  // min seconds between same-phone reuse

function generatePhone(id) {
  const now     = Math.floor(Date.now() / 1000);
  const profile = PHONE_PROFILES[Math.floor(Math.random() * PHONE_PROFILES.length)];
  return {
    id,
    // Fixed device identity — unique per phone, never changes
    device_id:    String(randInt(7250000000000000000, 7325099899999994577)),
    iid:          String(randInt(7023000000000000000, 7999999999999999999)),
    openudid:     randHex(16),
    cdid:         randUUID(),
    odin_tt:      randHex(64),
    install_time: now - randInt(2592000, 31536000), // 30 days–1 year ago
    // Fixed device profile — same model/OS/UA for this phone forever
    device_type:  profile.device_type,
    os_version:   profile.os_version,
    app_version:  profile.app_version,
    version_code: profile.version_code,
    user_agent:   profile.user_agent,
    // Lifecycle
    created_at:   now,
    expires_at:   now + PHONE_YEAR,
    last_used:    0,
    failures:     0,
    skip_until:   0,
    status:       "active",
  };
}

async function loadPool(env) {
  if (!env.META_KV) return null;
  try {
    const raw = await env.META_KV.get(POOL_KV_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function savePool(env, pool) {
  if (!env.META_KV) return;
  try { await env.META_KV.put(POOL_KV_KEY, JSON.stringify(pool)); } catch {}
}

async function getOrInitPool(env) {
  let pool = await loadPool(env);
  if (pool && pool.length >= POOL_SIZE) return pool;
  // First run — generate the full pool
  pool = [];
  for (let i = 1; i <= POOL_SIZE; i++) pool.push(generatePhone(i));
  await savePool(env, pool);
  return pool;
}

// Pick the phone that has rested the longest (LRU).
// Prefers phones that have passed the 60s gap. Falls back to absolute LRU
// during traffic bursts so no request is ever blocked.
function pickPhone(pool) {
  const now    = Math.floor(Date.now() / 1000);
  const active = pool.filter(p => p.status === "active");
  if (active.length === 0) return pool[0]; // safety fallback

  const rested = active.filter(
    p => now - (p.last_used || 0) >= PHONE_GAP_SEC && now >= (p.skip_until || 0),
  );
  const source = rested.length > 0 ? rested : active;
  return source.slice().sort((a, b) => (a.last_used || 0) - (b.last_used || 0))[0];
}

async function applyPhoneUpdate(env, pool, updated) {
  const idx = pool.findIndex(p => p.id === updated.id);
  if (idx !== -1) pool[idx] = updated;
  await savePool(env, pool);
}

// Record outcome of a TikTok API call for a specific phone.
// errorType: "ok" | "device_block" | "rate_limit" | "api_change" | "network"
async function recordPhoneResult(env, pool, phone, errorType) {
  const now = Math.floor(Date.now() / 1000);
  const p   = { ...phone, last_used: now };

  if (errorType === "ok") {
    p.failures = 0;

  } else if (errorType === "api_change") {
    // HTTP 404 = TikTok moved the endpoint — phone is innocent, no penalty

  } else if (errorType === "rate_limit") {
    p.skip_until = now + 600; // skip this phone for 10 minutes

  } else if (errorType === "device_block") {
    p.failures = (p.failures || 0) + 1;
    if (p.failures >= 3) {
      // Retire and replace with a brand-new phone in the same slot
      await applyPhoneUpdate(env, pool, generatePhone(p.id));
      return;
    }
  }

  // Auto-replace expired phones (1-year lifespan)
  if (p.expires_at && now > p.expires_at) {
    await applyPhoneUpdate(env, pool, generatePhone(p.id));
    return;
  }

  await applyPhoneUpdate(env, pool, p);
}

// Track 5-minute failure rate. If >50% of recent calls fail → set api_degraded.
// This separates "many phones blocked" from "TikTok changed their API".
async function trackFailureWindow(env, failed) {
  if (!env.META_KV) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    const raw = await env.META_KV.get("pool:fail_window");
    let   win = raw ? JSON.parse(raw) : { total: 0, failed: 0, reset_at: now + 300 };

    if (now > win.reset_at) win = { total: 0, failed: 0, reset_at: now + 300 };
    win.total  += 1;
    win.failed += failed ? 1 : 0;
    await env.META_KV.put("pool:fail_window", JSON.stringify(win), { expirationTtl: 600 });

    const rate = win.total >= 5 ? win.failed / win.total : 0;
    if (rate > 0.5) {
      await env.META_KV.put(
        "pool:api_degraded",
        JSON.stringify({ since: now }),
        { expirationTtl: 3600 },
      );
    } else if (!failed && rate < 0.1 && win.total >= 5) {
      await env.META_KV.delete("pool:api_degraded").catch(() => {});
    }
  } catch {}
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

const MAX_MANUAL_REDIRECTS = 5;

async function resolveVideoId(rawUrl) {
  const url = rawUrl.trim();

  // Fast path — video ID already in URL
  const direct = extractIdFromString(url);
  if (direct) return direct;

  // ── Fast path for short links (vm./vt.tiktok.com) ───────────────────────────
  // Follow redirects ONE HOP AT A TIME, reading only the `Location` header —
  // never download the actual HTML page. TikTok's short-link redirect puts
  // the numeric video ID straight in the Location header on the very first
  // hop, so this is a single lightweight round-trip (~0.3-0.5s) instead of a
  // full page fetch + HTML parse (~3s+, and more likely to hit bot checks
  // since it looks like a real page visit rather than a plain redirect check).
  let current = url;
  for (let hop = 0; hop < MAX_MANUAL_REDIRECTS; hop++) {
    let res;
    try {
      res = await fetch(current, {
        redirect: "manual",
        headers: {
          "User-Agent":      BROWSER_UA,
          "Accept-Language": "en-US,en;q=0.9",
          "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
    } catch {
      break; // network error — fall through to full-page fallback
    }

    const location = res.headers.get("Location") || res.headers.get("location");

    // Redirect hop — check the Location header for the ID before following it
    if (res.status >= 300 && res.status < 400 && location) {
      const resolved = new URL(location, current).toString();
      const fromLocation = extractIdFromString(resolved);
      if (fromLocation) return fromLocation;
      current = resolved;
      continue;
    }

    // Not a redirect (200 or otherwise) — the URL itself may already carry the ID
    const fromCurrent = extractIdFromString(current);
    if (fromCurrent) return fromCurrent;
    break; // no more redirects and no ID found this way — fall back below
  }

  // ── Fallback: full page fetch + HTML parse ──────────────────────────────────
  // Only reached if the header-only redirect chain didn't reveal the ID
  // (e.g. TikTok changed the redirect shape, or served a page directly).
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
// Each phone in the pool gets ONE profile assigned at birth — model, OS,
// app version, and User-Agent are all consistent for that phone forever.
// TikTok cannot see a phone "changing model" between requests.

// Fields that never change across any phone
const STATIC_DEVICE_BASE = {
  device_platform: "android",
  app_name:        "trill",
  channel:         "googleplay",
  sys_region:      "US",
  app_language:    "en",
  timezone_name:   "America/New_York",
  timezone_offset: "-14400",
  host_abi:        "arm64-v8a",
  aid:             "1988",
  ssmix:           "a",
  residence:       "US",
  app_type:        "normal",
};

// Device profiles — each phone is assigned one at creation and keeps it forever.
// Every field in a profile is internally consistent (model ↔ OS ↔ build ↔ UA).
const PHONE_PROFILES = [
  {
    device_type:  "Pixel 7",
    os_version:   "13",
    app_version:  "32.5.3",
    version_code: "2023501030",
    user_agent:   "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "Pixel 7 Pro",
    os_version:   "13",
    app_version:  "32.5.3",
    version_code: "2023501030",
    user_agent:   "com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7 Pro; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "Pixel 8",
    os_version:   "14",
    app_version:  "34.1.0",
    version_code: "2024100030",
    user_agent:   "com.zhiliaoapp.musically/2024100030 (Linux; U; Android 14; en_US; Pixel 8; Build/AD1A.240405.004; Cronet/113.0.5672.129)",
  },
  {
    device_type:  "Pixel 8 Pro",
    os_version:   "14",
    app_version:  "35.3.0",
    version_code: "2025300040",
    user_agent:   "com.zhiliaoapp.musically/2025300040 (Linux; U; Android 14; en_US; Pixel 8 Pro; Build/AP2A.240805.005; Cronet/119.0.6045.163)",
  },
  {
    device_type:  "SM-G991B",
    os_version:   "12",
    app_version:  "32.2.0",
    version_code: "2023200020",
    user_agent:   "com.zhiliaoapp.musically/2023200020 (Linux; U; Android 12; en_US; SM-G991B; Build/SP1A.210812.016; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "SM-S901B",
    os_version:   "13",
    app_version:  "34.2.0",
    version_code: "2024200035",
    user_agent:   "com.zhiliaoapp.musically/2024200035 (Linux; U; Android 13; en_US; SM-S901B; Build/TP1A.220624.014; Cronet/108.0.5359.128)",
  },
  {
    device_type:  "SM-S918B",
    os_version:   "14",
    app_version:  "35.3.0",
    version_code: "2025300040",
    user_agent:   "com.zhiliaoapp.musically/2025300040 (Linux; U; Android 14; en_US; SM-S918B; Build/UP1A.231005.007; Cronet/119.0.6045.163)",
  },
  {
    device_type:  "SM-A546B",
    os_version:   "13",
    app_version:  "34.1.0",
    version_code: "2024100030",
    user_agent:   "com.zhiliaoapp.musically/2024100030 (Linux; U; Android 13; en_US; SM-A546B; Build/TP1A.220624.014; Cronet/113.0.5672.129)",
  },
  {
    device_type:  "Redmi Note 12",
    os_version:   "13",
    app_version:  "34.2.0",
    version_code: "2024200035",
    user_agent:   "com.zhiliaoapp.musically/2024200035 (Linux; U; Android 13; en_US; Redmi Note 12; Build/TP1A.220624.014; Cronet/108.0.5359.128)",
  },
  {
    device_type:  "OnePlus 11",
    os_version:   "13",
    app_version:  "34.1.0",
    version_code: "2024100030",
    user_agent:   "com.zhiliaoapp.musically/2024100030 (Linux; U; Android 13; en_US; OnePlus 11; Build/TP1A.220624.014; Cronet/113.0.5672.129)",
  },
];

function buildQueryParams(videoId, phone = null) {
  const ts               = Math.floor(Date.now() / 1000);
  const _rticket         = Date.now();
  const device_id        = phone ? phone.device_id : String(randInt(7250000000000000000, 7325099899999994577));
  const iid              = phone ? phone.iid       : String(randInt(7023000000000000000, 7999999999999999999));
  const openudid         = phone ? phone.openudid  : randHex(16);
  const cdid             = phone ? phone.cdid      : randUUID();
  const last_install_time = phone ? String(phone.install_time) : String(ts - randInt(86400, 1123200));

  // Use phone's fixed profile fields so every request from this phone
  // sends the same model/OS/version — consistent with a real device.
  const profileFields = phone ? {
    device_type:  phone.device_type,
    os_version:   phone.os_version,
    app_version:  phone.app_version,
    version_code: phone.version_code,
  } : {
    device_type:  "Pixel 7",
    os_version:   "13",
    app_version:  "32.5.3",
    version_code: "2023501030",
  };

  const params = new URLSearchParams({
    ...STATIC_DEVICE_BASE,
    ...profileFields,
    device_id,
    iid,
    openudid,
    cdid,
    _rticket: String(_rticket),
    ts:       String(ts),
    last_install_time,
  });

  return params.toString();
}

// Multiple endpoints — same US East datacenter, different servers.
// If one is slow or rate-limiting, next one is tried automatically.
const TIKTOK_API_ENDPOINTS = [
  "api16-normal-c-alisg.tiktokv.com",
  "api16-normal-c-useast1a.tiktokv.com",
  "api22-normal-c-useast1a.tiktokv.com",
  "api22-normal-c-useast2a.tiktokv.com",
];

// User-Agent is now fixed per phone (from phone.user_agent).
// randUserAgent is only used as a fallback when no phone is passed (e.g. /api/debug).
function randUserAgent() {
  return PHONE_PROFILES[Math.floor(Math.random() * PHONE_PROFILES.length)].user_agent;
}

async function callAndroidAPI(videoId, phone = null) {
  const body = new URLSearchParams({
    aweme_ids:      `[${videoId}]`,
    request_source: "0",
  });

  let lastError     = null;
  let lastErrorType = "network";

  for (const host of TIKTOK_API_ENDPOINTS) {
    const qs        = buildQueryParams(videoId, phone);
    const endpoint  = `https://${host}/aweme/v1/multi/aweme/detail/?${qs}`;
    const odinToken = phone ? phone.odin_tt : randHex(160);

    try {
      const response = await fetch(endpoint, {
        method:  "POST",
        headers: {
          "User-Agent":   phone ? phone.user_agent : randUserAgent(),
          "X-SS-TC":      "0",
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie":       `odin_tt=${odinToken}`,
        },
        body: body.toString(),
      });

      // 404 = TikTok moved the endpoint (API change) — not a phone problem
      if (response.status === 404) {
        lastError     = new Error(`TikTok API ${host} returned HTTP 404 — endpoint may have changed`);
        lastErrorType = "api_change";
        continue;
      }

      if (!response.ok) {
        lastError     = new Error(`TikTok API ${host} returned HTTP ${response.status}`);
        lastErrorType = "network";
        continue;
      }

      const data = await response.json();

      // Device flagged / banned by TikTok
      if (data?.status_code === -1 || data?.status_code === 8) {
        lastError     = new Error(`TikTok API device blocked (status: ${data.status_code})`);
        lastErrorType = "device_block";
        continue;
      }

      // Rate limited
      if (data?.status_code === 2048) {
        lastError     = new Error(`TikTok API rate limited (status: 2048)`);
        lastErrorType = "rate_limit";
        continue;
      }

      // Any other non-zero body status
      if (data?.status_code && data.status_code !== 0) {
        lastError     = new Error(`TikTok API ${host} body status: ${data.status_code}`);
        lastErrorType = "network";
        continue;
      }

      return { data, errorType: "ok" }; // ✅ success
    } catch (e) {
      lastError     = new Error(`TikTok API ${host} failed: ${e.message}`);
      lastErrorType = "network";
    }
  }

  const e = lastError || new Error("All TikTok API endpoints failed");
  e.errorType = lastErrorType;
  throw e;
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

  // ── Video URL helpers ────────────────────────────────────────────────────────
  // Prefer the play_addr (no watermark) over download_addr (watermarked).
  // bit_rate[] contains per-quality gears; sort descending by bit_rate value
  // so [0] = highest quality (1080p), [1] = next (720p), etc.
  const getPlayUrl = (obj) =>
    resolverUrl((obj.play_addr || obj.playAddr || {}).url_list ||
                (obj.play_addr || obj.playAddr || {}).urlList);

  const bitRates = (video.bit_rate || video.bitRate || [])
    .filter(g => g && (g.play_addr || g.playAddr))
    .sort((a, b) => (b.bit_rate || b.bitRate || 0) - (a.bit_rate || a.bitRate || 0));

  // 1080p — prefer gear_name "1080", else highest-bitrate gear, else play_addr
  const gear1080 = bitRates.find(g => /1080/i.test(g.gear_name || g.gearName || ""))
    || bitRates[0];
  const url1080 = (gear1080 ? getPlayUrl(gear1080) : "")
    || resolverUrl((video.play_addr || video.playAddr || {}).url_list)
    || resolverUrl((video.download_addr || video.downloadAddr || {}).url_list);

  // 720p — prefer gear_name "720", else second-highest gear, else play_addr
  const gear720 = bitRates.find(g => /720/i.test(g.gear_name || g.gearName || ""))
    || bitRates[1] || bitRates[0];
  const url720 = (gear720 ? getPlayUrl(gear720) : "")
    || resolverUrl((video.play_addr || video.playAddr || {}).url_list)
    || resolverUrl((video.download_addr || video.downloadAddr || {}).url_list);

  // ── Audio URL ────────────────────────────────────────────────────────────────
  // music.play_url (snake) or music.playUrl (camel) → url_list / urlList array
  const musicPlayUrl = music.play_url || music.playUrl || {};
  const audioUrlList = musicPlayUrl.url_list || musicPlayUrl.urlList || [];
  const audioUrl = resolverUrl(Array.isArray(audioUrlList) ? audioUrlList : [])
    || (typeof musicPlayUrl === "string" ? musicPlayUrl : "")
    || musicPlayUrl.uri || "";

  const _debug = {
    bitRateGears:   bitRates.map(g => ({ gear_name: g.gear_name || g.gearName, bit_rate: g.bit_rate || g.bitRate })),
    musicKeys:      Object.keys(music),
    musicPlayUrl,
    audioUrl,
    url1080,
    url720,
  };

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
    _debug,
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
  // request lands on. Url now shares meta's 30-day TTL (resolver link).
  const [metaCached, urlCached] = await Promise.all([
    kvGetMeta(env, videoId),
    kvGetUrl(env, videoId),
  ]);

  // Both fresh — return immediately, zero API calls
  if (metaCached && urlCached) {
    return { ...metaCached, ...urlCached };
  }

  // Select a persistent phone from the pool for this API call
  const pool  = await getOrInitPool(env);
  const phone = pickPhone(pool);

  // Call TikTok Android API using the phone's fixed identity
  let data;
  try {
    const result = await callAndroidAPI(videoId, phone);
    data = result.data;
  } catch (e) {
    // Record failure type — 404 won't penalise the phone, device_block will
    await Promise.all([
      recordPhoneResult(env, pool, phone, e.errorType || "network"),
      trackFailureWindow(env, true),
    ]);
    throw new Error(`TikTok API request failed: ${e.message}`);
  }

  const details = data?.aweme_details;
  if (!details || details.length === 0) {
    const status = data?.status_code ?? data?.status ?? "unknown";
    await Promise.all([
      recordPhoneResult(env, pool, phone, "network"),
      trackFailureWindow(env, true),
    ]);
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
    audioUrl:    parsed.audioUrl,
  };

  // Write cache + record phone success in parallel
  await Promise.all([
    metaCached ? Promise.resolve() : kvSetMeta(env, videoId, metaPayload),
    kvSetUrl(env, videoId, urlPayload),
    recordPhoneResult(env, pool, phone, "ok"),
    trackFailureWindow(env, false),
  ]);

  return { ...metaPayload, ...urlPayload, _debug: parsed._debug };
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
    // ── Country geo-block — must run before ANY other logic ──────────────────
    // Blocks RU and IR with HTTP 451 (Unavailable For Legal Reasons).
    const blockedCountry = request.cf?.country;
    if (blockedCountry === "RU" || blockedCountry === "IR") {
      return new Response(
        JSON.stringify({ error: "Service not available in your region." }),
        { status: 451, headers: { "Content-Type": "application/json" } }
      );
    }

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

  // Cron Trigger (every 10 min) — pings Render's /health as REAL external
  // traffic so its free-tier instance never crosses the 15-min idle-sleep
  // threshold. A self-ping from inside the Render process doesn't count
  // toward Render's activity detection — it has to come from the outside.
  async scheduled(_event, env, ctx) {
    if (!env.RENDER_URL) return;
    const url = `${env.RENDER_URL.replace(/\/$/, "")}/health`;
    ctx.waitUntil(
      fetch(url, { headers: { "x-proxy-secret": env.PROXY_SECRET || "" } })
        .then(r => console.log(`keep-alive ping: ${r.status}`))
        .catch(e => console.log(`keep-alive ping failed: ${e.message}`))
    );
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
      return json({ status: "ok", version: "9.0.0", engine: "tiktok-android-api", token_enabled: !!secret }, 200, cors);
    }

    // GET /api/pool-status — phone pool health overview
    if (pathname === "/api/pool-status" && method === "GET") {
      if (!env.META_KV) return err("KV not bound", 500, cors);

      const [poolRaw, degradedRaw, winRaw] = await Promise.all([
        env.META_KV.get(POOL_KV_KEY),
        env.META_KV.get("pool:api_degraded"),
        env.META_KV.get("pool:fail_window"),
      ]);

      const pool     = poolRaw ? JSON.parse(poolRaw) : [];
      const degraded = degradedRaw ? JSON.parse(degradedRaw) : null;
      const win      = winRaw ? JSON.parse(winRaw) : { total: 0, failed: 0 };
      const now      = Math.floor(Date.now() / 1000);

      const active   = pool.filter(p => p.status === "active").length;
      const retired  = pool.filter(p => p.status === "retired").length;
      const resting  = pool.filter(p => p.status === "active" && now - (p.last_used || 0) < PHONE_GAP_SEC).length;
      const failRate = win.total > 0 ? ((win.failed / win.total) * 100).toFixed(1) + "%" : "0%";

      return json({
        pool_size:      pool.length,
        active:         active,
        retired:        retired,
        resting:        resting,   // phones in 60s cooldown
        available:      active - resting,
        api_health:     degraded ? "degraded" : "ok",
        degraded_since: degraded ? new Date(degraded.since * 1000).toISOString() : null,
        fail_rate_5min: failRate,
      }, 200, cors);
    }

    // GET /api/token
    if (pathname === "/api/token" && method === "GET") {
      if (!secret) {
        return json({ token: "", ttl_seconds: TOKEN_TTL_SECONDS, dev_mode: true }, 200, cors);
      }
      const token = await generateToken(secret);
      return json({ token, ttl_seconds: TOKEN_TTL_SECONDS }, 200, cors);
    }

    // POST /api/debug — returns raw TikTok API response for a video (no cache)
    if (pathname === "/api/debug" && method === "POST") {
      let body = {};
      try { body = await request.json(); } catch { return err("Invalid JSON", 400, cors); }
      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400, cors);
      const videoId = await resolveVideoId(tiktokUrl);
      let data;
      try { const result = await callAndroidAPI(videoId); data = result.data; } catch (e) { return err(e.message, 422, cors); }
      const aweme = data?.aweme_details?.[0];
      if (!aweme) return err("No aweme_details in response", 422, cors);
      const vid = aweme.video || {};
      const mus = aweme.music || {};
      const musicPlayUrl = mus.play_url || mus.playUrl || {};
      return json({
        video_keys:       Object.keys(vid),
        bit_rate_gears:   (vid.bit_rate || vid.bitRate || []).map(g => ({
          gear_name: g.gear_name || g.gearName,
          bit_rate:  g.bit_rate  || g.bitRate,
          play_addr_url0: ((g.play_addr || g.playAddr || {}).url_list || [])[0] || "",
        })),
        play_addr_url0:    ((vid.play_addr     || vid.playAddr     || {}).url_list || [])[0] || "",
        download_addr_url0:((vid.download_addr  || vid.downloadAddr || {}).url_list || [])[0] || "",
        music_keys:        Object.keys(mus),
        music_play_url_type: typeof musicPlayUrl,
        music_play_url_keys: typeof musicPlayUrl === "object" ? Object.keys(musicPlayUrl) : [],
        music_url_list:    musicPlayUrl.url_list || musicPlayUrl.urlList || [],
        music_uri:         musicPlayUrl.uri || "",
      }, 200, cors);
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

    // POST /api/cache/purge — delete all cached url:* entries from KV
    // Useful after a parser fix to force fresh fetches on next request.
    // Protected by TOKEN_SECRET (same token as other endpoints).
    if (pathname === "/api/cache/purge" && method === "POST") {
      if (!env.META_KV) return err("KV not bound", 500, cors);

      let body = {};
      try { body = await request.json(); } catch {}

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token.", 401, cors);
      }

      // If videoId provided — purge just that one video's URL cache
      if (body.videoId) {
        await env.META_KV.delete(`url:${body.videoId}`);
        return json({ success: true, deleted: 1, videoId: body.videoId }, 200, cors);
      }

      // Otherwise — list and delete all url:* keys
      let deleted = 0;
      let cursor  = undefined;
      do {
        const listed = await env.META_KV.list({ prefix: "url:", cursor, limit: 1000 });
        await Promise.all(listed.keys.map(k => env.META_KV.delete(k.name)));
        deleted += listed.keys.length;
        cursor = listed.list_complete ? undefined : listed.cursor;
      } while (cursor);

      return json({ success: true, deleted }, 200, cors);
    }

    return new Response("Not found", { status: 404, headers: cors });
}
