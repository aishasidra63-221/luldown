import { useEffect, useState } from "react";
import { fetchHistory, clearHistory, HistoryItem } from "@/lib/api";
import { Trash2, Download, Clock, Video, Music, Image, Film, Inbox, Loader2, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import BackHomeButtonLight from "@/components/BackHomeButtonLight";

const FORMAT_META: Record<string, { Icon: React.ElementType; label: string; color: string }> = {
  mp4_nowm:  { Icon: Video, label: "MP4 No Watermark", color: "#4f6ef7" },
  mp4_1080:  { Icon: Video, label: "MP4 1080p",        color: "#4f6ef7" },
  mp4_720:   { Icon: Film,  label: "MP4 720p",         color: "#a855f7" },
  mp4:       { Icon: Film,  label: "MP4 Original",     color: "#a855f7" },
  mp3:       { Icon: Music, label: "MP3 Audio",        color: "#10b981" },
  photo:     { Icon: Image, label: "Photo",            color: "#f59e0b" },
  thumbnail: { Icon: Image, label: "Thumbnail",        color: "#f59e0b" },
};

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [, navigate] = useLocation();

  const load = async () => {
    setLoading(true);
    setHistory(await fetchHistory());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    setShowConfirm(false);
    setClearing(true);
    await clearHistory();
    setHistory([]);
    setClearing(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>

      {/* ── Confirm popup ── */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="confirm-popup"
            style={{
              background: "#fff", borderRadius: 18,
              padding: "28px 28px 24px",
              width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Trash2 size={22} color="#ef4444" />
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
              Clear all history?
            </h2>
            <p style={{ fontSize: 13.5, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.55 }}>
              This will permanently delete all your download history from this device. This cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  background: "#f3f4f6", border: "none",
                  fontSize: 14, fontWeight: 600, color: "#374151",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  background: "#ef4444", border: "none",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
                }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="history-shell" style={{ margin: "0 auto", padding: "24px 16px 64px" }}>

        <div style={{ marginBottom: 20 }}>
          <BackHomeButtonLight />
        </div>

        {/* Header */}
        <div className="history-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: 0, marginBottom: 6 }}>
              Download History
            </h1>
            <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", margin: 0 }}>
              <Clock size={13} />
              Last 10 downloads — saved locally on this device
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={clearing}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444", fontSize: 13, fontWeight: 600,
                cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
              Clear All
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#9ca3af" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Loading history…</p>
          </div>

        ) : history.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Inbox size={32} color="#9ca3af" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 8 }}>
              No downloads yet
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 260, lineHeight: 1.6, margin: "0 0 24px" }}>
              Your download history will appear here after you download a TikTok video.
            </p>
            <Link href="/">
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "11px 24px", borderRadius: 12,
                background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
                <Download size={15} />
                Download a Video
              </div>
            </Link>
          </div>

        ) : (
          /* History list */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((item, i) => {
              const meta = FORMAT_META[item.format] ?? FORMAT_META["mp4_nowm"];
              const MetaIcon = meta.Icon;
              return (
                <div
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 14,
                    padding: "14px 14px",
                    display: "flex", gap: 12, alignItems: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Thumbnail or icon */}
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="history-thumb"
                      style={{ objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="history-thumb" style={{ borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MetaIcon size={26} color={meta.color} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title || "TikTok Video"}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 7px", display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                      <User size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(item.author || "Unknown").startsWith("@") ? item.author : `@${item.author || "Unknown"}`}
                      </span>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600, padding: "3px 8px",
                        borderRadius: 999, background: `${meta.color}15`,
                        color: meta.color,
                      }}>
                        <MetaIcon size={10} />
                        {meta.label}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9ca3af" }}>
                        <Clock size={10} /> {timeAgo(item.downloaded_at)}
                      </span>
                    </div>
                  </div>

                  {/* Re-download */}
                  <button
                    onClick={() => {
                      sessionStorage.setItem("prefill_url", item.url);
                      navigate("/");
                    }}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600,
                      color: "#4f6ef7", border: "1px solid rgba(79,110,247,0.25)",
                      background: "rgba(79,110,247,0.06)", cursor: "pointer",
                    }}
                  >
                    <Download size={12} />
                    Again
                  </button>
                </div>
              );
            })}

            <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
              {history.length} / 10 — older downloads auto-removed
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .confirm-popup { max-width: 320px; }
        @media (min-width: 600px) { .confirm-popup { max-width: 460px; } }
        .history-shell { max-width: 720px; }
        .history-thumb { width: 72px; height: 72px; }
        @media (min-width: 900px) {
          .history-shell { max-width: 960px; padding-left: 32px; padding-right: 32px; }
          .history-thumb { width: 100px; height: 100px; }
        }
        @media (min-width: 1280px) {
          .history-shell { max-width: 1080px; }
          .history-thumb { width: 110px; height: 110px; }
        }
        @media (max-width: 420px) {
          .history-header { flex-wrap: nowrap; }
          .history-header h1 { font-size: 22px !important; }
          .history-header button { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
