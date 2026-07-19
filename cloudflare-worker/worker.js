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

// ── Server-side Origin enforcement ────────────────────────────────────────────
// CORS headers alone are NOT a server-side control — they only tell a
// *browser* whether it may read the response; they never stop a request from
// being processed (curl/Postman/another server can call these endpoints
// directly regardless of what corsHeaders() returns). This adds an actual
// gate: reject the request outright (before any processing) unless it
// carries the exact production Origin. Not a strong boundary on its own
// (Origin is client-supplied and spoofable by non-browser callers), but it
// stops naive direct/script hits with zero processing cost. OPTIONS
// (preflight) is exempt — callers checked before invoking this.
const ALLOWED_API_ORIGINS = [
  "https://luldown.com",
  "https://www.luldown.com",
];

function requireOrigin(request, cors) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_API_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  return null;
}

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

const POOL_SIZE     = 2000;
const POOL_KV_KEY   = "pool:phones";
const PHONE_YEAR    = 365 * 24 * 60 * 60; // 1 year in seconds
const PHONE_GAP_SEC = 120;                 // min seconds between same-phone reuse

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
    odin_tt:      randHex(160),
    install_time: now - randInt(2592000, 31536000), // 30 days–1 year ago
    // Fixed device profile — same model/OS/resolution/UA for this phone forever
    device_type:  profile.device_type,
    os_version:   profile.os_version,
    resolution:   profile.resolution,
    app_version:  profile.app_version,
    version_code: profile.version_code,
    user_agent:   profile.user_agent,
    // Fixed timezone — assigned at birth, consistent with device location
    timezone_name: pickTimezone(),
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
  // Worker memory first — zero-latency on warm requests
  if (globalThis._poolCache) return globalThis._poolCache;
  if (!env.META_KV) return null;
  try {
    const raw  = await env.META_KV.get(POOL_KV_KEY);
    const pool = raw ? JSON.parse(raw) : null;
    if (pool) globalThis._poolCache = pool;
    return pool;
  } catch { return null; }
}

async function savePool(env, pool) {
  globalThis._poolCache = pool;           // always update memory
  if (!env.META_KV) return;
  try { await env.META_KV.put(POOL_KV_KEY, JSON.stringify(pool)); } catch {}
}

const POOL_BATCH = 50; // phones generated per run (first request + each cron tick)

async function getOrInitPool(env) {
  let pool = await loadPool(env);
  if (pool && pool.length > 0) return pool;
  // First ever request — generate first batch only so user sees no delay
  pool = [];
  for (let i = 1; i <= POOL_BATCH; i++) pool.push(generatePhone(i));
  await savePool(env, pool);
  return pool;
}

