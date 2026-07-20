import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Download, Clock, Video } from "lucide-react";
import { StoryInfo, StoryItem, fetchStoryInfo, downloadProfileVideo } from "@/lib/api";
import { Lang, LANG_META } from "@/i18n/langMeta";

/* ── Helpers ── */
function timeLeft(expireAt: number): string {
  const diff = expireAt - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function expireColor(expireAt: number): string {
  const diff = expireAt - Math.floor(Date.now() / 1000);
  if (diff <= 0)      return "#ef4444";
  if (diff < 3600)    return "#f97316";
  if (diff < 10800)   return "#eab308";
  return "#22c55e";
}

/* ── Story Results ── */
function StoryResults({ info }: { info: StoryInfo }) {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);

  // Refresh expiry countdown every minute
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const avatarLetter = info.username.replace("@", "").charAt(0).toUpperCase();

  const handleDownload = async (story: StoryItem, i: number) => {
    const url = story.download_urls.mp4_1080 || story.download_urls.mp4_720;
    if (!url) return;
    setDownloading(i);
    try {
      await downloadProfileVideo(url, story.title || `story-${i + 1}`, "mp4_1080");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{
      animation: "fadeUp 0.4s ease both",
      borderRadius: 20, overflow: "hidden",
      background: "linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
    }}>

      {/* Profile header */}
      <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 22, color: "#fff", overflow: "hidden",
          boxShadow: "0 0 0 2.5px rgba(124,58,237,0.4), 0 4px 14px rgba(124,58,237,0.4)",
        }}>
          {info.avatar ? (
            <img src={info.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : avatarLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#fff" }}>{info.username}</p>
          {info.display_name && info.display_name !== info.username.replace("@", "") && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{info.display_name}</p>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.35)" }}>ACTIVE STORIES</p>
          <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{info.stories.length}</p>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* Story list */}
      <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {info.stories.map((story, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 0,
            background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {/* Thumbnail */}
            <div style={{ width: 56, height: 76, flexShrink: 0, position: "relative" }}>
              {story.thumbnail ? (
                <img src={story.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={20} color="rgba(255,255,255,0.3)" />
                </div>
              )}
              <div style={{
                position: "absolute", top: 4, left: 4,
                background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
                color: "#fff", fontSize: 9, fontWeight: 800,
                padding: "2px 5px", borderRadius: 4, lineHeight: 1.4,
              }}>{i + 1}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, padding: "10px 12px" }}>
              <p style={{
                margin: 0, fontSize: 12.5, fontWeight: 600,
                color: "rgba(255,255,255,0.85)", lineHeight: 1.45,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word",
              }}>
                {story.title || `Story ${i + 1}`}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                <Clock size={10} color={expireColor(story.expire_at)} />
                <span style={{ fontSize: 11, fontWeight: 600, color: expireColor(story.expire_at) }}>
                  {timeLeft(story.expire_at)}
                </span>
              </div>
            </div>

            {/* Download */}
            <div style={{ paddingRight: 12, flexShrink: 0 }}>
              <button
                onClick={() => handleDownload(story, i)}
                disabled={downloading === i}
                title="Download Story"
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: downloading === i ? "rgba(124,58,237,0.4)" : "#7c3aed",
                  border: "none", cursor: downloading === i ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 10px rgba(124,58,237,0.4)", transition: "opacity 0.15s",
                }}
              >
                {downloading === i ? (
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    borderRadius: "50%", display: "block",
                    animation: "spin 0.75s linear infinite",
                  }} />
                ) : <Download size={16} color="#fff" strokeWidth={2.4} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function StoryPage() {
  const params  = useParams<{ lang?: string }>();
  const rawLang = params?.lang ?? "en";
  const lang: Lang = (rawLang in LANG_META ? rawLang : "en") as Lang;
  const dir = LANG_META[lang]?.dir ?? "ltr";

  const [url, setUrl]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [result, setResult] = useState<StoryInfo | null>(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const info = await fetchStoryInfo(trimmed);
      setResult(info);
    } catch (e: any) {
      setError(e.message || "Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ overflowX: "hidden" }} dir={dir}>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)",
        position: "relative", overflow: "hidden",
        padding: "38px 24px 52px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.38) 0%, rgba(88,28,135,0.16) 45%, transparent 72%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(1.8rem,5.5vw,2.8rem)", fontWeight: 700, lineHeight: 1.1, color: "#fff", marginBottom: 8 }}>
            TikTok Story Downloader
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 36, lineHeight: 1.6 }}>
            Download TikTok stories before they expire — no watermark, free forever.
          </p>

          {/* Input */}
          <div style={{ display: "flex", gap: 10, maxWidth: 580, margin: "0 auto" }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFetch()}
              placeholder="https://tiktok.com/@username"
              style={{
                flex: 1, padding: "14px 18px", borderRadius: 14, fontSize: 15,
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)",
                color: "#fff", outline: "none",
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              style={{
                padding: "14px 24px", borderRadius: 14, fontSize: 15, fontWeight: 700,
                background: loading ? "rgba(124,58,237,0.5)" : "#7c3aed",
                border: "none", color: "#fff", cursor: loading ? "wait" : "pointer",
                whiteSpace: "nowrap", minWidth: 110,
              }}
            >
              {loading ? "Loading…" : "Get Stories"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: "12px 18px", borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ marginTop: 24, textAlign: "left", maxWidth: 580, margin: "24px auto 0" }}>
              <StoryResults info={result} />
            </div>
          )}

          <div style={{ marginTop: 28, height: 24 }} />
        </div>
      </section>

      {/* Info section */}
      <section style={{ background: "#fff", padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.7rem)", fontWeight: 700, color: "#111827", marginBottom: 16 }}>
            How to Download TikTok Stories
          </h2>
          <p style={{ fontSize: 14.5, color: "#6b7280", lineHeight: 1.75, marginBottom: 14 }}>
            TikTok stories disappear after 24 hours. Our downloader lets you save them instantly — just paste the profile URL and click "Get Stories".
          </p>
          <p style={{ fontSize: 14.5, color: "#6b7280", lineHeight: 1.75 }}>
            Each story shows exactly how much time is left before it expires. Download them in HD quality, no watermark, completely free.
          </p>
        </div>
      </section>

    </div>
  );
}
