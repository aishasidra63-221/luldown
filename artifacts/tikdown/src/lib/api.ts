// If WORKER_URL is set at build time, use the Cloudflare Worker directly.
// Otherwise fall back to the local Python API proxy (for dev).
declare const __WORKER_URL__: string;
const WORKER_URL = typeof __WORKER_URL__ !== "undefined" ? __WORKER_URL__ : "";
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
// Token is fetched once on first use and cached for 14 min (1 min buffer before
// the 15 min server-side expiry). Refreshed automatically on next request.

const TOKEN_CACHE_MS = 14 * 60 * 1000; // 14 minutes in ms

let _cachedToken    = "";
let _tokenFetchedAt = 0;
let _tokenFetching: Promise<string> | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still fresh
  if (_cachedToken && now - _tokenFetchedAt < TOKEN_CACHE_MS) {
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

async function _cdnDownload(cdnUrl: string, filename: string): Promise<void> {
  // Route through Worker proxy so TikTok CDN doesn't block the request
  const proxyUrl =
    `${API_BASE}/api/proxy?url=${encodeURIComponent(cdnUrl)}&filename=${encodeURIComponent(filename)}`;

  // Create a hidden <a> pointing to the proxy — browser streams the download
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchVideoInfo(
  url: string,
  recaptchaToken?: string,
): Promise<VideoInfo> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      token,
      recaptcha_token: recaptchaToken ?? null,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Failed to fetch info" }));
    // Token expired mid-session — clear cache so next call gets a fresh one
    if (res.status === 401) {
      _cachedToken    = "";
      _tokenFetchedAt = 0;
    }
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
  recaptchaToken?: string,
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
    filename = FORMAT_FILENAME[format];
    title    = videoMeta?.title  || "TikTok Video";
    author   = videoMeta?.author || "Unknown";
  } else {
    // Fallback — call /api/download (e.g. if info was fetched by older code)
    const token = await getToken();
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        format,
        token,
        recaptcha_token: recaptchaToken ?? null,
      }),
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
