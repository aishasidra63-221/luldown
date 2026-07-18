// If WORKER_URL is set at build time, use the Cloudflare Worker directly.
// Otherwise fall back to the local Python API proxy (for dev).
declare const __WORKER_URL__: string;
const WORKER_URL = typeof __WORKER_URL__ !== "undefined" ? __WORKER_URL__.replace(/\/+$/, "") : "";
const API_BASE = WORKER_URL || "/tikapi";

const HISTORY_KEY = "luldown_history";
const MAX_HISTORY = 10;

export interface DownloadUrls {
  mp4_1080?: string;
  mp4_720?:  string;
  mp3?:      string;
}

export interface VideoInfo {
  success: boolean;
  title: string;
  author: string;
  author_avatar?: string;
  duration: number;
  thumbnail: string;
  view_count?:    number;
  like_count?:    number;
  comment_count?: number;
  share_count?:   number;
  is_photo?: boolean;
  images?: string[];
  download_urls?: DownloadUrls;
}

export interface ProfileVideo {
  title: string;
  thumbnail: string;
  download_urls: DownloadUrls;
}

export interface ProfileInfo {
  success: boolean;
  username: string;
  display_name: string;
  avatar: string;
  follower_count: number;
  videos: ProfileVideo[];
}

export interface HistoryItem {
  url: string;
  title: string;
  author: string;
  thumbnail: string;
  format: string;
  downloaded_at: number;
}

export type DownloadFormat = "mp4_720" | "mp4_1080" | "mp3" | "thumbnail";

// ─── HMAC Token cache ─────────────────────────────────────────────────────────
// Server now rotates the token 4x/day (every 6 hours — see cloudflare-worker/
// worker.js) and every visitor gets the identical token during that window.
// Cached here for 5h50m (10 min buffer before the 6h server-side expiry).
// Persisted in localStorage (not just in-memory) so a page reload/new tab
// within that window reuses the same token instead of requesting a new one —
// cuts /api/token traffic without weakening the bot-protection (a token is
// still required and still time-limited).

const TOKEN_CACHE_MS = (6 * 60 - 10) * 60 * 1000; // 5h50m fallback (if server doesn't send ttl_seconds)
const TOKEN_STORAGE_KEY = "luldown_token_cache";

let _cachedToken    = "";
let _tokenFetchedAt = 0;
let _tokenCacheMs   = TOKEN_CACHE_MS; // updated per-fetch from server's ttl_seconds
let _tokenFetching: Promise<string> | null = null;

function _loadTokenFromStorage(): void {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string" && typeof parsed.fetchedAt === "number") {
      _cachedToken    = parsed.token;
      _tokenFetchedAt = parsed.fetchedAt;
      // Restore the server-supplied TTL so expiry is correct across reloads
      if (typeof parsed.cacheMs === "number") _tokenCacheMs = parsed.cacheMs;
    }
  } catch {
    // Corrupt/inaccessible storage — ignore, will just fetch a fresh token
  }
}

function _saveTokenToStorage(token: string, fetchedAt: number, cacheMs: number): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, fetchedAt, cacheMs }));
  } catch {
    // Storage full/unavailable (e.g. private mode) — fine, memory cache still works
  }
}

// Load any still-valid token saved from a previous page load, before first use
_loadTokenFromStorage();

async function getToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still fresh — uses server-supplied TTL, not a hardcoded value
  if (_cachedToken && now - _tokenFetchedAt < _tokenCacheMs) {
    return _cachedToken;
  }

  // Deduplicate concurrent fetches — only one in-flight at a time
  if (_tokenFetching) return _tokenFetching;

  _tokenFetching = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/token`);
      if (res.ok) {
        const data = await res.json();
        _cachedToken    = data.token || "";
        _tokenFetchedAt = Date.now();
        // Use server's remaining window time (ttl_seconds) minus 60s buffer so
        // we refresh before the token expires, not after. Falls back to 5h50m
        // if server doesn't send ttl_seconds (old Worker / dev mode).
        _tokenCacheMs = data.ttl_seconds
          ? Math.max(60_000, (data.ttl_seconds - 60) * 1000)
          : TOKEN_CACHE_MS;
        _saveTokenToStorage(_cachedToken, _tokenFetchedAt, _tokenCacheMs);
      }
    } catch {
      // Network error — use empty token (Worker will allow if secret not set)
      _cachedToken    = "";
      _tokenFetchedAt = Date.now();
    } finally {
      _tokenFetching = null;
    }
    return _cachedToken;
  })();

  return _tokenFetching;
}

// Pre-fetch token as soon as this module loads (so it's ready before first use)
getToken();

// ─── Local history (localStorage) ────────────────────────────────────────────

function _loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function _saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function _addHistoryEntry(entry: HistoryItem) {
  let items = _loadHistory().filter((h) => h.url !== entry.url);
  items.unshift(entry);
  if (items.length > MAX_HISTORY) items = items.slice(0, MAX_HISTORY);
  _saveHistory(items);
}

// ─── Proxy download ───────────────────────────────────────────────────────────
// Worker /api/proxy streams the TikTok CDN file with proper Referer headers.
// Browser never touches TikTok CDN directly → no "Access Denied".

function _sanitizeFilename(title: string): string {
  return title
    .replace(/[^\w\s-]/g, "")   // keep letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, "_")        // spaces → underscores
    .slice(0, 60)                 // max 60 chars
    || "luldown";                 // fallback if title is blank after sanitize
}

async function _cdnDownload(cdnUrl: string, filename: string): Promise<void> {
  const proxyUrl =
    `${API_BASE}/api/proxy?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;

  // Navigate to the proxy URL — browser shows its native loading bar,
  // detects Content-Disposition: attachment, saves the file, and keeps
  // the current page exactly as-is.
  window.location.href = proxyUrl;
}