// Called from cron every 10 min — adds one batch until pool is full
async function growPool(env) {
  if (!env.META_KV) return;
  const pool = await loadPool(env);
  if (!pool) return;

  // One-time migration: patch existing phones that were created before timezone field existed
  let patched = false;
  for (const phone of pool) {
    if (!phone.timezone_name) {
      phone.timezone_name = pickTimezone();
      patched = true;
    }
  }
  if (patched) {
    await savePool(env, pool);
    console.log("Pool: patched missing timezones on existing phones");
  }

  if (pool.length >= POOL_SIZE) return; // already full
  const start = pool.length + 1;
  const end   = Math.min(pool.length + POOL_BATCH, POOL_SIZE);
  for (let i = start; i <= end; i++) pool.push(generatePhone(i));
  await savePool(env, pool);
  console.log(`Pool grew: ${start - 1} → ${pool.length}/${POOL_SIZE}`);
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

async function applyPhoneUpdate(env, pool, updated, writeKv = false) {
  const idx = pool.findIndex(p => p.id === updated.id);
  if (idx !== -1) pool[idx] = updated;
  if (writeKv) {
    await savePool(env, pool);  // memory + KV
  } else {
    globalThis._poolCache = pool;  // memory only — KV skipped
  }
}

// Record outcome of a TikTok API call for a specific phone.
// errorType: "ok" | "device_block" | "rate_limit" | "api_change" | "network"
async function recordPhoneResult(env, pool, phone, errorType) {
  const now = Math.floor(Date.now() / 1000);
  const p   = { ...phone, last_used: now };

  // writeKv = true only for state changes that matter for future requests.
  // Happy path ("ok") just updates last_used → memory only, no KV write needed.
  let writeKv = false;

  if (errorType === "ok") {
    p.failures = 0;                  // reset counters, memory-only update is fine

  } else if (errorType === "api_change") {
    // HTTP 404 = TikTok moved the endpoint — phone is innocent, no penalty

  } else if (errorType === "rate_limit") {
    p.skip_until = now + 600;        // must persist — skip this phone for 10 min
    writeKv = true;

  } else if (errorType === "device_block") {
    p.failures = (p.failures || 0) + 1;
    writeKv = true;                  // must persist — failure count changed
    if (p.failures >= 3) {
      // Retire and replace with a brand-new phone in the same slot
      await applyPhoneUpdate(env, pool, generatePhone(p.id), true);
      return;
    }
  }

  // Auto-replace expired phones (1-year lifespan)
  if (p.expires_at && now > p.expires_at) {
    await applyPhoneUpdate(env, pool, generatePhone(p.id), true);
    return;
  }

  await applyPhoneUpdate(env, pool, p, writeKv);
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

// ── MD5 (pure JS — Web Crypto API does not support MD5) ───────────────────────
function md5(data /* Uint8Array */) {
  function add(x, y) { const l=(x&0xFFFF)+(y&0xFFFF); return (((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xFFFF); }
  function rol(n,c) { return (n<<c)|(n>>>(32-c)); }
  function cmn(q,a,b,x,s,t) { return add(rol(add(add(a,q),add(x,t)),s),b); }
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}

  const len = data.length;
  const blocks = Math.ceil((len+9)/64)*16;
  const M = new Int32Array(blocks);
  for (let i=0;i<len;i++) M[i>>2]|=data[i]<<((i&3)*8);
  M[len>>2]|=0x80<<((len&3)*8);
  M[blocks-2]=len*8;

  let a=0x67452301,b=0xEFCDAB89,c=0x98BADCFE,d=0x10325476;
  for (let i=0;i<blocks;i+=16) {
    const [A,B,C,D]=[a,b,c,d];
    a=ff(a,b,c,d,M[i],7,-680876936);    b=ff(d,a,b,c,M[i+1],12,-389564586);
    c=ff(c,d,a,b,M[i+2],17,606105819);  d=ff(b,c,d,a,M[i+3],22,-1044525330);
    a=ff(a,b,c,d,M[i+4],7,-176418897);  b=ff(d,a,b,c,M[i+5],12,1200080426);
    c=ff(c,d,a,b,M[i+6],17,-1473231341);d=ff(b,c,d,a,M[i+7],22,-45705983);
    a=ff(a,b,c,d,M[i+8],7,1770035416);  b=ff(d,a,b,c,M[i+9],12,-1958414417);
    c=ff(c,d,a,b,M[i+10],17,-42063);    d=ff(b,c,d,a,M[i+11],22,-1990404162);
    a=ff(a,b,c,d,M[i+12],7,1804603682); b=ff(d,a,b,c,M[i+13],12,-40341101);
    c=ff(c,d,a,b,M[i+14],17,-1502002290);d=ff(b,c,d,a,M[i+15],22,1236535329);
    a=gg(a,b,c,d,M[i+1],5,-165796510);  b=gg(d,a,b,c,M[i+6],9,-1069501632);
    c=gg(c,d,a,b,M[i+11],14,643717713); d=gg(b,c,d,a,M[i],20,-373897302);
    a=gg(a,b,c,d,M[i+5],5,-701558691);  b=gg(d,a,b,c,M[i+10],9,38016083);
    c=gg(c,d,a,b,M[i+15],14,-660478335);d=gg(b,c,d,a,M[i+4],20,-405537848);
    a=gg(a,b,c,d,M[i+9],5,568446438);   b=gg(d,a,b,c,M[i+14],9,-1019803690);
    c=gg(c,d,a,b,M[i+3],14,-187363961); d=gg(b,c,d,a,M[i+8],20,1163531501);
    a=gg(a,b,c,d,M[i+13],5,-1444681467);b=gg(d,a,b,c,M[i+2],9,-51403784);
    c=gg(c,d,a,b,M[i+7],14,1735328473); d=gg(b,c,d,a,M[i+12],20,-1926607734);
    a=hh(a,b,c,d,M[i+5],4,-378558);     b=hh(d,a,b,c,M[i+8],11,-2022574463);
    c=hh(c,d,a,b,M[i+11],16,1839030562);d=hh(b,c,d,a,M[i+14],23,-35309556);
    a=hh(a,b,c,d,M[i+1],4,-1530992060); b=hh(d,a,b,c,M[i+4],11,1272893353);
    c=hh(c,d,a,b,M[i+7],16,-155497632); d=hh(b,c,d,a,M[i+10],23,-1094730640);
    a=hh(a,b,c,d,M[i+13],4,681279174);  b=hh(d,a,b,c,M[i],11,-358537222);
    c=hh(c,d,a,b,M[i+3],16,-722521979); d=hh(b,c,d,a,M[i+6],23,76029189);
    a=hh(a,b,c,d,M[i+9],4,-640364487);  b=hh(d,a,b,c,M[i+12],11,-421815835);
    c=hh(c,d,a,b,M[i+15],16,530742520); d=hh(b,c,d,a,M[i+2],23,-995338651);
    a=ii(a,b,c,d,M[i],6,-198630844);    b=ii(d,a,b,c,M[i+7],10,1126891415);
    c=ii(c,d,a,b,M[i+14],15,-1416354905);d=ii(b,c,d,a,M[i+5],21,-57434055);
    a=ii(a,b,c,d,M[i+12],6,1700485571); b=ii(d,a,b,c,M[i+3],10,-1894986606);
    c=ii(c,d,a,b,M[i+10],15,-1051523);  d=ii(b,c,d,a,M[i+1],21,-2054922799);
    a=ii(a,b,c,d,M[i+8],6,1873313359);  b=ii(d,a,b,c,M[i+15],10,-30611744);
    c=ii(c,d,a,b,M[i+6],15,-1560198380);d=ii(b,c,d,a,M[i+13],21,1309151649);
    a=ii(a,b,c,d,M[i+4],6,-145523070);  b=ii(d,a,b,c,M[i+11],10,-1120210379);
    c=ii(c,d,a,b,M[i+2],15,718787259);  d=ii(b,c,d,a,M[i+9],21,-343485551);
    a=add(a,A);b=add(b,B);c=add(c,C);d=add(d,D);
  }
  const out=new Uint8Array(16),v=new DataView(out.buffer);
  v.setInt32(0,a,true);v.setInt32(4,b,true);v.setInt32(8,c,true);v.setInt32(12,d,true);
  return out;
}

// ── X-Gorgon + X-Khronos signing ─────────────────────────────────────────────
// v8404 algorithm (current TikTok requirement):
//   1. MD5(url)[0:4], MD5(body)[0:4], MD5(cookie)[0:4] → 12 bytes
//   2. Append marker bytes [0x1, 0x1, 0x2, 0x4] + 4 timestamp bytes → 20 bytes
//   3. No XOR/RBIT/nibble-swap — raw bytes as hex directly
//   4. X-Gorgon = "8404" + rand_byte_masked + rand_byte + "0000" + result_hex(40)

function buildGorgon(queryString, bodyString, cookieString) {
  // v8404 — new algorithm (no encryption)
  const ts  = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();

  function md5Hex(bytes) {
    return Array.from(md5(bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  const urlMd5    = md5Hex(enc.encode(queryString || ""));
  const dataMd5   = bodyString   ? md5Hex(enc.encode(bodyString))   : null;
  const cookieMd5 = cookieString ? md5Hex(enc.encode(cookieString)) : null;

  // First 4 bytes of each component's MD5
  const gorgon = [];
  for (let i = 0; i < 4; i++) gorgon.push(parseInt(urlMd5.slice(i * 2, i * 2 + 2), 16));
  if (dataMd5)   { for (let i = 0; i < 4; i++) gorgon.push(parseInt(dataMd5.slice(i * 2, i * 2 + 2), 16)); }
  else           { gorgon.push(0, 0, 0, 0); }
  if (cookieMd5) { for (let i = 0; i < 4; i++) gorgon.push(parseInt(cookieMd5.slice(i * 2, i * 2 + 2), 16)); }
  else           { gorgon.push(0, 0, 0, 0); }

  // v8404 marker + timestamp — no XOR/transform
  gorgon.push(0x1, 0x1, 0x2, 0x4);
  gorgon.push((ts >>> 24) & 0xFF, (ts >>> 16) & 0xFF, (ts >>> 8) & 0xFF, ts & 0xFF);

  const result = gorgon.map(b => b.toString(16).padStart(2, "0")).join("");
  const r1 = (Math.floor(Math.random() * 256) & 0xF0).toString(16).padStart(2, "0");
  const r2 = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");

  return {
    "X-Gorgon":  `8404${r1}${r2}0000${result}`,
    "X-Khronos": String(ts),
  };
}


// ── Step 1: Resolve video ID from any TikTok URL ─────────────────────────────

function extractIdFromString(s) {
  // Path-based: /video/1234567890  OR  /photo/1234567890 (slideshow posts)
  const m = s.match(/\/(?:video|photo)\/(\d{10,20})/);
  if (m) return m[1];
  // Query param: share_item_id=1234567890 (present in TikTok short-link Location headers)
  try {
    const sid = new URL(s).searchParams.get("share_item_id");
    if (sid && /^\d{10,20}$/.test(sid)) return sid;
  } catch {}
  return null;
}

function extractShortCode(url) {
  // Matches: vm.tiktok.com/CODE  vt.tiktok.com/CODE  tiktok.com/t/CODE
  const m = url.match(/tiktok\.com\/(?:t\/)?([A-Za-z0-9]{5,15})\/?(?:\?|$)/);
  return m ? m[1] : null;
}

async function kvGetShortId(env, shortCode) {
  if (!env.META_KV) return null;
  try { return await env.META_KV.get(`short:${shortCode}`); } catch { return null; }
}

async function kvSetShortId(env, shortCode, videoId) {
  if (!env.META_KV) return;
  try { await env.META_KV.put(`short:${shortCode}`, videoId, { expirationTtl: 86400 * 30 }); } catch {}
}

const BROWSER_UA    = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const FB_CRAWLER_UA = "facebookexternalhit/1.1";

const TIKTOK_ALLOWED_HOSTS = ["tiktok.com", "douyin.com", "musical.ly"];

const MAX_MANUAL_REDIRECTS = 5;

async function cacheAndReturn(env, shortCode, videoId) {
  if (shortCode) kvSetShortId(env, shortCode, videoId); // fire-and-forget
  return videoId;
}

async function resolveVideoId(rawUrl, env) {
  const url = rawUrl.trim();
  const t0  = Date.now();

  // Fast path — video ID already in URL
  const direct = extractIdFromString(url);
  if (direct) {
    console.log(`[timing] resolve: id-in-url in ${Date.now()-t0}ms`);
    return direct;
  }

  // KV cache — short URL already resolved before?
  const shortCode = extractShortCode(url);
  if (shortCode) {
    const cached = await kvGetShortId(env, shortCode);
    if (cached) {
      console.log(`[timing] resolve: kv-cache-hit in ${Date.now()-t0}ms`);
      return cached;
    }
  }

  // Helper — SSRF-safe Location header extractor
  function safeLocation(headers) {
    const loc = headers.get("location") || headers.get("Location") || "";
    if (!loc) return null;
    try {
      const full = loc.startsWith("/") ? `https://www.tiktok.com${loc}` : loc;
      const host = new URL(full).hostname;
      if (!TIKTOK_ALLOWED_HOSTS.some(d => host === d || host.endsWith("." + d))) return null;
      return full;
    } catch { return null; }
  }

  // ── Step 1: HEAD + facebookexternalhit + redirect:manual ─────────────────────
  // TikTok treats Facebook crawler as trusted → single clean 301 to video URL.
  // HEAD = zero body download → fastest path (~50–150 ms).
  try {
    const headRes = await fetch(url, {
      method:   "HEAD",
      redirect: "manual",
      headers:  { "User-Agent": FB_CRAWLER_UA },
    });
    const loc = safeLocation(headRes.headers);
    if (loc) {
      const id = extractIdFromString(loc);
      if (id) {
        console.log(`[timing] resolve: step1-head-fb in ${Date.now()-t0}ms`);
        return cacheAndReturn(env, shortCode, id);
      }
    }
  } catch (e) {
    console.log(`[timing] resolve: step1-head-fb-error in ${Date.now()-t0}ms — ${e.message}`);
  }

  // ── Step 2: GET + facebookexternalhit + redirect:manual ──────────────────────
  // Location header check + limited body read (max 32 KB — no full page download).
  try {
    const getRes = await fetch(url, {
      method:   "GET",
      redirect: "manual",
      headers:  { "User-Agent": FB_CRAWLER_UA, "Accept": "text/html,*/*;q=0.8" },
    });
    const loc = safeLocation(getRes.headers);
    if (loc) {
      const id = extractIdFromString(loc);
      if (id) {
        console.log(`[timing] resolve: step2-get-fb-loc in ${Date.now()-t0}ms`);
        return cacheAndReturn(env, shortCode, id);
      }
    }
    // Read only the first 32 KB — avoids downloading TikTok's multi-MB pages
    const reader = getRes.body?.getReader();
    let bodyChunk = "";
    if (reader) {
      const { value } = await reader.read();
      reader.cancel();
      bodyChunk = value ? new TextDecoder().decode(value).slice(0, 32768) : "";
    }
    const fromBody = bodyChunk.match(/\/(?:video|photo)\/(\d{10,20})/);
    if (fromBody) {
      console.log(`[timing] resolve: step2-get-fb-body in ${Date.now()-t0}ms`);
      return cacheAndReturn(env, shortCode, fromBody[1]);
    }
  } catch (e) {
    console.log(`[timing] resolve: step2-get-fb-error in ${Date.now()-t0}ms — ${e.message}`);
  }

  // ── Step 3 (fallback): redirect:follow + browser UA ──────────────────────────
  // Slower — follows all hops, may download full HTML — but catches edge cases.
  let resolveRes;
  try {
    resolveRes = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":      BROWSER_UA,
        "Accept-Language": "en-US,en;q=0.9",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } catch (e) {
    console.log(`[timing] resolve: step3-follow-error in ${Date.now()-t0}ms — ${e.message}`);
    throw new Error("Could not reach TikTok. Please check the link and try again.");
  }

  // SSRF guard — final URL after redirects must land on TikTok/Douyin
  const finalHost = new URL(resolveRes.url).hostname;
  if (!TIKTOK_ALLOWED_HOSTS.some(d => finalHost === d || finalHost.endsWith("." + d))) {
    throw new Error("URL did not resolve to a TikTok domain.");
  }

  const fromUrl = extractIdFromString(resolveRes.url);
  if (fromUrl) {
    console.log(`[timing] resolve: step3-follow-url in ${Date.now()-t0}ms`);
    return cacheAndReturn(env, shortCode, fromUrl);
  }

  // Final URL didn't have the ID — read body and parse HTML
  console.log(`[timing] resolve: step3-html-parse after ${Date.now()-t0}ms`);
  const html = await resolveRes.text();

  const fromHtml = html.match(/\/(?:video|photo)\/(\d{10,20})/);
  if (fromHtml) return cacheAndReturn(env, shortCode, fromHtml[1]);

  const ogUrl = html.match(/(?:og:url|canonical)[^>]*content="([^"]+)"/);
  if (ogUrl) {
    const fromOg = extractIdFromString(ogUrl[1]);
    if (fromOg) return cacheAndReturn(env, shortCode, fromOg);
  }

  const awemeId = html.match(/"aweme_id"\s*:\s*"(\d{10,20})"/);
  if (awemeId) return cacheAndReturn(env, shortCode, awemeId[1]);

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

  host_abi:        "arm64-v8a",
  aid:             "1988",
  ssmix:           "a",
  residence:       "US",
  app_type:        "normal",
  ac:              "wifi",
};

// Device profiles — each phone is assigned one at creation and keeps it forever.
// Every field in a profile is internally consistent (model ↔ OS ↔ build ↔ UA).
const PHONE_PROFILES = [
  {
    device_type:  "Pixel 7",
    os_version:   "13",
    resolution:   "1080*2400",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "Pixel 7 Pro",
    os_version:   "13",
    resolution:   "1440*3120",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; Pixel 7 Pro; Build/TD1A.220804.031; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "Pixel 8",
    os_version:   "14",
    resolution:   "1080*2400",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 14; en_US; Pixel 8; Build/AD1A.240405.004; Cronet/113.0.5672.129)",
  },
  {
    device_type:  "Pixel 8 Pro",
    os_version:   "14",
    resolution:   "1344*2992",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 14; en_US; Pixel 8 Pro; Build/AP2A.240805.005; Cronet/119.0.6045.163)",
  },
  {
    device_type:  "SM-G991B",
    os_version:   "12",
    resolution:   "1080*2400",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 12; en_US; SM-G991B; Build/SP1A.210812.016; Cronet/58.0.2991.0)",
  },
  {
    device_type:  "SM-S901B",
    os_version:   "13",
    resolution:   "1080*2340",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; SM-S901B; Build/TP1A.220624.014; Cronet/108.0.5359.128)",
  },
  {
    device_type:  "SM-S918B",
    os_version:   "14",
    resolution:   "1080*2340",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 14; en_US; SM-S918B; Build/UP1A.231005.007; Cronet/119.0.6045.163)",
  },
  {
    device_type:  "SM-A546B",
    os_version:   "13",
    resolution:   "1080*2340",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; SM-A546B; Build/TP1A.220624.014; Cronet/113.0.5672.129)",
  },
  {
    device_type:  "Redmi Note 12",
    os_version:   "13",
    resolution:   "1080*2400",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; Redmi Note 12; Build/TP1A.220624.014; Cronet/108.0.5359.128)",
  },
  {
    device_type:  "OnePlus 11",
    os_version:   "13",
    resolution:   "1080*2412",
    app_version:  "46.0.3",
    version_code: "2024600030",
    user_agent:   "com.zhiliaoapp.musically/2024600030 (Linux; U; Android 13; en_US; OnePlus 11; Build/TP1A.220624.014; Cronet/113.0.5672.129)",
  },
];

