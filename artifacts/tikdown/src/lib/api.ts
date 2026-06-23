const API_BASE = "/tikapi";
const HISTORY_KEY = "luldown_history";
const MAX_HISTORY = 10;

export interface VideoInfo {
  success: boolean;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  view_count?: number;
  like_count?: number;
  is_photo?: boolean;
  images?: string[];
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

// ─── Local history helpers ────────────────────────────────────────────────────

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

// ─── Session token ────────────────────────────────────────────────────────────

async function getSessionToken(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/token`);
    if (!res.ok) return "";
    const data = await res.json();
    return data.token || "";
  } catch {
    return "";
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
    const err = await res.json().catch(() => ({ detail: "Failed to fetch info" }));
    throw new Error(err.detail || "Failed to fetch video info");
  }
  return res.json();
}

export async function downloadVideo(
  url: string,
  format: DownloadFormat,
  videoMeta?: { title?: string; author?: string; thumbnail?: string },
  recaptchaToken?: string,
): Promise<void> {
  const token = await getSessionToken();

  const res = await fetch(`${API_BASE}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      format,
      session_token: token,
      recaptcha_token: recaptchaToken ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }

  const data = await res.json();
  const cdnUrl: string = data.cdn_url;
  const filename: string = data.filename || "luldown.mp4";

  if (!cdnUrl) throw new Error("No download URL received");

  _addHistoryEntry({
    url,
    title: data.title || videoMeta?.title || "TikTok Video",
    author: data.author || videoMeta?.author || "Unknown",
    thumbnail: videoMeta?.thumbnail || "",
    format,
    downloaded_at: Math.floor(Date.now() / 1000),
  });

  _triggerDownload(cdnUrl, filename);
}

function _triggerDownload(cdnUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = cdnUrl;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
