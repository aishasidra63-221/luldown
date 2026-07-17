import { useState } from "react";
import { Download, Video } from "lucide-react";
import { ProfileInfo, ProfileVideo, downloadProfileVideo } from "@/lib/api";

interface Props {
  profile: ProfileInfo;
}

export default function ProfileResults({ profile }: Props) {
  const [downloading, setDownloading] = useState<number | null>(null);
  const avatarLetter = profile.username.replace("@", "").charAt(0).toUpperCase();

  const handleDownload = async (video: ProfileVideo, index: number) => {
    const url    = video.download_urls.mp4_1080 || video.download_urls.mp4_720;
    const format = video.download_urls.mp4_1080 ? "mp4_1080" : "mp4_720";
    if (!url) return;
    setDownloading(index);
    try {
      await downloadProfileVideo(url, video.title, format);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{
      animation: "fadeUp 0.4s ease both",
      borderRadius: 20,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
    }}>

      {/* ── Profile header ── */}
      <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 22, color: "#fff",
          boxShadow: "0 0 0 2.5px rgba(124,58,237,0.4), 0 4px 14px rgba(124,58,237,0.4)",
          overflow: "hidden",
        }}>
          {profile.avatar ? (
            <img
              src={profile.avatar} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : avatarLetter}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>
            {profile.username}
          </p>
          {profile.display_name && profile.display_name !== profile.username.replace("@", "") && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {profile.display_name}
            </p>
          )}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.35)" }}>
            LATEST VIDEOS
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>
            {profile.videos.length}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* ── Video list ── */}
      <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {profile.videos.map((video, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 0,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {/* Thumbnail */}
            <div style={{ width: 56, height: 76, flexShrink: 0, position: "relative" }}>
              {video.thumbnail ? (
                <img
                  src={video.thumbnail} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "rgba(124,58,237,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Video size={20} color="rgba(255,255,255,0.3)" />
                </div>
              )}
              {/* number badge */}
              <div style={{
                position: "absolute", top: 4, left: 4,
                background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
                color: "#fff", fontSize: 9, fontWeight: 800,
                padding: "2px 5px", borderRadius: 4, lineHeight: 1.4,
              }}>
                {i + 1}
              </div>
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0, padding: "10px 12px" }}>
              <p style={{
                margin: 0, fontSize: 12.5, fontWeight: 600,
                color: "rgba(255,255,255,0.85)", lineHeight: 1.45,
                wordBreak: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {video.title || "TikTok Video"}
              </p>
            </div>

            {/* Download button */}
            <div style={{ paddingRight: 12, flexShrink: 0 }}>
              <button
                onClick={() => handleDownload(video, i)}
                disabled={downloading === i}
                title="Download Video"
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: downloading === i ? "rgba(124,58,237,0.4)" : "#7c3aed",
                  border: "none",
                  cursor: downloading === i ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(124,58,237,0.4)",
                  transition: "opacity 0.15s",
                  flexShrink: 0,
                }}
              >
                {downloading === i ? (
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "block",
                    animation: "spin 0.75s linear infinite",
                  }} />
                ) : (
                  <Download size={16} color="#fff" strokeWidth={2.4} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