// ── Timezone pool — weighted by real US population distribution ───────────────
const TIMEZONE_POOL = [
  { name: "America/New_York",    weight: 47 },
  { name: "America/Chicago",     weight: 33 },
  { name: "America/Los_Angeles", weight: 13 },
  { name: "America/Denver",      weight:  5 },
  { name: "America/Phoenix",     weight:  2 },
];

function pickTimezone() {
  const total = TIMEZONE_POOL.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const tz of TIMEZONE_POOL) {
    r -= tz.weight;
    if (r <= 0) return tz.name;
  }
  return TIMEZONE_POOL[0].name;
}

// Returns current UTC offset in seconds for a given IANA timezone (DST-aware).
// e.g. "America/New_York" in summer → -14400, in winter → -18000
function tzOffsetSeconds(tzName) {
  const now     = new Date();
  const tzDate  = new Date(now.toLocaleString("en-US", { timeZone: tzName }));
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC"   }));
  return Math.round((tzDate - utcDate) / 1000);
}

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
    resolution:   phone.resolution,
    app_version:  phone.app_version,
    version_code: phone.version_code,
  } : {
    device_type:  "Pixel 7",
    os_version:   "13",
    resolution:   "1080*2400",
    app_version:  "32.5.3",
    version_code: "2023501030",
  };

  // Per-phone timezone — fallback to New York for legacy phones without the field
  const tzName   = phone?.timezone_name ?? "America/New_York";
  const tzOffset = String(tzOffsetSeconds(tzName));

  const params = new URLSearchParams({
    ...STATIC_DEVICE_BASE,
    ...profileFields,
    device_id,
    iid,
    openudid,
    cdid,
    _rticket:        String(_rticket),
    ts:              String(ts),
    last_install_time,
    timezone_name:   tzName,
    timezone_offset: tzOffset,
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
    const t0        = Date.now();
    const qs        = buildQueryParams(videoId, phone);
    const endpoint  = `https://${host}/aweme/v1/multi/aweme/detail/?${qs}`;
    const odinToken = phone ? phone.odin_tt : randHex(160);

    try {
      const bodyStr   = body.toString();
      const cookieStr = `odin_tt=${odinToken}`;
      const gorgon    = buildGorgon(qs, bodyStr, cookieStr);
      const response  = await fetch(endpoint, {
        method:  "POST",
        headers: {
          "User-Agent":   phone ? phone.user_agent : randUserAgent(),
          "X-SS-TC":      "0",
          "X-Gorgon":     gorgon["X-Gorgon"],
          "X-Khronos":    gorgon["X-Khronos"],
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie":       `odin_tt=${odinToken}`,
        },
        body: bodyStr,
      });

      // 404 = TikTok moved the endpoint (API change) — not a phone problem
      if (response.status === 404) {
        console.log(`[timing] tiktok-api ${host} 404 in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} returned HTTP 404 — endpoint may have changed`);
        lastErrorType = "api_change";
        continue;
      }

      if (!response.ok) {
        console.log(`[timing] tiktok-api ${host} HTTP ${response.status} in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} returned HTTP ${response.status}`);
        lastErrorType = "network";
        continue;
      }

      const data = await response.json();

      if (data?.status_code === -1 || data?.status_code === 8) {
        console.log(`[timing] tiktok-api ${host} device_block in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API device blocked (status: ${data.status_code})`);
        lastErrorType = "device_block";
        continue;
      }

      if (data?.status_code === 2048) {
        console.log(`[timing] tiktok-api ${host} rate_limit in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API rate limited (status: 2048)`);
        lastErrorType = "rate_limit";
        continue;
      }

      if (data?.status_code === 2053) {
        console.log(`[timing] tiktok-api ${host} 2053 sig_rejected in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} body status: 2053`);
        lastErrorType = "network";
        continue;
      }

      if (data?.status_code && data.status_code !== 0) {
        console.log(`[timing] tiktok-api ${host} status ${data.status_code} in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} body status: ${data.status_code}`);
        lastErrorType = "network";
        continue;
      }

      console.log(`[timing] tiktok-api ${host} OK in ${Date.now()-t0}ms`);
      return { data, errorType: "ok" }; // ✅ success
    } catch (e) {
      console.log(`[timing] tiktok-api ${host} exception in ${Date.now()-t0}ms: ${e.message}`);
      lastError     = new Error(`TikTok API ${host} failed: ${e.message}`);
      lastErrorType = "network";
    }
  }

  const e = lastError || new Error("All TikTok API endpoints failed");
  e.errorType = lastErrorType;
  throw e;
}

