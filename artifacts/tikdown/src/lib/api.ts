const API_BASE = "/tikapi";

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

async function getSessionToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/token`);
  if (!res.ok) return "";
  const data = await res.json();
  return data.token || "";
}

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

export async function downloadVideo(url: string, format: DownloadFormat): Promise<void> {
  const token = await getSessionToken();

  // Step 1: Ask our server for the CDN URL (lightweight — no video data)
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
  const filename: string = data.filename || "lul_downloader.mp4";

  if (!cdnUrl) throw new Error("No download URL received");

  // Photo format — download first image, open rest
  if (format === "photo" && data.all_images?.length > 0) {
    for (const imgUrl of data.all_images) {
      _triggerDownload(imgUrl, filename);
      await new Promise((r) => setTimeout(r, 300));
    }
    return;
  }

  // Step 2: Trigger direct download from TikTok CDN — zero server load
  _triggerDownload(cdnUrl, filename);
}

function _triggerDownload(cdnUrl: string, filename: string) {
  // Open CDN URL in new tab — browser downloads directly from TikTok CDN
  // Our server = 0 bytes transferred
  const a = document.createElement("a");
  a.href = cdnUrl;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  // download attr only works same-origin; for cross-origin CDN we use target=_blank
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
