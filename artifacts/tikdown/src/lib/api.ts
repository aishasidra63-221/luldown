import NProgress from "nprogress";
import JSZip from "jszip";

NProgress.configure({ showSpinner: false });

// If WORKER_URL is set at build time, use the Cloudflare Worker directly.
// Otherwise fall back to the local Python API proxy (for dev).
declare const __WORKER_URL__: string;
const WORKER_URL = typeof __WORKER_URL__ !== "undefined" ? __WORKER_URL__.replace(/\/+$/, "") : "";
export const API_BASE = WORKER_URL || "/tikapi";

const HISTORY_KEY = "luldown_history";
const MAX_HISTORY = 10;

export interface DownloadUrls {
  mp4_1080?:  string;
  mp4_720?:   string;
  mp3?:       string;
  thumbnail?: string;
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
  mp3_direct?: boolean;
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

export interface StoryItem {
  title: string;
  thumbnail: string;
  create_at: number;
  expire_at: number;
  download_urls: DownloadUrls;
}

export interface StoryInfo {
  success: boolean;
  username: string;
  display_name: string;
  avatar: string;
  stories: StoryItem[];
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

// ─── Thumbnail: signed → static (non-expiring) ───────────────────────────────
// TikTok signed URLs contain "-sign" in the hostname and x-expires/x-signature
// query params — they expire in ~12-24h. Stripping these gives a permanent URL.
function toStaticThumb(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace(/-sign\./, ".");
    u.searchParams.delete("x-expires");
    u.searchParams.delete("x-signature");
    return u.toString();
  } catch {
    return url;
  }
}

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

export function addHistoryEntry(entry: HistoryItem) {
  let items = _loadHistory().filter((h) => h.url !== entry.url);
  items.unshift(entry);
  if (items.length > MAX_HISTORY) items = items.slice(0, MAX_HISTORY);
  _saveHistory(items);
}

// ─── Proxy download ───────────────────────────────────────────────────────────
// Worker /api/proxy streams the TikTok CDN file with proper Referer headers.
// Browser never touches TikTok CDN directly → no "Access Denied".

function _extractVideoId(url: string): string {
  try {
    // Match long numeric video ID from full TikTok URLs
    const m = url.match(/\/(?:video|photo)\/(\d{10,25})/);
    if (m) return m[1];
    // Fallback: last long numeric segment anywhere in URL
    const n = url.match(/(\d{10,25})/);
    if (n) return n[1];
  } catch { /* ignore */ }
  return Date.now().toString();
}

function _proxyDownload(cdnUrl: string, filename: string, direct = false): void {
  const proxyUrl =
    `${API_BASE}/api/proxy?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}` +
    (direct ? "&direct=1" : "");

  // Navigate the current browser tab to the proxy endpoint without a
  // `download` attribute. Render/Worker return Content-Disposition: attachment,
  // so the browser starts its native download flow and keeps the current page
  // visible instead of rendering the response. This is also what makes the
  // browser's own navigation/loading line appear.
  window.location.assign(proxyUrl);
}

// Individual slideshow images use the browser download manager instead of
// navigating the current tab. This mirrors the mobile-friendly flow used by
// other downloaders: every click creates an independent download job, while
// the Render proxy still supplies the attachment response.
function _anchorProxyDownload(cdnUrl: string, filename: string): void {
  const proxyUrl =
    `${API_BASE}/api/proxy?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;
  const link = document.createElement("a");
  link.href = proxyUrl;
  link.download = "";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => link.remove(), 500);
}

async function _cdnDownload(cdnUrl: string, filename: string, direct = false): Promise<void> {
  _proxyDownload(cdnUrl, filename, direct);
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

export async function fetchStoryInfo(url: string): Promise<StoryInfo> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, token }),
  });

  if (res.status === 401) {
    _cachedToken    = "";
    _tokenFetchedAt = 0;
    const freshToken = await getToken();
    const retry = await fetch(`${API_BASE}/api/story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, token: freshToken }),
    });
    if (!retry.ok) {
      const errData = await retry.json().catch(() => ({ detail: "Failed to fetch stories" }));
      throw new Error(errData.detail || "Failed to fetch stories");
    }
    return retry.json();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Failed to fetch stories" }));
    throw new Error(errData.detail || "Failed to fetch stories");
  }
  return res.json();
}