// ── User posts API — same infra as callAndroidAPI, different endpoint ─────────
async function callUserPostsAPI(username, phone = null) {
  const body = new URLSearchParams({
    unique_id:      username,
    count:          "10",
    max_cursor:     "0",
    min_cursor:     "0",
    retry_type:     "no_retry",
    request_source: "0",
  });

  let lastError     = null;
  let lastErrorType = "network";

  for (const host of TIKTOK_API_ENDPOINTS) {
    const t0        = Date.now();
    const qs        = buildQueryParams("0", phone);
    const endpoint  = `https://${host}/aweme/v1/aweme/post/?${qs}`;
    const odinToken = phone ? phone.odin_tt : randHex(160);

    try {
      const bodyStr   = body.toString();
      const cookieStr = `odin_tt=${odinToken}`;
      const gorgon    = buildGorgon(qs, bodyStr, cookieStr);
      const response  = await fetch(endpoint, {
        method:  "POST",
        headers: {
          "User-Agent":   phone ? phone.user_agent : randUserAgent(),
          "X-SS-TC":      "0",
          "X-Gorgon":     gorgon["X-Gorgon"],
          "X-Khronos":    gorgon["X-Khronos"],
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie":       `odin_tt=${odinToken}`,
        },
        body: bodyStr,
      });

      if (response.status === 404) {
        console.log(`[timing] profile-api ${host} 404 in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} returned HTTP 404`);
        lastErrorType = "api_change";
        continue;
      }
      if (!response.ok) {
        console.log(`[timing] profile-api ${host} HTTP ${response.status} in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} returned HTTP ${response.status}`);
        lastErrorType = "network";
        continue;
      }

      const data = await response.json();
      if (data?.status_code === -1 || data?.status_code === 8) {
        console.log(`[timing] profile-api ${host} device_block in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API device blocked (status: ${data.status_code})`);
        lastErrorType = "device_block";
        continue;
      }
      if (data?.status_code === 2048) {
        console.log(`[timing] profile-api ${host} rate_limit in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API rate limited`);
        lastErrorType = "rate_limit";
        continue;
      }
      if (data?.status_code === 2053) {
        console.log(`[timing] profile-api ${host} 2053 sig_rejected in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API ${host} body status: 2053`);
        lastErrorType = "network";
        continue;
      }
      if (data?.status_code && data.status_code !== 0) {
        console.log(`[timing] profile-api ${host} status ${data.status_code} in ${Date.now()-t0}ms`);
        lastError     = new Error(`TikTok API body status: ${data.status_code}`);
        lastErrorType = "network";
        continue;
      }

      console.log(`[timing] profile-api ${host} OK in ${Date.now()-t0}ms`);
      return { data, errorType: "ok" };
    } catch (e) {
      console.log(`[timing] profile-api ${host} exception in ${Date.now()-t0}ms: ${e.message}`);
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

// For cover images: pick the URL with the largest pixel dimensions when
// TikTok CDN embeds size hints in the path (e.g. ~c5_1080x1920.jpeg).
// Falls back to the first HTTP URL when no size hints are present.
function bestCoverUrl(urlList) {
  if (!urlList || !Array.isArray(urlList) || urlList.length === 0) return "";
  const candidates = urlList.filter(u => u && u.startsWith("http"));
  if (candidates.length === 0) return "";
  const scored = candidates.map(u => {
    const m = u.match(/[_~](\d{3,4})x(\d{3,4})/);
    const area = m ? parseInt(m[1]) * parseInt(m[2]) : 0;
    // Prefer URLs with "origin" in the path — these are unresized originals
    const originBonus = /[~_\-.]origin[~_\-./]|origin\.jpeg|origin\.jpg|origin\.webp|-origin$/i.test(u) ? 9_999_999 : 0;
    return { u, score: area + originBonus };
  }).sort((a, b) => b.score - a.score);
  return scored[0].u;
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
        (img.display_image   || img.displayImage   || {}).url_list  ||
        (img.display_image   || img.displayImage   || {}).urlList   ||
        (img.thumbnail       || {}).url_list                        ||
        (img.thumbnail       || {}).urlList                         ||
        (img.ownerWatermarkImage || {}).urlList                     || [],
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

  // ── Photo slideshow video URL ─────────────────────────────────────────────
  // For photo/slideshow posts TikTok sometimes provides a compiled MP4 slideshow
  // inside image_post_info.video. This is the actual "Download as Video" source.
  // video.play_addr for photo posts usually carries the audio track, not video.
  const photoVideo = (imgPost?.video || imgPost?.videoInfo || null);
  const photoVideoUrl = photoVideo
    ? resolverUrl(
        (photoVideo.play_addr  || photoVideo.playAddr  || {}).url_list  ||
        (photoVideo.play_addr  || photoVideo.playAddr  || {}).urlList   ||
        (photoVideo.download_addr || photoVideo.downloadAddr || {}).url_list || [],
      )
    : "";

  // ── Audio URL ────────────────────────────────────────────────────────────────
  // music.play_url (snake) or music.playUrl (camel) → url_list / urlList array
  const musicPlayUrl = music.play_url || music.playUrl || {};
  const audioUrlList = musicPlayUrl.url_list || musicPlayUrl.urlList || [];
  const musicUrl = resolverUrl(Array.isArray(audioUrlList) ? audioUrlList : [])
    || (typeof musicPlayUrl === "string" ? musicPlayUrl : "")
    || musicPlayUrl.uri || "";

  // Audio URL — use the best available CDN URL from TikTok's music.play_url list.
  // resolverUrl() prefers signaturev3 links when present (stable); otherwise
  // falls back to the first CDN URL. aweme/v1/play/?data_type=4 is NOT used here
  // because it requires signed Android auth headers that the Render proxy cannot
  // provide — passing it through would result in TikTok returning 400.
  //
  // For photo posts: url1080 = video.play_addr which has a signaturev3 link.
  const audioUrl = isPhoto
    ? (url1080 || musicUrl)   // url1080 = video.play_addr = audio track for photo posts
    : musicUrl;

  // Thumbnail — pick highest resolution available.
  // Use .length check before || so an empty url_list [] (truthy but useless)
  // doesn't block the fallback chain. bestCoverUrl prefers the URL with the
  // largest pixel dimensions when TikTok embeds size hints (e.g. ~c5_1080x1920).
  const thumbnail = bestCoverUrl(
    (video.origin_cover  ?.url_list?.length ? video.origin_cover.url_list  : null) ||
    (video.cover         ?.url_list?.length ? video.cover.url_list         : null) ||
    (video.dynamic_cover ?.url_list?.length ? video.dynamic_cover.url_list : null) ||
    [],
  );

  // Author
  const username = author.unique_id || author.uniqueId || author.nickname || "";
  const avatar   = firstUrl(
    (author.avatar_thumb  || author.avatarThumb  || {}).url_list ||
    (author.avatar_medium || author.avatarMedium || {}).url_list || [],
  );

  // Music ID — stable identifier for the background track.
  // Used to build: https://sf19.tiktokcdn-us.com/obj/musically-maliva-obj/{musicId}.mp3
  // The ID never expires so we cache it in meta (not url) KV.
  // IMPORTANT: use music.mid (string) over music.id (number) to avoid JS
  // integer precision loss — TikTok music IDs are 19-digit numbers that exceed
  // Number.MAX_SAFE_INTEGER, so JSON.parse() silently rounds music.id to *000.
  const musicId = music.mid || music.id_str || String(music.id || "");

  return {
    title:         aweme.desc || "TikTok Video",
    username:      username ? `@${username}` : "",
    displayName:   author.nickname || "",
    avatarUrl:     avatar,
    // For photo posts: use compiled slideshow video (image_post_info.video) if TikTok provides it.
    // For regular videos: use the highest-bitrate gear URL as usual.
    videoUrl:      isPhoto ? photoVideoUrl : url1080,
    videoUrl720:   isPhoto ? ""            : url720,
    audioUrl,
    musicId,
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

async function fetchTikTokVideo(tiktokUrl, env, ctx) {
  const t0  = Date.now();
  const do_ = getPoolDO(env);

  // Resolve URL first, then check KV cache (only pick a phone on cache miss)
  const videoId = await resolveVideoId(tiktokUrl, env);
  console.log(`[timing] fetch: resolve done in ${Date.now()-t0}ms`);

  const t1 = Date.now();
  const [metaCached, urlCached] = await Promise.all([
    kvGetMeta(env, videoId),
    kvGetUrl(env, videoId),
  ]);
  console.log(`[timing] fetch: kv-lookup in ${Date.now()-t1}ms`);

  // Both fresh — return immediately, zero API calls
  if (metaCached && urlCached) {
    console.log(`[timing] fetch: kv-cache-hit TOTAL ${Date.now()-t0}ms`);
    return { ...metaCached, ...urlCached };
  }

  // Cache miss — pick a phone via Durable Object (race-free, single-threaded)
  const t2    = Date.now();
  const phone = await do_.fetch("http://do/pick", { method: "POST" }).then(r => r.json());
  console.log(`[timing] fetch: pool-pick in ${Date.now()-t2}ms`);

  // Call TikTok Android API using the phone's fixed identity
  const t3 = Date.now();
  let data;
  try {
    const result = await callAndroidAPI(videoId, phone);
    data = result.data;
    console.log(`[timing] fetch: tiktok-api done in ${Date.now()-t3}ms`);
  } catch (e) {
    console.log(`[timing] fetch: tiktok-api FAILED in ${Date.now()-t3}ms — ${e.message}`);
    await do_.fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: e.errorType || "network" }) });
    (ctx ? ctx.waitUntil.bind(ctx) : (p) => p)(trackFailureWindow(env, true));
    throw new Error(`TikTok API request failed: ${e.message}`);
  }

  const details = data?.aweme_details;
  if (!details || details.length === 0) {
    const status = data?.status_code ?? data?.status ?? "unknown";
    await do_.fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: "network" }) });
    (ctx ? ctx.waitUntil.bind(ctx) : (p) => p)(trackFailureWindow(env, true));
    throw new Error(`Video not found or private (status: ${status}). The video may have been deleted or is region-restricted.`);
  }

  const parsed = parseAweme(details[0]);

  const metaPayload = metaCached || {
    title:       parsed.title,
    username:    parsed.username,
    displayName: parsed.displayName,
    avatarUrl:   parsed.avatarUrl,
    thumbUrl:    parsed.thumbUrl,
    duration:    parsed.duration,
    is_photo:    parsed.is_photo,
    images:      parsed.images,
    musicId:     parsed.musicId,
  };

  const urlPayload = {
    videoUrl:    parsed.videoUrl,
    videoUrl720: parsed.videoUrl720,
    audioUrl:    parsed.audioUrl,
  };

  await Promise.all([
    metaCached ? Promise.resolve() : kvSetMeta(env, videoId, metaPayload),
    kvSetUrl(env, videoId, urlPayload),
    do_.fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: "ok" }) }),
  ]);
  (ctx ? ctx.waitUntil.bind(ctx) : (p) => p)(trackFailureWindow(env, false));

  console.log(`[timing] fetch: TOTAL ${Date.now()-t0}ms`);
  return { ...metaPayload, ...urlPayload };
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
  try {
    const hostname = new URL(u).hostname;
    const allowed  = ["tiktok.com", "douyin.com", "musical.ly"];
    if (allowed.some(d => hostname === d || hostname.endsWith("." + d))) return u;
  } catch {}
  return null;
}

