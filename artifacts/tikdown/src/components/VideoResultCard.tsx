import { useState } from "react";
import { downloadVideo, downloadPhoto, addHistoryEntry, VideoInfo, DownloadFormat } from "@/lib/api";
import { Music, Download, Image, Video } from "lucide-react";

interface FmtCfg {
  format: DownloadFormat;
  label: string;
  sub: string;
  leftBg: string;
  leftNode: React.ReactNode;
  btnBg: string;
  glowColor: string;
}

const FMTS: FmtCfg[] = [
  {
    format: "mp4_1080",
    label: "HD Download 1080p",
    sub: "No Watermark · Best Quality",
    leftBg: "#7c3aed",
    leftNode: <Video size={20} color="#fff" strokeWidth={2.2} />,
    btnBg: "#7c3aed",
    glowColor: "rgba(124,58,237,0.35)",
  },
  {
    format: "mp4_720",
    label: "Download 720p",
    sub: "No Watermark · Good Quality",
    leftBg: "#2563eb",
    leftNode: <Video size={20} color="#fff" strokeWidth={2.2} />,
    btnBg: "#2563eb",
    glowColor: "rgba(37,99,235,0.35)",
  },
  {
    format: "mp3",
    label: "Download MP3 Audio",
    sub: "192kbps · High Quality",
    leftBg: "#16a34a",
    leftNode: <Music size={19} color="#fff" strokeWidth={2.2} />,
    btnBg: "#16a34a",
    glowColor: "rgba(22,163,74,0.35)",
  },
  {
    format: "thumbnail",
    label: "Download Thumbnail",
    sub: "JPG Image · Full Resolution",
    leftBg: "#d97706",
    leftNode: <Image size={19} color="#fff" strokeWidth={2.2} />,
    btnBg: "#d97706",
    glowColor: "rgba(217,119,6,0.35)",
  },
];

interface Props {
  info: VideoInfo;
  url: string;
  highlightFormat?: DownloadFormat;
  onError?: (msg: string) => void;
}

