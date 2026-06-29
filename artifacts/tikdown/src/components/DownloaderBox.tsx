import { useState, useCallback } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Video, Music, Film, Clipboard, Download, Image,
  AlertCircle, Loader2, X, FlaskConical, Link as LinkIcon,
} from "lucide-react";

const FORMAT_OPTIONS: { format: DownloadFormat; label: string; Icon: React.ElementType }[] = [
  { format: "mp4_1080",  label: "Download HD 1080p — No Watermark", Icon: Video },
  { format: "mp4_720",   label: "Download 720p — No Watermark",     Icon: Film  },
  { format: "mp3",       label: "Download MP3 Audio — 192kbps",     Icon: Music },
  { format: "thumbnail", label: "Download Thumbnail",               Icon: Image },
];

const DEMO_DATA: VideoInfo = {
  success: true,
  title: "How your result card looks 🎉 — paste any TikTok link to try it for real",
  author: "@creator_username",
  duration: 47,
  thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
  view_count: 2400000,
  like_count: 184000,
  comment_count: 3200,
  share_count: 12000,
  is_photo: false,
  download_urls: { mp4_1080: "", mp4_720: "", mp3: "" },
};

type Step = "idle" | "loading-info" | "info-ready" | "error";
interface Props { highlightFormat?: DownloadFormat; }