// ── HMAC Token System ─────────────────────────────────────────────────────────

// Token rotates 4x/day (every 6 hours) instead of continuously. The token
// value is a pure function of the current 6-hour bucket (floor(now/period)),
// so every visitor across every datacenter gets the IDENTICAL token during
// that window — no per-request generation, no storage needed. Combined with
// edge caching on /api/token (see below), this cuts down how often the
// Worker itself gets invoked just to hand out a token. This was never a
// strong security boundary (a token isn't bound to any one user/IP), so
// widening the window doesn't meaningfully change the threat model — the
// real protection is the per-IP rate limit + Origin check.
const TOKEN_PERIOD_SECONDS = 21600; // 6 hours -> 4 rotations/day (~120/month)
const TOKEN_TTL_SECONDS = TOKEN_PERIOD_SECONDS;

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
  const now         = Math.floor(Date.now() / 1000);
  const bucketStart = Math.floor(now / TOKEN_PERIOD_SECONDS) * TOKEN_PERIOD_SECONDS;
  const sig         = await hmacSign(secret, String(bucketStart));
  return `${bucketStart}.${sig}`;
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

// ── Bot User-Agent blacklist ──────────────────────────────────────────────────
// Catches raw scraper/HTTP-client tools that never bother spoofing a browser
// UA. Trivial to bypass (just fake the UA string), but blocks the large share
// of low-effort scripts that use their tool's default UA — free, zero-cost
// first filter before the real token/rate-limit checks run.
const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /python-urllib/i,
  /^curl\//i,
  /^curl$/i,
  /wget/i,
  /scrapy/i,
  /go-http-client/i,
  /okhttp/i,
  /libwww-perl/i,
  /httpclient/i,
  /^java\//i,
  /node-fetch/i,
  /^axios\//i,
  /postmanruntime/i,
  /insomnia/i,
  /^$/, // empty/missing User-Agent header
];