// ─── Profile URL detection ────────────────────────────────────────────────────
export function isProfileUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const hostname = u.hostname;
    const allowed  = ["tiktok.com", "douyin.com", "musical.ly"];
    if (!allowed.some(d => hostname === d || hostname.endsWith("." + d))) return false;
    // Has @username but is NOT a single video/photo link
    return /\/@[\w.]+/.test(u.pathname) && !/\/(video|photo)\//.test(u.pathname);
  } catch { return false; }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchProfileInfo(url: string): Promise<ProfileInfo> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token }),
  });

  if (res.status === 401) {
    _cachedToken    = "";
    _tokenFetchedAt = 0;
    const freshToken = await getToken();
    const retry = await fetch(`${API_BASE}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, token: freshToken }),
    });
    if (!retry.ok) {
      const errData = await retry.json().catch(() => ({ detail: "Failed to fetch profile" }));
      throw new Error(errData.detail || "Failed to fetch profile");
    }
    return retry.json();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Failed to fetch profile" }));
    throw new Error(errData.detail || "Failed to fetch profile");
  }
  return res.json();
}

export async function downloadProfileVideo(
  cdnUrl: string,
  title: string,
  format: "mp4_1080" | "mp4_720" | "mp3",
): Promise<void> {
  const ext      = format === "mp3" ? "mp3" : "mp4";
  const filename = `${_sanitizeFilename(title)}_${format}.${ext}`;
  await _cdnDownload(cdnUrl, filename);
}

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token }),
  });

  // Token expired at the 6-hour boundary — silently fetch a fresh one and retry once
  if (res.status === 401) {
    _cachedToken    = "";
    _tokenFetchedAt = 0;
    const freshToken = await getToken();
    const retry = await fetch(`${API_BASE}/api/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, token: freshToken }),
    });
    if (!retry.ok) {
      const errData = await retry.json().catch(() => ({ detail: "Failed to fetch info" }));
      throw new Error(errData.detail || "Failed to fetch video info");
    }
    return retry.json();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Failed to fetch info" }));
    throw new Error(errData.detail || "Failed to fetch video info");
  }
  return res.json();
}

const FORMAT_FILENAME: Record<DownloadFormat, string> = {
  mp4_1080:  "luldown_1080p.mp4",
  mp4_720:   "luldown_720p.mp4",
  mp3:       "luldown_audio.mp3",
  thumbnail: "luldown_thumbnail.jpg",
};

export async function downloadVideo(
  url: string,
  format: DownloadFormat,
  videoMeta?: { title?: string; author?: string; thumbnail?: string; download_urls?: DownloadUrls },
): Promise<void> {
  // Thumbnail — download the cover image directly, no API call needed
  if (format === "thumbnail") {
    const thumbUrl = videoMeta?.thumbnail;
    if (!thumbUrl) throw new Error("No thumbnail available for this video");
    _addHistoryEntry({
      url,
      title:        videoMeta?.title  || "TikTok Video",
      author:       videoMeta?.author || "Unknown",
      thumbnail:    thumbUrl,
      format,
      downloaded_at: Math.floor(Date.now() / 1000),
    });
    await _cdnDownload(thumbUrl, FORMAT_FILENAME.thumbnail);
    return;
  }

  // Fast path — use the CDN URL already returned by /api/info (no second API call)
  const cachedCdnUrl = videoMeta?.download_urls?.[format as Exclude<DownloadFormat, "thumbnail">];

  let cdnUrl: string;
  let filename: string;
  let title:    string;
  let author:   string;

  if (cachedCdnUrl) {
    cdnUrl   = cachedCdnUrl;
    title    = videoMeta?.title  || "TikTok Video";
    author   = videoMeta?.author || "Unknown";
    const ext = format === "mp3" ? "mp3" : "mp4";
    filename = `${_sanitizeFilename(title)}_${format}.${ext}`;
  } else {
    // Fallback — call /api/download (e.g. if info was fetched by older code)
    const token = await getToken();
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format, token }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Download failed" }));
      if (res.status === 401) {
        _cachedToken    = "";
        _tokenFetchedAt = 0;
      }
      throw new Error(errData.detail || "Download failed");
    }

    const data  = await res.json();
    cdnUrl   = data.cdn_url;
    filename = data.filename || FORMAT_FILENAME[format];
    title    = data.title    || videoMeta?.title  || "TikTok Video";
    author   = data.author   || videoMeta?.author || "Unknown";

    if (!cdnUrl) throw new Error("No download URL received");
  }

  _addHistoryEntry({
    url,
    title,
    author,
    thumbnail:     videoMeta?.thumbnail || "",
    format,
    downloaded_at: Math.floor(Date.now() / 1000),
  });

  await _cdnDownload(cdnUrl, filename);
}

// Photo CDN-direct download — no server call at all, pure CDN
export async function downloadPhoto(cdnUrl: string, index: number): Promise<void> {
  const filename = `luldown_photo_${index + 1}.jpg`;
  await _cdnDownload(cdnUrl, filename);
}

// ─── History (localStorage) ───────────────────────────────────────────────────

export async function fetchHistory(): Promise<HistoryItem[]> {
  return _loadHistory();
}

export async function clearHistory(): Promise<void> {
  _saveHistory([]);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