export default function DownloaderBox({ highlightFormat }: Props) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState("");
  const [activeDownload, setActiveDownload] = useState<DownloadFormat | null>(null);
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(async (action: string) => {
    if (!executeRecaptcha) return undefined;
    try { return await executeRecaptcha(action); } catch { return undefined; }
  }, [executeRecaptcha]);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsDemo(false); setStep("loading-info"); setError(""); setInfo(null);
    try {
      const token = await getToken("fetch_info");
      setInfo(await fetchVideoInfo(trimmed, token));
      setStep("info-ready");
    } catch (e: any) {
      setError(e.message || "Failed to fetch video info");
      setStep("error");
    }
  };

  const handleDemo = () => {
    setIsDemo(true);
    setUrl("https://www.tiktok.com/@demo/video/1234567890");
    setInfo(DEMO_DATA); setStep("info-ready"); setError("");
  };

  const handleDownload = async (format: DownloadFormat) => {
    if (isDemo) return;
    setActiveDownload(format);
    try {
      const token = await getToken("download");
      await downloadVideo(url.trim(), format, {
        title: info?.title, author: info?.author,
        thumbnail: info?.thumbnail, download_urls: info?.download_urls,
      }, token);
    } catch (e: any) {
      setError(e.message || "Download failed"); setStep("error");
    } finally { setActiveDownload(null); }
  };

  const handlePhotoDownload = async (imgUrl: string, index: number) => {
    if (isDemo) return;
    setPhotoDownloading(index);
    try { await downloadPhoto(imgUrl, index); }
    finally { setPhotoDownloading(null); }
  };

  const handlePaste = async () => {
    try { setUrl(await navigator.clipboard.readText()); } catch {}
  };

  const reset = () => { setUrl(""); setStep("idle"); setInfo(null); setError(""); setIsDemo(false); };

  const isPhoto = info?.is_photo && (info.images?.length ?? 0) > 0;
  const formats = highlightFormat
    ? [...FORMAT_OPTIONS].sort((a) => (a.format === highlightFormat ? -1 : 1))
    : FORMAT_OPTIONS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>

      {/* Input + button row — side by side on desktop, stacked on mobile */}
      <div className="input-action-row">
        <div className="input-box" style={{ flex: 1 }}>
          <div style={{ padding: "0 14px", color: "var(--cyan)", opacity: 0.6, flexShrink: 0 }}>
            <LinkIcon size={18} />
          </div>
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            placeholder="Paste TikTok link here..."
            style={{
              flex: 1, minWidth: 0, background: "transparent",
              padding: "15px 8px", fontSize: 14.5, outline: "none",
              color: "var(--text-primary)",
            }}
          />
          {url ? (
            <button onClick={reset} className="btn-ghost" style={{ margin: "0 10px", padding: "7px 14px", fontSize: 13 }}>
              <X size={14} /> Clear
            </button>
          ) : (
            <button onClick={handlePaste} className="btn-ghost" style={{ margin: "0 10px", padding: "7px 14px", fontSize: 13 }}>
              <Clipboard size={14} /> Paste
            </button>
          )}
        </div>

        <button
          onClick={handleFetch}
          disabled={!url.trim() || step === "loading-info"}
          className="btn-primary dl-btn"
        >
          {step === "loading-info"
            ? <><Loader2 size={18} className="animate-spin" /> Fetching…</>
            : <><Download size={18} /> Download Now</>}
        </button>
      </div>

      {/* Demo button */}
      {step === "idle" && (
        <button onClick={handleDemo} className="demo-btn">
          <FlaskConical size={13} />
          Preview demo — see result card
        </button>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="error-box">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </div>
      )}

      {/* Result card */}
      {step === "info-ready" && info && (() => {
        const tags = (info.title || "").match(/#\w+/g) ?? [];
        const cleanTitle = (info.title || "").replace(/#\w+/g, "").trim();
        return (
          <div className="result-card" style={{ animation: "fadeUp 0.35s ease both" }}>

            {isDemo && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--cyan)",
                background: "var(--result-header-bg)", borderBottom: "1px solid var(--result-header-border)",
              }}>
                <FlaskConical size={12} /> Demo preview
              </div>
            )}

            {info.thumbnail && (
              <div style={{ overflow: "hidden", maxHeight: 160 }}>
                <img src={info.thumbnail} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
              </div>
            )}

            <div style={{ padding: "14px 16px 10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--cyan) 0%, var(--cyan-dark) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 15, color: "#fff",
                }}>
                  {(info.author || "T").replace("@", "").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {info.author && (
                    <p style={{ fontWeight: 700, fontSize: 13, color: "var(--cyan)", marginBottom: 3 }}>
                      {info.author}
                    </p>
                  )}
                  {cleanTitle && (
                    <p style={{
                      fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.45,
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {cleanTitle}
                    </p>
                  )}
                </div>
              </div>
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {tags.slice(0, 5).map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                      background: "var(--tag-bg)", border: "1px solid var(--tag-border)", color: "var(--tag-color)",
                    }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {isPhoto ? (
              <div style={{ padding: "0 12px 12px" }}>
                <p style={{
                  textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                  color: "var(--text-muted)", marginBottom: 10,
                }}>
                  📸 Photo Post — {info.images!.length} images
                </p>
                {info.images!.length > 1 && (
                  <button
                    onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
                    disabled={photoDownloading !== null || isDemo}
                    className="gradient-btn"
                    style={{ width: "100%", padding: "12px", borderRadius: 10, marginBottom: 10, fontSize: 14 }}>
                    <Download size={15} /> Save All {info.images!.length} Photos
                  </button>
                )}
                <div style={{ display: "grid", gridTemplateColumns: info.images!.length === 1 ? "1fr" : "1fr 1fr", gap: 8 }}>
                  {info.images!.map((imgUrl, i) => (
                    <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--photo-btn-border)" }}>
                      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
                        <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        <div style={{
                          position: "absolute", top: 6, right: 6,
                          background: "rgba(0,0,0,0.65)", color: "#fff",
                          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                        }}>
                          {i + 1}/{info.images!.length}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePhotoDownload(imgUrl, i)}
                        disabled={photoDownloading !== null || isDemo}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 5, padding: "9px 0", fontSize: 12, fontWeight: 600,
                          color: "var(--cyan)", background: "transparent", border: "none",
                          borderTop: "1px solid var(--photo-btn-border)", cursor: "pointer",
                        }}>
                        {photoDownloading === i
                          ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                          : <><Download size={12} /> Save</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {formats.map(({ format, label, Icon }) => {
                  const isActive = activeDownload === format;
                  return (
                    <button
                      key={format}
                      onClick={() => handleDownload(format)}
                      disabled={!!activeDownload || isDemo}
                      className="gradient-btn"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 14, justifyContent: "flex-start" }}>
                      {isActive ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                      <span>{isActive ? "Downloading…" : label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