function isBlockedUserAgent(request) {
  const ua = request.headers.get("User-Agent") || "";
  return BLOCKED_UA_PATTERNS.some((re) => re.test(ua));
}

const RICKROLL_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// ── PhonePoolDO — Durable Object for race-free phone pool ────────────────────
// Cloudflare guarantees a single global instance of this DO, and all requests
// to it are serialized (single-threaded). This eliminates the KV last-write-wins
// race condition where two isolates could overwrite each other's pool updates.
//
// On first run it auto-migrates the existing pool from KV so no phones are lost.
export class PhonePoolDO {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
    this.pool  = null; // loaded lazily on first request
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/pick"   && request.method === "POST") return this._pick();
    if (url.pathname === "/record" && request.method === "POST") {
      const { id, errorType } = await request.json();
      return this._record(id, errorType);
    }
    if (url.pathname === "/grow"  && request.method === "POST") return this._grow();
    if (url.pathname === "/stats") {
      const pool   = await this._getPool();
      const active = pool.filter(p => p.status === "active").length;
      return Response.json({ total: pool.length, active, max: POOL_SIZE });
    }
    return new Response("Not found", { status: 404 });
  }

  // Load pool: DO storage → KV migration → fresh batch
  async _getPool() {
    if (this.pool !== null) return this.pool;

    // 1. DO storage — strongly consistent, fast
    this.pool = await this.state.storage.get("pool") || null;
    if (this.pool && this.pool.length > 0) return this.pool;

    // 2. One-time KV migration — preserves all existing phones
    if (this.env.META_KV) {
      try {
        const raw = await this.env.META_KV.get(POOL_KV_KEY);
        if (raw) {
          this.pool = JSON.parse(raw);
          await this.state.storage.put("pool", this.pool);
          console.log(`PhonePoolDO: migrated ${this.pool.length} phones from KV`);
          return this.pool;
        }
      } catch {}
    }

    // 3. Fresh start — first batch only, cron fills the rest
    this.pool = [];
    for (let i = 1; i <= POOL_BATCH; i++) this.pool.push(generatePhone(i));
    await this.state.storage.put("pool", this.pool);
    return this.pool;
  }

  // Save to DO storage — only for state changes that must survive a restart
  async _persist() {
    await this.state.storage.put("pool", this.pool);
  }

  async _pick() {
    const pool  = await this._getPool();
    const phone = pickPhone(pool);
    // Update last_used in memory only — no storage write needed for happy path
    const idx = pool.findIndex(p => p.id === phone.id);
    if (idx !== -1) pool[idx] = { ...phone, last_used: Math.floor(Date.now() / 1000) };
    return Response.json(phone);
  }

  async _record(phoneId, errorType) {
    const pool = await this._getPool();
    const idx  = pool.findIndex(p => p.id === phoneId);
    if (idx === -1) return Response.json({ ok: true });

    const now   = Math.floor(Date.now() / 1000);
    const phone = pool[idx];
    const p     = { ...phone, last_used: now };

    if (errorType === "ok") {
      p.failures = 0;
      pool[idx]  = p;
      // Memory-only — no persist needed for happy path
      return Response.json({ ok: true });
    }

    if (errorType === "api_change") {
      // Phone is innocent — no penalty
      return Response.json({ ok: true });
    }

    if (errorType === "rate_limit") {
      p.skip_until = now + 600;
      pool[idx]    = p;
      await this._persist();
      return Response.json({ ok: true });
    }

    if (errorType === "device_block") {
      p.failures = (p.failures || 0) + 1;
      if (p.failures >= 3) {
        pool[idx] = generatePhone(phoneId);
        await this._persist();
        return Response.json({ ok: true });
      }
      pool[idx] = p;
      await this._persist();
      return Response.json({ ok: true });
    }

    // Auto-replace expired phones (1-year lifespan)
    if (p.expires_at && now > p.expires_at) {
      pool[idx] = generatePhone(phoneId);
      await this._persist();
      return Response.json({ ok: true });
    }

    pool[idx] = p;
    return Response.json({ ok: true });
  }

  async _grow() {
    const pool = await this._getPool();

    // One-time migration: patch phones missing the timezone field
    let patched = false;
    for (const phone of pool) {
      if (!phone.timezone_name) {
        phone.timezone_name = pickTimezone();
        patched = true;
      }
    }
    if (patched) {
      await this._persist();
      console.log("PhonePoolDO: patched missing timezones");
    }

    if (pool.length >= POOL_SIZE) return Response.json({ ok: true, size: pool.length });

    const start = pool.length + 1;
    const end   = Math.min(pool.length + POOL_BATCH, POOL_SIZE);
    for (let i = start; i <= end; i++) pool.push(generatePhone(i));
    await this._persist();
    console.log(`PhonePoolDO: grew ${start - 1} → ${pool.length}/${POOL_SIZE}`);
    return Response.json({ ok: true, size: pool.length });
  }
}