export default function VideoResultCard({ info, url, highlightFormat, onError }: Props) {
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleDownload = async (format: DownloadFormat) => {
    try {
      await downloadVideo(url.trim(), format, {
        title: info?.title, author: info?.author,
        thumbnail: info?.thumbnail, download_urls: info?.download_urls,
      });
    } catch (e: any) {
      onError?.(e.message || "Download failed");
    }
  };

  const handlePhotoDownload = async (imgUrl: string, index: number) => {
    setPhotoDownloading(index);
    try { await downloadPhoto(imgUrl, index); }
    finally { setPhotoDownloading(null); }
  };

  const isPhoto = info.is_photo && (info.images?.length ?? 0) > 0;
  const fmts = highlightFormat
    ? [...FMTS].sort(a => a.format === highlightFormat ? -1 : 1)
    : FMTS;

  const tags = (info.title || "").match(/#[\w\u0900-\u097F]+/g) ?? [];
  const cleanTitle = (info.title || "").replace(/#[\w\u0900-\u097F]+/g, "").trim();
  const avatarLetter = (info.author || "T").replace("@", "").charAt(0).toUpperCase();

  return (
    <div style={{
      animation: "fadeUp 0.4s ease both",
      borderRadius: 20,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
    }}>

      {/* ── Thumbnail ── */}
      {info.thumbnail && (
        <div style={{ position: "relative" }}>
          <img
            src={info.thumbnail} alt={info.title ? `${info.author} — ${info.title.slice(0, 60)}` : "TikTok video thumbnail"}
            style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* ── Author + Title + Tags ── */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 21, color: "#fff",
            overflow: "hidden",
          }}>
            {info.author_avatar ? (
              <img
                src={info.author_avatar} alt={info.author || "TikTok creator"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : avatarLetter}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 13.5, color: "#ffffff", textAlign: "left" }}>
              {info.author}
            </p>
            {(cleanTitle || tags.length > 0) && (
              <>
                {!expanded ? (
                  <p style={{
                    margin: 0, fontSize: 11.5, fontWeight: 500,
                    color: "rgba(255,255,255,0.75)", lineHeight: 1.55,
                    wordBreak: "break-word",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {cleanTitle}{" "}
                    {tags.slice(0, 6).map(tag => (
                      <span key={tag} style={{ color: "#a78bfa", fontWeight: 600 }}>{tag}{" "}</span>
                    ))}
                  </p>
                ) : (
                  <>
                    <p style={{
                      margin: "0 0 2px", fontSize: 11.5, fontWeight: 500,
                      color: "rgba(255,255,255,0.75)", lineHeight: 1.55,
                      wordBreak: "break-word",
                    }}>
                      {cleanTitle}
                    </p>
                    {tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 5px", marginBottom: 2 }}>
                        {tags.slice(0, 6).map(tag => (
                          <span key={tag} style={{ color: "#a78bfa", fontWeight: 600, fontSize: 11.5 }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
                  <button
                    onClick={() => setExpanded(v => !v)}
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 20,
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11, fontWeight: 600,
                      padding: "3px 10px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {expanded ? "Less ∧" : "More ∨"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* ── Download options ── */}
      {isPhoto ? (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.35)", margin: 0 }}>
            📸 PHOTO SLIDESHOW &nbsp;·&nbsp; {info.images!.length} SLIDES
          </p>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {info.images!.map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => handlePhotoDownload(imgUrl, i)}
                title={`Save slide ${i + 1}`}
                style={{
                  position: "relative", flexShrink: 0,
                  width: 80, height: 108, borderRadius: 10, overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: photoDownloading !== null ? "wait" : "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
                }}
              >
                <img src={imgUrl} alt={`${info.author} photo slide ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                <div style={{
                  position: "absolute", top: 5, left: 5,
                  background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                  color: "#fff", fontSize: 9, fontWeight: 800,
                  padding: "2px 5px", borderRadius: 5, lineHeight: 1.4,
                }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
            disabled={photoDownloading !== null}
            style={{
              display: "flex", alignItems: "center", gap: 0,
              borderRadius: 13, overflow: "hidden",
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              border: "none", width: "100%", textAlign: "left",
              opacity: photoDownloading !== null ? 0.5 : 1,
              cursor: photoDownloading !== null ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}
          >
            <div style={{ width: 54, minWidth: 54, alignSelf: "stretch", background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Image size={19} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, padding: "14px 14px" }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                Download All {info.images!.length} Slides
              </p>
            </div>
            <div style={{ paddingRight: 14, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Download size={15} color="#fff" strokeWidth={2.4} />
              </div>
            </div>
          </button>

          {info.download_urls?.mp4_1080 || info.download_urls?.mp4_720 ? (
            <button
              onClick={() => handleDownload("mp4_1080")}
              style={{
                display: "flex", alignItems: "center", gap: 0,
                borderRadius: 13, overflow: "hidden",
                background: "#2563eb",
                border: "none", width: "100%", textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
              }}
            >
              <div style={{ width: 54, minWidth: 54, alignSelf: "stretch", background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Video size={20} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, padding: "14px 14px" }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>Download as Video</p>
              </div>
              <div style={{ paddingRight: 14, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Download size={15} color="#fff" strokeWidth={2.4} />
                </div>
              </div>
            </button>
          ) : null}

          {info.download_urls?.mp3 ? (
            <a
              href={info.download_urls.mp3}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => addHistoryEntry({
                url,
                title:         info?.title  || "TikTok Video",
                author:        info?.author || "Unknown",
                thumbnail:     info?.thumbnail || "",
                format:        "mp3",
                downloaded_at: Math.floor(Date.now() / 1000),
              })}
              style={{
                display: "flex", alignItems: "center", gap: 0,
                borderRadius: 13, overflow: "hidden",
                background: "#16a34a",
                textDecoration: "none",
                width: "100%", textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
              }}
            >
              <div style={{ width: 54, minWidth: 54, alignSelf: "stretch", background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Music size={19} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, padding: "14px 14px" }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>Download MP3</p>
              </div>
              <div style={{ paddingRight: 14, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Download size={15} color="#fff" strokeWidth={2.4} />
                </div>
              </div>
            </a>
          ) : null}
        </div>
      ) : (
        <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          {fmts.map(cfg => (
            <button
              key={cfg.format}
              onClick={() => handleDownload(cfg.format)}
              style={{
                display: "flex", alignItems: "center", gap: 0,
                borderRadius: 13, overflow: "hidden",
                background: cfg.btnBg,
                border: "none", width: "100%", textAlign: "left",
                cursor: "pointer",
                boxShadow: `0 4px 16px ${cfg.glowColor}`,
              }}
            >
              <div style={{
                width: 54, minWidth: 54, alignSelf: "stretch",
                background: "rgba(0,0,0,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {cfg.leftNode}
              </div>
              <div style={{ flex: 1, padding: "14px 14px" }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                  {cfg.label}
                </p>
              </div>
              <div style={{ paddingRight: 14, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(0,0,0,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Download size={15} color="#fff" strokeWidth={2.4} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
