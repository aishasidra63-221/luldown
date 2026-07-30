import { useState } from "react";
import { Download, Video } from "lucide-react";
import { StoryInfo, StoryItem, downloadVideo } from "@/lib/api";

interface Props {
  story: StoryInfo;
  onError?: (msg: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StoryCard({ item, author, index, onError }: { item: StoryItem; author: string; index: number; onError?: (msg: string) => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const cdnUrl = item.download_urls.mp4_1080 || item.download_urls.mp4_720 || "";
    if (!cdnUrl) { onError?.("Download URL not available"); return; }
    setDownloading(true);
    try {
      await downloadVideo(cdnUrl, "mp4_1080", {
        title: item.title || `story_${index + 1}`,
        author,
        download_urls: item.download_urls,
      });
    } catch (e: any) {
      onError?.(e.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{
      borderRadius: 14,
      overflow: "hidden",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Thumbnail */}
      <div style={{ position: "relative", width: "100%", paddingTop: "177.7%", background: "#0a0620" }}>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={`Story ${index + 1}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Video size={28} color="rgba(255,255,255,0.25)" />
          </div>
        )}
        {/* Time badge */}
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
          color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "2px 6px", borderRadius: 6, lineHeight: 1.4,
        }}>
          {timeAgo(item.create_at)}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "9px 6px",
          background: downloading ? "rgba(124,58,237,0.45)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
          border: "none", cursor: downloading ? "wait" : "pointer",
          color: "#fff", fontSize: 12, fontWeight: 700,
          direction: "ltr",
        }}
      >
        {downloading ? (
          <span style={{
            width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff", borderRadius: "50%",
            display: "inline-block", animation: "spin 0.75s linear infinite",
          }} />
        ) : (
          <Download size={13} color="#fff" strokeWidth={2.5} />
        )}
        {downloading ? "…" : "Save"}
      </button>
    </div>
  );
}

export default function StoryResultCard({ story, onError }: Props) {
  const avatarLetter = (story.display_name || story.username || "T").replace("@", "").charAt(0).toUpperCase();

  return (
    <div style={{
      animation: "fadeUp 0.4s ease both",
      borderRadius: 20,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
    }}>

      {/* ── Author header ── */}
      <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 20, color: "#fff", overflow: "hidden",
        }}>
          {story.avatar ? (
            <img
              src={story.avatar} alt={story.username}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : avatarLetter}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>
            {story.display_name || story.username}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            {story.username} · {story.stories.length} {story.stories.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* ── Stories grid ── */}
      <div style={{
        padding: "12px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}>
        {story.stories.map((item, i) => (
          <StoryCard
            key={i}
            item={item}
            author={story.username}
            index={i}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}