// Helper — returns the single global PhonePoolDO stub
function getPoolDO(env) {
  const id = env.PHONE_POOL.idFromName("main");
  return env.PHONE_POOL.get(id);
}

export default {
  async fetch(request, env, ctx) {
    // ── Country geo-block — must run before ANY other logic ──────────────────
    // Blocks RU and IR with HTTP 451 (Unavailable For Legal Reasons).
    const blockedCountry = request.cf?.country;
    if (blockedCountry === "RU" || blockedCountry === "IR") {
      return new Response(
        JSON.stringify({ error: "Service not available in your region." }),
        { status: 451, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Bot User-Agent blacklist — before anything else, except CORS preflight
    // (OPTIONS requests from real browsers often carry no meaningful UA).
    if (request.method !== "OPTIONS" && isBlockedUserAgent(request)) {
      return Response.redirect(RICKROLL_URL, 302);
    }

    try {
      return await handleRequest(request, env, ctx);
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
    // 1. Keep Render alive (ping /health so free-tier doesn't sleep)
    if (env.RENDER_URL) {
      const url = `${env.RENDER_URL.replace(/\/$/, "")}/health`;
      ctx.waitUntil(
        fetch(url, { headers: { "x-proxy-secret": env.PROXY_SECRET || "" } })
          .then(r => console.log(`keep-alive ping: ${r.status}`))
          .catch(e => console.log(`keep-alive ping failed: ${e.message}`))
      );
    }
    // 2. Grow phone pool — adds 50 phones per cron run until 2000 reached
    ctx.waitUntil(getPoolDO(env).fetch("http://do/grow", { method: "POST" }));
  },
};

// ── Rate limiting — 20 requests/min per IP ────────────────────────────────────
// Prefers the native Cloudflare Rate Limiting binding (RATE_LIMITER) — atomic,
// no eventual-consistency gaps under fast bursts. Falls back to a KV-based
// counter (best-effort — KV writes can lag under a burst) if the binding
// isn't configured, so this still works in envs without it wired up.
async function checkRateLimit(env, ip) {
  if (env.RATE_LIMITER) {
    try {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      return success;
    } catch {
      // Binding call failed — fall through to KV-based check below
    }
  }

  if (!env.META_KV) return true; // KV not bound — allow
  const key = `rl:${ip}`;
  try {
    const raw  = await env.META_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 60) return false; // blocked
    await env.META_KV.put(key, String(count + 1), { expirationTtl: 60 });
    return true;
  } catch {
    return true; // KV error — allow rather than block real users
  }
}

async function handleRequest(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const method = request.method;
    const cors   = corsHeaders(request);

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const secret = env.TOKEN_SECRET || null;

    // GET /health — intentionally minimal, no version/engine/config details
    if (pathname === "/health" && method === "GET") {
      return json({ status: "ok" }, 200, cors);
    }

    // GET /api/pool-status — phone pool health overview
    // Admin/monitoring only — never called by the frontend. Protected by the
    // same TOKEN_SECRET as other endpoints so internal infra details (pool
    // size, fail rate, degraded state) aren't publicly exposed.
    if (pathname === "/api/pool-status" && method === "GET") {
      if (secret) {
        const ok = await validateToken(new URL(request.url).searchParams.get("token"), secret);
        if (!ok) return err("Invalid or expired token.", 401, cors);
      }
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
    // Edge-cached (see below) so repeat requests from ANY visitor during the
    // same 6-hour rotation window are served straight from Cloudflare's
    // cache — the Worker doesn't even run for those, which is the actual
    // request-count saving (not just "same token value").
    if (pathname === "/api/token" && method === "GET") {
      // Origin lock — block cross-origin requests from non-allowed domains.
      // Same-origin requests (luldown.com page calling luldown.com/api/token)
      // send NO Origin header — those are always allowed.
      // Requests from evil.com send Origin: https://evil.com → blocked.
      const tokenOrigin = request.headers.get("Origin");
      if (
        tokenOrigin &&
        !ALLOWED_API_ORIGINS.includes(tokenOrigin) &&
        !tokenOrigin.startsWith("http://localhost") &&
        !tokenOrigin.startsWith("http://127.0.0.1")
      ) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      if (!secret) {
        return json({ token: "", ttl_seconds: TOKEN_TTL_SECONDS, dev_mode: true }, 200, cors);
      }

      const now    = Math.floor(Date.now() / 1000);
      const maxAge = Math.max(60, TOKEN_PERIOD_SECONDS - (now % TOKEN_PERIOD_SECONDS));
      const token  = await generateToken(secret);
      // Send remaining window time so the client knows exactly how long this
      // token is valid and caches it in localStorage for the right duration.
      // Cache-Control: no-store — token must never be cached at Cloudflare edge.
      // Edge caching meant a fresh deploy kept serving the old token for up to
      // 6 hours; with no-store every request hits the Worker and gets a fresh
      // token instantly. Client-side localStorage caching (api.ts) is enough.
      return json({ token, ttl_seconds: maxAge }, 200, {
        ...cors,
        "Cache-Control": "no-store",
      });
    }

    // POST /api/debug — returns raw TikTok API response for a video (no cache)
    // Dev-only tool — disabled in production unless NODE_ENV=development is
    // explicitly set on the Worker (it isn't, by default).
    if (pathname === "/api/debug" && method === "POST") {
      if (env.NODE_ENV !== "development") return new Response("Not found", { status: 404, headers: cors });

      // Rate-limit + token-guard — same rules as /api/info
      const dbgIp = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await checkRateLimit(env, dbgIp)) return err("Too many requests. Please slow down.", 429, cors);
      let body = {};
      try { body = await request.json(); } catch { return err("Invalid JSON", 400, cors); }
      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401, cors);
      }
      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400, cors);
      const videoId = await resolveVideoId(tiktokUrl, env);
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
      const originBlockInfo = requireOrigin(request, cors);
      if (originBlockInfo) return originBlockInfo;
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";

      // Parallel: rate limit check + body parse at the same time
      const [rateLimitOk, body] = await Promise.all([
        checkRateLimit(env, ip),
        request.json().catch(() => null),
      ]);
      if (!rateLimitOk) return err("Too many requests. Please slow down.", 429, cors);
      if (!body) return err("Invalid JSON", 400, cors);

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401, cors);
      }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400, cors);

      let p;
      try {
        p = await fetchTikTokVideo(tiktokUrl, env, ctx);
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

    // POST /api/profile — fetch latest 10 videos from a TikTok profile
    if (pathname === "/api/profile" && method === "POST") {
      const originBlockProfile = requireOrigin(request, cors);
      if (originBlockProfile) return originBlockProfile;
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";

      // Parallel: rate limit check + body parse at the same time
      const [rateLimitOkP, bodyP] = await Promise.all([
        checkRateLimit(env, ip),
        request.json().catch(() => null),
      ]);
      if (!rateLimitOkP) return err("Too many requests. Please slow down.", 429, cors);
      const body = bodyP;
      if (!body) return err("Invalid JSON", 400, cors);

      if (secret) {
        const ok = await validateToken(body.token, secret);
        if (!ok) return err("Invalid or expired token. Please refresh the page.", 401, cors);
      }

      // Extract username from profile URL e.g. tiktok.com/@username
      const rawProfileUrl = (body.url || "").trim();
      const usernameMatch = rawProfileUrl.match(/\/@([\w.]+)/);
      if (!usernameMatch) return err("Invalid TikTok profile URL. Use a link like tiktok.com/@username", 400, cors);
      const username = usernameMatch[1];

      const phone = await getPoolDO(env).fetch("http://do/pick", { method: "POST" }).then(r => r.json());

      let profileData;
      try {
        const result = await callUserPostsAPI(username, phone);
        profileData  = result.data;
      } catch (e) {
        await getPoolDO(env).fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: e.errorType || "network" }) });
        return err(`Failed to fetch profile: ${e.message}`, 422, cors);
      }

      const awemeList = profileData?.aweme_list || [];
      if (awemeList.length === 0) {
        await getPoolDO(env).fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: "network" }) });
        return err("No videos found. This account may be private or have no posts.", 404, cors);
      }

      await getPoolDO(env).fetch("http://do/record", { method: "POST", body: JSON.stringify({ id: phone.id, errorType: "ok" }) });

      // Parse videos using existing parseAweme()
      const videos = awemeList.slice(0, 10).map(aweme => {
        const p = parseAweme(aweme);
        return {
          title:         p.title,
          thumbnail:     p.thumbUrl,
          download_urls: {
            mp4_1080: p.videoUrl,
            mp4_720:  p.videoUrl720,
            mp3:      p.audioUrl,
          },
        };
      });

      // Profile info from first video's author field
      const firstAuthor   = awemeList[0]?.author || {};
      const outUsername   = firstAuthor.unique_id || firstAuthor.uniqueId || username;
      const displayName   = firstAuthor.nickname  || outUsername;
      const avatar        = firstUrl(
        (firstAuthor.avatar_thumb  || firstAuthor.avatarThumb  || {}).url_list ||
        (firstAuthor.avatar_medium || firstAuthor.avatarMedium || {}).url_list || [],
      );
      const followerCount = firstAuthor.follower_count || firstAuthor.followerCount || 0;

      return json({
        success:        true,
        username:       `@${outUsername}`,
        display_name:   displayName,
        avatar,
        follower_count: followerCount,
        videos,
      }, 200, cors);
    }

    // GET /api/proxy — stream TikTok CDN file
    if (pathname === "/api/proxy" && method === "GET") {
      const proxyIp = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!await checkRateLimit(env, proxyIp)) return err("Too many requests. Please slow down.", 429, cors);

      const params   = new URL(request.url).searchParams;
      const rawUrl   = params.get("url");
      // Strip any chars that could break Content-Disposition header (quotes, newlines, semicolons)
      const filename = (params.get("filename") || "luldown.mp4").replace(/[^\w.\-]/g, "_");

      if (!rawUrl) return err("Missing url parameter", 400, cors);

      let cdnUrl;
      try { cdnUrl = decodeURIComponent(rawUrl); } catch { return err("Invalid URL encoding", 400, cors); }

      const allowed = ["tiktok.com", "tiktokcdn.com", "tiktokcdn-us.com", "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com"];
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
          "Content-Type":        filename.endsWith(".mp3") ? "audio/mpeg" : (upstream.headers.get("Content-Type") || "video/mp4"),
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
        "Content-Type":        filename.endsWith(".mp3") ? "audio/mpeg" : (upstream.headers.get("Content-Type") || "video/mp4"),
        "Cache-Control":       "no-store",
      });
      const cl2 = upstream.headers.get("Content-Length");
      if (cl2) respHeaders2.set("Content-Length", cl2);

      return new Response(upstream.body, { status: 200, headers: respHeaders2 });
    }

    // POST /api/download — return CDN URL for direct browser download
    if (pathname === "/api/download" && method === "POST") {
      const originBlockDl = requireOrigin(request, cors);
      if (originBlockDl) return originBlockDl;
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
        p = await fetchTikTokVideo(tiktokUrl, env, ctx);
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
        // Build music CDN URL from stable Music ID (never expires).
        // Falls back to audioUrl from play_url list if musicId is unavailable.
        const musicId = p.musicId || "";
        cdnUrl = musicId
          ? `https://sf19.tiktokcdn-us.com/obj/musically-maliva-obj/${musicId}.mp3`
          : (p.audioUrl || "");
        filename = "luldown_audio"; ext = "mp3"; mediaType = "audio/mpeg";
      }

      if (!cdnUrl) return err(
        format === "mp3"
          ? "Audio not available for this video. The background music may be restricted in your region. Try downloading the video instead."
          : "Download URL not available. The video may be private or region-restricted.",
        422, cors
      );

      return json({ success: true, cdn_url: cdnUrl, filename: `${filename}.${ext}`, media_type: mediaType, title: p.title, author: p.username, format }, 200, cors);
    }

    // POST /api/cache/purge — delete all cached url:* entries from KV
    // Useful after a parser fix to force fresh fetches on next request.
    // Protected by TOKEN_SECRET (same token as other endpoints).
    if (pathname === "/api/cache/purge" && method === "POST") {
      if (!env.META_KV) return err("KV not bound", 500, cors);

      // Fail closed: if TOKEN_SECRET isn't configured, refuse rather than
      // silently allowing anyone to wipe the entire KV cache.
      if (!secret) return err("Cache purge is disabled: TOKEN_SECRET not configured.", 403, cors);

      let body = {};
      try { body = await request.json(); } catch {}

      const ok = await validateToken(body.token, secret);
      if (!ok) return err("Invalid or expired token.", 401, cors);

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
