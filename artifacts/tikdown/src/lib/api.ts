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

export type DownloadFormat = "mp4_720" | "mp4_1080" | "mp3";

// ─── Local history (localStorage) ────────────────────────────────────────────
// History is stored client-side — no server needed, fully private.

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

// ─── CDN-direct download ──────────────────────────────────────────────────────
// Worker returns CDN URL only — server never streams file bytes.
// Browser fetches directly from TikTok CDN.

async function _cdnDownload(cdnUrl: string, filename: string): Promise<void> {
  try {
    const res = await fetch(cdnUrl, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    // CORS blocked by CDN — open in new tab, user can long-press → Save
    window.open(cdnUrl, "_blank", "noopener,noreferrer");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchVideoInfo(
  url: string,
  recaptchaToken?: string,
): Promise<VideoInfo> {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, recaptcha_token: recaptchaToken ?? null }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "Failed to fetch info" }));
    throw new Error(errData.detail || "Failed to fetch video info");
  }
  return res.json();
}

const FORMAT_FILENAME: Record<DownloadFormat, string> = {
  mp4_1080: "luldown_1080p.mp4",
  mp4_720:  "luldown_720p.mp4",
  mp3:      "luldown_audio.mp3",
};

export async function downloadVideo(
  url: string,
  format: DownloadFormat,
  videoMeta?: { title?: string; author?: string; thumbnail?: string; download_urls?: DownloadUrls },
  recaptchaToken?: string,
): Promise<void> {
  // Fast path — use the CDN URL already returned by /api/info (no second API call)
  const cachedCdnUrl = videoMeta?.download_urls?.[format];

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
    const res = await fetch(`${API_BASE}/api/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format, recaptcha_token: recaptchaToken ?? null }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: "Download failed" }));
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
