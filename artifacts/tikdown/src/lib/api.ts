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
}

export interface HistoryItem {
  url: string;
  title: string;
  author: string;
  thumbnail: string;
  format: string;
  downloaded_at: number;
}

export type DownloadFormat = "mp4_nowm" | "mp4" | "mp3" | "photo";

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
  let items = _loadHistory().filter((h) => h.url !== entry.url); // dedupe
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

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
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
): Promise<void> {
  const token = await getSessionToken();

  const res = await fetch(`${API_BASE}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format, session_token: token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }

  const data = await res.json();
  const cdnUrl: string = data.cdn_url;
  const filename: string = data.filename || "lul_download.mp4";

  if (!cdnUrl) throw new Error("No download URL received");

  // ── Save to localStorage history immediately ──
  _addHistoryEntry({
    url,
    title: data.title || videoMeta?.title || "TikTok Video",
    author: data.author || videoMeta?.author || "Unknown",
    thumbnail: videoMeta?.thumbnail || "",
    format,
    downloaded_at: Math.floor(Date.now() / 1000),
  });

  // ── Trigger direct CDN download ──
  if (format === "photo" && data.all_images?.length > 0) {
    for (const imgUrl of data.all_images as string[]) {
      _triggerDownload(imgUrl, filename);
      await new Promise((r) => setTimeout(r, 350));
    }
    return;
  }

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
