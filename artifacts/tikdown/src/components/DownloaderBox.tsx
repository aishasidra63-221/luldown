import { useState, useCallback, useRef } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Music, Clipboard, Download, Image, Video,
  AlertCircle, Loader2, X, FlaskConical,
} from "lucide-react";

/* ── Download row configs ── */
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

/* ── Demo data ── */
const DEMO_DATA: VideoInfo = {
  success: true,
  title: "Beautiful Nature Scenery in 4K – Relaxing Video 🌿 #nature #4k #relaxing",
  author: "@creator_username",
  duration: 28,
  thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85",
  view_count: 5400000,
  like_count: 1200000,
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    try { const t = await navigator.clipboard.readText(); if (t) { setUrl(t); return; } } catch {}
    const ta = document.createElement("textarea");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(ta); ta.focus();
    try { const ok = document.execCommand("paste"); if (ok && ta.value) { setUrl(ta.value); return; } }
    catch {} finally { document.body.removeChild(ta); }
    inputRef.current?.focus();
  };

  const reset = () => { setUrl(""); setStep("idle"); setInfo(null); setError(""); setIsDemo(false); };

  const isPhoto = info?.is_photo && (info.images?.length ?? 0) > 0;
  const fmts = highlightFormat
    ? [...FMTS].sort(a => a.format === highlightFormat ? -1 : 1)
    : FMTS;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%" }}>

      {/* ── Input row ── */}
      <div className="input-action-row">
        <div className="input-box" style={{ flex:1 }}>
          <input
            ref={inputRef} type="text" inputMode="url"
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            placeholder="Paste TikTok link here..."
            disabled={step === "loading-info"}
            style={{ flex:1, minWidth:0, background:"transparent", padding:"15px 8px 15px 16px", fontSize:14.5, outline:"none", color:"var(--text-primary)", fontWeight:400, fontFamily:"inherit" }}
          />
          {step === "loading-info" ? (
            <div style={{ margin:"0 14px", display:"flex", alignItems:"center", gap:7, color:"#7c3aed", fontSize:12, fontWeight:600, flexShrink:0 }}>
              <Loader2 size={17} className="animate-spin" style={{ flexShrink:0 }} />
              <span style={{ whiteSpace:"nowrap" }}>Fetching…</span>
            </div>
          ) : url ? (
            <button onClick={reset} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <X size={14} /> Clear
            </button>
          ) : (
            <button onClick={handlePaste} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <Clipboard size={14} /> Paste
            </button>
          )}
        </div>
        <button onClick={handleFetch} disabled={!url.trim() || step === "loading-info"} className="btn-primary dl-btn">
          {step === "loading-info"
            ? <><Loader2 size={18} className="animate-spin" /> Fetching…</>
            : <><Download size={18} /> Download Now</>}
        </button>
      </div>

      {/* Demo button */}
      {step === "idle" && (
        <button onClick={handleDemo} className="demo-btn">
          <FlaskConical size={13} /> Preview demo — see result card
        </button>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="error-box">
          <AlertCircle size={16} style={{ flexShrink:0, marginTop:2 }} /> {error}
        </div>
      )}

      {/* ══════════ RESULT CARD ══════════ */}
      {step === "info-ready" && info && (() => {
        const tags = (info.title || "").match(/#[\w\u0900-\u097F]+/g) ?? [];
        const cleanTitle = (info.title || "").replace(/#[\w\u0900-\u097F]+/g, "").trim();
        const avatarLetter = (info.author || "T").replace("@","").charAt(0).toUpperCase();

        return (
          <div style={{
            animation:"fadeUp 0.4s ease both",
            borderRadius:20,
            overflow:"hidden",
            background:"linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
            border:"1px solid rgba(255,255,255,0.08)",
            boxShadow:"0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
          }}>

            {/* Demo banner */}
            {isDemo && (
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"7px 0", fontSize:10.5, fontWeight:700, letterSpacing:"0.1em",
                textTransform:"uppercase", color:"#a78bfa",
                background:"rgba(124,58,237,0.15)", borderBottom:"1px solid rgba(124,58,237,0.2)",
              }}>
                <FlaskConical size={11} /> Demo preview
              </div>
            )}

            {/* ── Thumbnail ── */}
            {info.thumbnail && (
              <div style={{ position:"relative" }}>
                <img
                  src={info.thumbnail} alt=""
                  style={{ width:"100%", height:215, objectFit:"cover", display:"block" }}
                />
                {/* Bottom fade to card bg */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0, height:80,
                  background:"linear-gradient(to top, #0f0a2e, transparent)",
                }} />
              </div>
            )}

            {/* ── Author + Title + Tags ── */}
            <div style={{ padding:"14px 16px 16px" }}>
              {/* Avatar + username row */}
              <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:10 }}>
                <div style={{
                  width:44, height:44, borderRadius:"50%", flexShrink:0,
                  background:"linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:18, color:"#fff",
                  boxShadow:"0 0 0 2.5px rgba(124,58,237,0.4), 0 4px 14px rgba(124,58,237,0.4)",
                }}>
                  {avatarLetter}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14.5, color:"#c4b5fd" }}>
                    {info.author}
                  </p>
                </div>
              </div>

              {/* Title + Tags together */}
              {cleanTitle && (
                <p style={{
                  margin:0, fontSize:13.5, fontWeight:700,
                  color:"rgba(255,255,255,0.92)", lineHeight:1.6,
                }}>
                  {cleanTitle}
                  {tags.length > 0 && (
                    <>
                      {" "}
                      {tags.slice(0, 6).map(tag => (
                        <span key={tag} style={{ color:"#a78bfa", fontWeight:600 }}>
                          {tag}{" "}
                        </span>
                      ))}
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Divider */}
            <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"0 16px" }} />

            {/* ── Download options ── */}
            {isPhoto ? (
              <div style={{ padding:"12px" }}>
                <p style={{ textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:"0.06em", color:"rgba(255,255,255,0.4)", marginBottom:10 }}>
                  📸 Photo Post — {info.images!.length} images
                </p>
                {info.images!.length > 1 && (
                  <button
                    onClick={() => info.images!.forEach((u,i) => setTimeout(() => handlePhotoDownload(u,i), i*400))}
                    disabled={photoDownloading !== null || isDemo}
                    style={{
                      width:"100%", padding:12, borderRadius:12, marginBottom:10, fontSize:14,
                      border:"none", background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
                      color:"#fff", fontWeight:700, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    }}>
                    <Download size={15} /> Save All {info.images!.length} Photos
                  </button>
                )}
                <div style={{ display:"grid", gridTemplateColumns: info.images!.length === 1 ? "1fr" : "1fr 1fr", gap:8 }}>
                  {info.images!.map((imgUrl, i) => (
                    <div key={i} style={{ borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ position:"relative", aspectRatio:"3/4", overflow:"hidden" }}>
                        <img src={imgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
                        <div style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.65)", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:6 }}>
                          {i+1}/{info.images!.length}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePhotoDownload(imgUrl, i)}
                        disabled={photoDownloading !== null || isDemo}
                        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px 0", fontSize:12, fontWeight:600, color:"#a78bfa", background:"transparent", border:"none", borderTop:"1px solid rgba(255,255,255,0.08)", cursor:"pointer" }}>
                        {photoDownloading === i ? <><Loader2 size={12} className="animate-spin"/> Saving…</> : <><Download size={12}/> Save</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding:"12px 12px 14px", display:"flex", flexDirection:"column", gap:7 }}>
                {fmts.map(cfg => {
                  const isActive = activeDownload === cfg.format;
                  const busy = !!activeDownload;
                  return (
                    <div key={cfg.format} style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background:"rgba(255,255,255,0.04)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      transition:"background 0.2s",
                    }}>
                      {/* Left color block */}
                      <div style={{
                        width:54, minWidth:54, alignSelf:"stretch",
                        background:cfg.leftBg,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0,
                      }}>
                        {cfg.leftNode}
                      </div>

                      {/* Middle text */}
                      <div style={{ flex:1, padding:"11px 13px", minWidth:0 }}>
                        <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"rgba(255,255,255,0.92)", lineHeight:1.3 }}>
                          {cfg.label}
                        </p>
                      </div>

                      {/* Download button */}
                      <div style={{ padding:"0 10px 0 0", flexShrink:0 }}>
                        <button
                          onClick={() => handleDownload(cfg.format)}
                          disabled={busy || isDemo}
                          style={{
                            padding:"9px 18px", borderRadius:10, border:"none",
                            background: isActive ? cfg.btnBg : cfg.btnBg,
                            color:"#fff", fontSize:13, fontWeight:700,
                            cursor: busy || isDemo ? "default" : "pointer",
                            display:"flex", alignItems:"center", gap:6,
                            opacity: busy && !isActive ? 0.45 : 1,
                            transition:"all 0.18s",
                            whiteSpace:"nowrap",
                            boxShadow: busy || isDemo ? "none" : `0 3px 12px ${cfg.glowColor}`,
                          }}
                        >
                          {isActive
                            ? <><Loader2 size={13} className="animate-spin"/> Saving…</>
                            : <><Download size={13}/> Download</>}
                        </button>
                      </div>
                    </div>
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