export async function downloadProfileVideo(
  cdnUrl: string,
  title: string,
  format: "mp4_1080" | "mp4_720" | "mp3",
): Promise<void> {
  const ext      = format === "mp3" ? "mp3" : "mp4";
  const videoId  = _extractVideoId(cdnUrl) || Date.now().toString();
  const filename = `luldown_${videoId}.${ext}`;
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

export async function downloadVideo(
  url: string,
  format: DownloadFormat,
  videoMeta?: { title?: string; author?: string; thumbnail?: string; download_urls?: DownloadUrls; mp3_direct?: boolean },
): Promise<void> {
  const videoId = _extractVideoId(url);

  // Thumbnail — download the cover image directly, no API call needed
  if (format === "thumbnail") {
    const thumbUrl = videoMeta?.thumbnail;
    if (!thumbUrl) throw new Error("No thumbnail available for this video");
    addHistoryEntry({
      url,
      title:        videoMeta?.title  || "TikTok Video",
      author:       videoMeta?.author || "Unknown",
      thumbnail:    thumbUrl,
      format,
      downloaded_at: Math.floor(Date.now() / 1000),
    });
    await _cdnDownload(thumbUrl, `luldown_${videoId}.jpg`);
    return;
  }

  // Fast path — use the CDN URL already returned by /api/info (no second API call).
  // download_urls.mp3 is a permanent resolver URL (same structure as mp4 signaturev3).
  // Worker sends it to Render /resolve → Render follows redirect → returns CDN URL → 302.
  // Zero audio bytes flow through Render, same as video.
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
    filename = `luldown_${videoId}.${ext}`;
  } else {
    // Fallback — call /api/download (e.g. if info was fetched by older code)
    const token = await getToken();
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format, token }),
    });

    if (res.status === 401) {
      // Token expired at the 6-hour boundary — silently fetch a fresh one and retry once
      _cachedToken    = "";
      _tokenFetchedAt = 0;
      const freshToken = await getToken();
      const retry = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, token: freshToken }),
      });
      if (!retry.ok) {
        const errData = await retry.json().catch(() => ({ detail: "Download failed" }));
        throw new Error(errData.detail || "Download failed");
      }
      const retryData = await retry.json();
      cdnUrl   = retryData.cdn_url;
      title    = retryData.title    || videoMeta?.title  || "TikTok Video";
      author   = retryData.author   || videoMeta?.author || "Unknown";
      const retryExt = format === "mp3" ? "mp3" : "mp4";
      filename = `luldown_${videoId}.${retryExt}`;
      if (!cdnUrl) throw new Error("No download URL received");
    } else if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Download failed" }));
      throw new Error(errData.detail || "Download failed");
    }

    const data  = await res.json();
    cdnUrl   = data.cdn_url;
    title    = data.title    || videoMeta?.title  || "TikTok Video";
    author   = data.author   || videoMeta?.author || "Unknown";
    const fallbackExt = format === "mp3" ? "mp3" : "mp4";
    filename = `luldown_${videoId}.${fallbackExt}`;

    if (!cdnUrl) throw new Error("No download URL received");
  }

  addHistoryEntry({
    url,
    title,
    author,
    thumbnail:     videoMeta?.thumbnail || "",
    format,
    downloaded_at: Math.floor(Date.now() / 1000),
  });

  // Video MP3 (mp3_direct=true): Worker redirects browser straight to TikTok CDN
  //   (2-day CDN URL stored in vaudio: KV — no Render proxy needed).
  // All other formats + slideshow MP3: Worker proxies through Render (Content-Disposition).
  const useDirect = format === "mp3" && videoMeta?.mp3_direct === true;
  await _cdnDownload(cdnUrl, filename, useDirect);
}

// Individual photo download — always use the Worker proxy so production routes
// images through Render. This avoids mobile-browser differences in the
// Service Worker/hidden-iframe path while preserving the native download bar.
export async function downloadPhoto(
  cdnUrl: string,
  index: number,
  meta?: { url?: string; title?: string; author?: string; thumbnail?: string },
): Promise<void> {
  const videoId  = _extractVideoId(meta?.url || cdnUrl) || Date.now().toString();
  const filename = `luldown_${videoId}_${index + 1}.jpg`;
  addHistoryEntry({
    url:           meta?.url || cdnUrl,
    title:         meta?.title  || "TikTok Photo",
    author:        meta?.author || "Unknown",
    thumbnail:     meta?.thumbnail || "",
    format:        "photo",
    downloaded_at: Math.floor(Date.now() / 1000),
  });

  _anchorProxyDownload(cdnUrl, filename);
}

// ─── Download All as ZIP (browser-side, JSZip) ───────────────────────────────
// Fetches every image through the proxy (to bypass TikTok CDN referer blocks),
// zips them in-browser with JSZip, then triggers a single ZIP download.
// Render load: zero.  Worker calls: N (one per image, same as individual saves).
export async function downloadAllAsZip(
  images: string[],
  meta?: { url?: string; title?: string; author?: string },
): Promise<void> {
  const zip = new JSZip();
  const videoId = _extractVideoId(meta?.url || "") || Date.now().toString();

  // Use SW (browser IP) if active — same as individual Save buttons so TikTok
  // CDN never sees a datacenter address.  Fall back to Render proxy if SW is
  // not controlling this page yet (e.g. first load before SW activates).
  const useSW = "serviceWorker" in navigator && !!navigator.serviceWorker.controller;

  await Promise.all(
    images.map(async (imgUrl, i) => {
      const filename = `slide_${i + 1}.jpg`;
      const fetchUrl = useSW
        ? `/sw-download?url=${encodeURIComponent(imgUrl)}&filename=${encodeURIComponent(filename)}`
        : `${API_BASE}/api/proxy?url=${encodeURIComponent(imgUrl)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Failed to fetch image ${i + 1}`);
      const blob = await res.blob();
      zip.file(filename, blob);
    }),
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = `luldown_${videoId}_photos.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
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
