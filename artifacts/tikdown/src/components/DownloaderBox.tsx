import { useState, useCallback, useRef } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Music, Clipboard, Download, Image, Video,
  AlertCircle, Loader2, X,
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
  const { executeRecaptcha } = useGoogleReCaptcha();
  const getToken = useCallback(async (action: string) => {
    if (!executeRecaptcha) return undefined;
    try { return await executeRecaptcha(action); } catch { return undefined; }
  }, [executeRecaptcha]);

  // Core fetch logic — accepts explicit URL so auto-fetch on mount can pass it directly
  const handleFetchUrl = async (fetchUrl: string) => {
    const trimmed = fetchUrl.trim();
    if (!trimmed) return;
    setStep("loading-info"); setError(""); setInfo(null);
    try {
      const token = await getToken("fetch_info");
      setInfo(await fetchVideoInfo(trimmed, token));
      setStep("info-ready");
    } catch (e: any) {
      setError(e.message || "Failed to fetch video info");
      setStep("error");
    }
  };

  const handleFetch = () => handleFetchUrl(url);

  const handleDownload = async (format: DownloadFormat) => {
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
    setPhotoDownloading(index);
    try { await downloadPhoto(imgUrl, index); }
    finally { setPhotoDownloading(null); }
  };

  const handlePaste = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { setUrl(t); return; } } catch {}
    inputRef.current?.focus();
  };

  const reset = () => { setUrl(""); setStep("idle"); setInfo(null); setError(""); };

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
          {step === "loading-info" ? null : url ? (
            <button onClick={reset} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <X size={14} /> Clear
            </button>
          ) : (
            <button onClick={handlePaste} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <Clipboard size={14} /> Paste
            </button>
          )}
        </div>
        <button onClick={handleFetch} disabled={!url.trim() || step === "loading-info"} className="btn-primary dl-btn" style={step === "loading-info" ? { opacity:0.85, cursor:"wait", minWidth:160 } : { minWidth:160 }}>
          {step === "loading-info"
            ? <><span style={{
                display:"inline-block", width:26, height:26, flexShrink:0,
                border:"3px solid rgba(255,255,255,0.25)",
                borderTopColor:"#ffffff",
                borderRadius:"50%",
                animation:"spin 0.75s linear infinite",
              }} /> Please wait…</>
            : <><Download size={18} /> Download Now</>}
        </button>
      </div>

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

            {/* ── Thumbnail ── */}
            {info.thumbnail && (
              <div style={{ position:"relative" }}>
                <img
                  src={info.thumbnail} alt=""
                  style={{ width:"100%", height:140, objectFit:"cover", display:"block" }}
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
              {/* Avatar | Username + Title + Tags */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{
                  width:54, height:54, borderRadius:"50%", flexShrink:0,
                  background:"linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:22, color:"#fff",
                  boxShadow:"0 0 0 2.5px rgba(124,58,237,0.4), 0 4px 14px rgba(124,58,237,0.4)",
                  overflow:"hidden",
                }}>
                  {info.author_avatar ? (
                    <img
                      src={info.author_avatar}
                      alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : avatarLetter}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 6px", fontWeight:700, fontSize:15, color:"#ffffff" }}>
                    {info.author}
                  </p>
                  {cleanTitle && (
                    <p style={{
                      margin:0, fontSize:13, fontWeight:600,
                      color:"rgba(255,255,255,0.8)", lineHeight:1.6,
                      wordBreak:"break-word",
                    }}>
                      {cleanTitle}
                      {tags.length > 0 && (
                        <>
                          {" "}
                          {tags.slice(0, 6).map(tag => (
                            <span key={tag} style={{ color:"#ffffff", fontWeight:600 }}>
                              {tag}{" "}
                            </span>
                          ))}
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"0 16px" }} />

            {/* ── Download options ── */}
            {isPhoto ? (
              <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>

                {/* Label */}
                <p style={{ textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:"0.07em", color:"rgba(255,255,255,0.35)", margin:0 }}>
                  📸 PHOTO SLIDESHOW &nbsp;·&nbsp; {info.images!.length} SLIDES
                </p>

                {/* ── Horizontal slide strip ── */}
                <div style={{
                  display:"flex", gap:8, overflowX:"auto", paddingBottom:4,
                  scrollbarWidth:"none",
                }}>
                  {info.images!.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => handlePhotoDownload(imgUrl, i)}
                      title={`Save slide ${i+1}`}
                      style={{
                        position:"relative", flexShrink:0,
                        width:80, height:108, borderRadius:10, overflow:"hidden",
                        border:"1px solid rgba(255,255,255,0.12)",
                        cursor: photoDownloading !== null ? "wait" : "pointer",
                        boxShadow:"0 2px 10px rgba(0,0,0,0.4)",
                      }}
                    >
                      <img
                        src={imgUrl} alt=""
                        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                        loading="lazy"
                      />
                      {/* slide number badge */}
                      <div style={{
                        position:"absolute", top:5, left:5,
                        background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)",
                        color:"#fff", fontSize:9, fontWeight:800,
                        padding:"2px 5px", borderRadius:5, lineHeight:1.4,
                      }}>
                        {i+1}
                      </div>
                      {/* download icon overlay */}
                      <div style={{
                        position:"absolute", inset:0,
                        background:"rgba(124,58,237,0.0)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"background 0.15s",
                      }}>
                        {photoDownloading === i
                          ? <Loader2 size={18} color="#fff" className="animate-spin" />
                          : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Download All Slides ── */}
                <button
                  onClick={() => info.images!.forEach((u,i) => setTimeout(() => handlePhotoDownload(u,i), i * 400))}
                  disabled={photoDownloading !== null}
                  style={{
                    display:"flex", alignItems:"center", gap:0,
                    borderRadius:13, overflow:"hidden",
                    background:"linear-gradient(135deg,#7c3aed,#6d28d9)",
                    border:"none", width:"100%", textAlign:"left",
                    opacity: photoDownloading !== null ? 0.5 : 1,
                    cursor: photoDownloading !== null ? "not-allowed" : "pointer",
                    boxShadow:"0 4px 16px rgba(124,58,237,0.4)",
                  }}
                >
                  <div style={{ width:54, minWidth:54, alignSelf:"stretch", background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Image size={19} color="#fff" strokeWidth={2.2} />
                  </div>
                  <div style={{ flex:1, padding:"14px 14px" }}>
                    <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                      Download All {info.images!.length} Slides
                    </p>
                  </div>
                  <div style={{ paddingRight:14, flexShrink:0 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Download size={15} color="#fff" strokeWidth={2.4} />
                    </div>
                  </div>
                </button>

                {/* ── Download as Video ── */}
                {info.download_urls?.mp4_1080 || info.download_urls?.mp4_720 ? (
                  <button
                    onClick={() => handleDownload("mp4_1080")}
                    disabled={!!activeDownload}
                    style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background:"#2563eb",
                      border:"none", width:"100%", textAlign:"left",
                      opacity: activeDownload && activeDownload !== "mp4_1080" ? 0.4 : 1,
                      cursor: activeDownload ? "not-allowed" : "pointer",
                      boxShadow:"0 4px 16px rgba(37,99,235,0.35)",
                    }}
                  >
                    <div style={{ width:54, minWidth:54, alignSelf:"stretch", background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {activeDownload === "mp4_1080"
                        ? <Loader2 size={20} color="#fff" className="animate-spin" />
                        : <Video size={20} color="#fff" strokeWidth={2.2} />}
                    </div>
                    <div style={{ flex:1, padding:"14px 14px" }}>
                      <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                        {activeDownload === "mp4_1080" ? "Downloading…" : "Download as Video"}
                      </p>
                    </div>
                    <div style={{ paddingRight:14, flexShrink:0 }}>
                      {activeDownload !== "mp4_1080" && (
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Download size={15} color="#fff" strokeWidth={2.4} />
                        </div>
                      )}
                    </div>
                  </button>
                ) : null}

                {/* ── Download MP3 ── */}
                {info.download_urls?.mp3 ? (
                  <button
                    onClick={() => handleDownload("mp3")}
                    disabled={!!activeDownload}
                    style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background:"#16a34a",
                      border:"none", width:"100%", textAlign:"left",
                      opacity: activeDownload && activeDownload !== "mp3" ? 0.4 : 1,
                      cursor: activeDownload ? "not-allowed" : "pointer",
                      boxShadow:"0 4px 16px rgba(22,163,74,0.35)",
                    }}
                  >
                    <div style={{ width:54, minWidth:54, alignSelf:"stretch", background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {activeDownload === "mp3"
                        ? <Loader2 size={20} color="#fff" className="animate-spin" />
                        : <Music size={19} color="#fff" strokeWidth={2.2} />}
                    </div>
                    <div style={{ flex:1, padding:"14px 14px" }}>
                      <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                        {activeDownload === "mp3" ? "Downloading…" : "Download MP3"}
                      </p>
                    </div>
                    <div style={{ paddingRight:14, flexShrink:0 }}>
                      {activeDownload !== "mp3" && (
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Download size={15} color="#fff" strokeWidth={2.4} />
                        </div>
                      )}
                    </div>
                  </button>
                ) : null}

              </div>
            ) : (
              <div style={{ padding:"12px 12px 14px", display:"flex", flexDirection:"column", gap:7 }}>
                {fmts.map(cfg => {
                  const isActive = activeDownload === cfg.format;
                  const busy = !!activeDownload;
                  const mp3Unavailable = false;
                  return (
                    <button
                      key={cfg.format}
                      onClick={() => !mp3Unavailable && handleDownload(cfg.format)}
                      disabled={busy || mp3Unavailable}
                      title={mp3Unavailable ? "Audio not available for this video" : undefined}
                      style={{
                        display:"flex", alignItems:"center", gap:0,
                        borderRadius:13, overflow:"hidden",
                        background: cfg.btnBg,
                        border:"none", width:"100%", textAlign:"left",
                        opacity: (busy && !isActive) || mp3Unavailable ? 0.4 : 1,
                        cursor: busy || mp3Unavailable ? "not-allowed" : "pointer",
                        transition:"opacity 0.18s, filter 0.18s",
                        filter: busy ? "none" : "brightness(1)",
                        boxShadow: `0 4px 16px ${cfg.glowColor}`,
                      }}
                    >
                      {/* Left icon block — slightly darker shade */}
                      <div style={{
                        width:54, minWidth:54, alignSelf:"stretch",
                        background:"rgba(0,0,0,0.18)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0,
                      }}>
                        {isActive
                          ? <Loader2 size={20} color="#fff" className="animate-spin" />
                          : cfg.leftNode}
                      </div>

                      {/* Label */}
                      <div style={{ flex:1, padding:"14px 14px" }}>
                        <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                          {isActive ? "Downloading…" : cfg.label}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <div style={{ paddingRight:14, flexShrink:0 }}>
                        {!isActive && (
                          <div style={{
                            width:32, height:32, borderRadius:"50%",
                            background:"rgba(0,0,0,0.22)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                          }}>
                            <Download size={15} color="#fff" strokeWidth={2.4} />
                          </div>
                        )}
                      </div>
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
