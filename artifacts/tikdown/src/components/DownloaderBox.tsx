import { useState, useRef, useEffect } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, downloadAllAsZip, VideoInfo, DownloadFormat, isProfileUrl, fetchProfileInfo, ProfileInfo, API_BASE } from "@/lib/api";
import ProfileResults from "@/components/ProfileResults";
import VideoResultCard from "@/components/VideoResultCard";
import {
  Music, Clipboard, Download, Image, Video,
  AlertCircle, X,
} from "lucide-react";
import { Lang } from "@/i18n/langMeta";
import { DOWNLOADER_UI } from "@/i18n/downloaderUi";

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


type Step = "idle" | "loading-info" | "info-ready" | "profile-ready" | "error";
interface Props {
  highlightFormat?: DownloadFormat;
  lang?: Lang;
  /** When provided, result card/profile renders externally — DownloaderBox only shows input + error */
  onResult?: (payload: { info: VideoInfo | null; profile: ProfileInfo | null; url: string } | null) => void;
}

const DEMO_INFO: VideoInfo = {
  success: true,
  duration: 30,
  title: "Satisfying ASMR wax scraping process 🎧 #asmr #satisfying #relaxing #wax #oddlysatisfying",
  author: "@creativeasmr",
  author_avatar: "https://i.pravatar.cc/150?img=47",
  thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
  download_urls: { mp4_1080: "#", mp4_720: "#", mp3: "#", thumbnail: "#" },
  is_photo: false,
};

export default function DownloaderBox({ highlightFormat, lang = "en", onResult }: Props) {
  const ui = DOWNLOADER_UI[lang] ?? DOWNLOADER_UI["en"];
  const isDemo = false;
  const URL_PERSIST_KEY = "luldown_last_url";

  // Detect page refresh — on reload, clear persisted state so the box starts empty.
  // On close+reopen (type="navigate") or back/forward, restore as usual.
  const isReload = typeof window !== "undefined"
    && (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";

  if (isReload && typeof window !== "undefined") {
    localStorage.removeItem(URL_PERSIST_KEY);
  }

  const prefill = typeof window !== "undefined" && !isReload
    ? (sessionStorage.getItem("prefill_url") || localStorage.getItem(URL_PERSIST_KEY) || "")
    : (sessionStorage.getItem("prefill_url") || "");
  if (typeof window !== "undefined" && sessionStorage.getItem("prefill_url")) sessionStorage.removeItem("prefill_url");

  const [url, setUrl] = useState(prefill);
  const [step, setStep] = useState<Step>(isDemo ? "info-ready" : "idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState<VideoInfo | null>(isDemo ? DEMO_INFO : null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [error, setError] = useState("");
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ── Rate limiting: 3 requests within 5 seconds → block ──────────────────
  const RATE_WINDOW_MS  = 5000; // 5 second window
  const RATE_MAX        = 2;    // max requests in that window
  const RATE_WAIT_SEC   = 5;    // how long to wait
  const reqTimestamps   = useRef<number[]>([]);
  const [rateLimited, setRateLimited]     = useState(false);
  const [rateCountdown, setRateCountdown] = useState(0);
  const rateTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkRateLimit = (): boolean => {
    const now  = Date.now();
    // Keep only timestamps within the window
    reqTimestamps.current = reqTimestamps.current.filter(t => now - t < RATE_WINDOW_MS);
    if (reqTimestamps.current.length >= RATE_MAX) {
      // Block — start countdown
      setRateLimited(true);
      setRateCountdown(RATE_WAIT_SEC);
      if (rateTimer.current) clearInterval(rateTimer.current);
      rateTimer.current = setInterval(() => {
        setRateCountdown(prev => {
          if (prev <= 1) {
            clearInterval(rateTimer.current!);
            setRateLimited(false);
            reqTimestamps.current = []; // reset after wait
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return true; // is rate limited
    }
    reqTimestamps.current.push(now);
    return false; // not rate limited
  };

  // Strip technical internals (API hostnames, JSON parse errors, etc.) so users
  // see a friendly string instead of raw server details.
  const sanitizeError = (msg: string): string => {
    if (!msg) return "Something went wrong. Please try again.";
    if (/tiktokv\.com|tiktok\.com\/api|Unexpected end of JSON|SyntaxError|fetch failed|Failed to fetch|NetworkError|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
      if (/profile/i.test(msg)) return "Could not load this profile. Please check the link and try again.";
      return "Could not connect to TikTok. Please check the link and try again.";
    }
    return msg;
  };

  // Core fetch logic — accepts explicit URL so auto-fetch on mount can pass it directly
  const handleFetchUrl = async (fetchUrl: string) => {
    const trimmed = fetchUrl.trim();
    if (!trimmed) return;
    if (checkRateLimit()) return; // blocked — countdown already started
    setStep("loading-info"); setError(""); setInfo(null); setProfileInfo(null);
    onResult?.(null);
    try {
      if (isProfileUrl(trimmed)) {
        const profile = await fetchProfileInfo(trimmed);
        setProfileInfo(profile);
        setStep("profile-ready");
        onResult?.({ info: null, profile, url: trimmed });
      } else {
        const videoInfo = await fetchVideoInfo(trimmed);
        setInfo(videoInfo);
        setStep("info-ready");
        onResult?.({ info: videoInfo, profile: null, url: trimmed });
      }
    } catch (e: any) {
      setError(sanitizeError(e.message) || "Failed to fetch");
      setStep("error");
    }
  };

  const handleFetch = () => handleFetchUrl(url);

  const handleDownload = async (format: DownloadFormat) => {
    try {
      await downloadVideo(url.trim(), format, {
        title: info?.title, author: info?.author,
        thumbnail: info?.thumbnail, download_urls: info?.download_urls,
      });
    } catch (e: any) {
      setError(e.message || "Download failed"); setStep("error");
    }
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

  const reset = () => {
    setUrl(""); setStep("idle"); setInfo(null); setProfileInfo(null); setError("");
    localStorage.removeItem(URL_PERSIST_KEY);
    onResult?.(null);
  };

  // Persist URL to localStorage on every change
  useEffect(() => {
    if (url) localStorage.setItem(URL_PERSIST_KEY, url);
    else localStorage.removeItem(URL_PERSIST_KEY);
  }, [url]);


  useEffect(() => {
    if (step === "info-ready" && resultRef.current) {
      setTimeout(() => {
        resultRef.current!.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    }
  }, [step]);

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
            placeholder={ui.placeholder}
            disabled={step === "loading-info"}
            style={{ flex:1, minWidth:0, background:"transparent", padding:"15px 8px 15px 16px", fontSize:14.5, outline:"none", color:"var(--text-primary)", fontWeight:400, fontFamily:"inherit" }}
          />
          {step === "loading-info" ? null : url ? (
            <button onClick={reset} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <X size={14} /> {ui.clear}
            </button>
          ) : (
            <button onClick={handlePaste} className="btn-ghost" style={{ margin:"0 10px", padding:"7px 14px", fontSize:13 }}>
              <Clipboard size={14} /> {ui.paste}
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
              }} /> {ui.pleaseWait}</>
            : <><Download size={18} /> {ui.downloadNow}</>}
        </button>
      </div>

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="error-box" style={{ background:"rgba(217,119,6,0.13)", borderColor:"#d97706", color:"#fbbf24", gap:8 }}>
          <span style={{ fontSize:18 }}>🔔</span>
          <span>{ui.rateLimitMsg.replace("{s}", String(rateCountdown))}</span>
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="error-box">
          <AlertCircle size={16} style={{ flexShrink:0, marginTop:2 }} /> {error}
        </div>
      )}

      {/* ══════════ PROFILE RESULT (only when rendering internally) ══════════ */}
      {!onResult && step === "profile-ready" && profileInfo && (
        <ProfileResults profile={profileInfo} />
      )}

      {/* ══════════ RESULT CARD (only when rendering internally) ══════════ */}
      {!onResult && step === "info-ready" && info && (() => {
        const tags = (info.title || "").match(/#[\w\u0900-\u097F]+/g) ?? [];
        const cleanTitle = (info.title || "").replace(/#[\w\u0900-\u097F]+/g, "").trim();
        const avatarLetter = (info.author || "T").replace("@","").charAt(0).toUpperCase();

        return (
          <div ref={resultRef} style={{
            animation:"fadeUp 0.4s ease both",
            borderRadius:20,
            overflow:"hidden",
            background:"linear-gradient(160deg, #1a1040 0%, #0f0a2e 60%, #0a0620 100%)",
            border:"1px solid rgba(255,255,255,0.08)",
            boxShadow:"0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(124,58,237,0.15)",
          }}>

            {/* ── Thumbnail (hidden for photo slideshows) ── */}
            {!isPhoto && (
              <div style={{
                position:"relative", height:140, overflow:"hidden",
                background:"#0a0a0a",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <Image size={36} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                {info.thumbnail && (
                  <img
                    src={info.thumbnail}
                    alt=""
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
            )}

            {/* ── Author + Title + Tags ── */}
            <div style={{ padding:"14px 16px 16px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>

                {/* Avatar — left column */}
                <div style={{
                  width:64, height:64, borderRadius:"50%", flexShrink:0,
                  background:"linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:24, color:"#fff",
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

                {/* Right column: username on top, title+tags below */}
                <div style={{ flex:1, minWidth:0, textAlign:"left" }}>
                  <p style={{ margin:"0 0 3px", fontWeight:700, fontSize:13, color:"#ffffff", textAlign:"left" }}>
                    {info.author}
                  </p>
                  {cleanTitle && (
                    <>
                      {/* Title — clamped when collapsed, full when expanded */}
                      {!expanded ? (
                        <p style={{
                          margin:0, fontSize:13, fontWeight:500,
                          color:"rgba(255,255,255,0.75)", lineHeight:1.55,
                          wordBreak:"break-word",
                          display:"-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow:"hidden",
                        }}>
                          {cleanTitle}{" "}
                          {tags.slice(0, 6).map(tag => (
                            <span key={tag} style={{ color:"#a78bfa", fontWeight:600 }}>{tag}{" "}</span>
                          ))}
                        </p>
                      ) : (
                        <>
                          <p style={{
                            margin:"0 0 2px", fontSize:11.5, fontWeight:500,
                            color:"rgba(255,255,255,0.75)", lineHeight:1.4,
                            wordBreak:"break-word",
                          }}>
                            {cleanTitle}
                          </p>
                          {tags.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:"2px 4px", marginBottom:1 }}>
                              {tags.slice(0, 6).map(tag => (
                                <span key={tag} style={{ color:"#a78bfa", fontWeight:600, fontSize:11.5 }}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {/* More button — below text, right aligned */}
                      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:2 }}>
                        <button
                          onClick={() => setExpanded(v => !v)}
                          style={{
                            background:"rgba(255,255,255,0.07)",
                            border:"1px solid rgba(255,255,255,0.14)",
                            borderRadius:20,
                            color:"rgba(255,255,255,0.65)",
                            fontSize:11, fontWeight:600,
                            padding:"3px 10px",
                            cursor:"pointer",
                            display:"flex", alignItems:"center", gap:4,
                            whiteSpace:"nowrap",
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
            <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"0 16px" }} />

            {/* ── Download options ── */}
            {isPhoto ? (
              <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>

                {/* Label */}
                <p style={{ textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:"0.07em", color:"rgba(255,255,255,0.35)", margin:0 }}>
                  📸 PHOTO SLIDESHOW &nbsp;·&nbsp; {info.images!.length} SLIDES
                </p>

                {/* ── Horizontal slide strip with individual Save buttons ── */}
                <div style={{
                  display:"flex", gap:8, overflowX:"auto", paddingBottom:4,
                  scrollbarWidth:"none",
                }}>
                  {info.images!.map((imgUrl, i) => (
                    <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flexShrink:0 }}>
                      <div
                        style={{
                          position:"relative",
                          width:100, height:135, borderRadius:10, overflow:"hidden",
                          border:"1px solid rgba(255,255,255,0.12)",
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
                      </div>
                      {/* Individual Save button */}
                      <button
                        onClick={() => handlePhotoDownload(imgUrl, i)}
                        disabled={photoDownloading !== null}
                        style={{
                          width:100, padding:"6px 0",
                          borderRadius:8, border:"none",
                          background: photoDownloading === i
                            ? "rgba(124,58,237,0.5)"
                            : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                          color:"#fff", fontSize:11, fontWeight:700,
                          cursor: photoDownloading !== null ? "wait" : "pointer",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                        }}
                      >
                        <Download size={11} color="#fff" strokeWidth={2.5} />
                        Save
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Download All as ZIP ── */}
                <button
                  disabled={zipDownloading || photoDownloading !== null}
                  onClick={async () => {
                    setZipDownloading(true);
                    try {
                      await downloadAllAsZip(info.images!, { url: url.trim(), title: info.title, author: info.author });
                    } catch (e: any) {
                      setError(e.message || "ZIP download failed"); setStep("error");
                    } finally {
                      setZipDownloading(false);
                    }
                  }}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                    borderRadius:13, padding:"13px 0",
                    background: zipDownloading
                      ? "rgba(217,119,6,0.4)"
                      : "#d97706",
                    border:"none", width:"100%",
                    cursor: zipDownloading || photoDownloading !== null ? "wait" : "pointer",
                    boxShadow: zipDownloading ? "none" : "0 4px 16px rgba(217,119,6,0.35)",
                    transition:"all 0.2s",
                  }}
                >
                  <Download size={15} color="#fff" strokeWidth={2.4} />
                  <span style={{ fontSize:13.5, fontWeight:700, color:"#fff" }}>
                    {zipDownloading
                      ? `Preparing ZIP… (${info.images!.length} photos)`
                      : `Download All ZIP  ·  ${info.images!.length} Photos`}
                  </span>
                </button>

                {/* ── Download as Video ── */}
                {info.download_urls?.mp4_1080 || info.download_urls?.mp4_720 ? (
                  <button
                    onClick={() => handleDownload("mp4_1080")}
                    style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background:"#2563eb",
                      border:"none", width:"100%", textAlign:"left",
                      cursor:"pointer",
                      boxShadow:"0 4px 16px rgba(37,99,235,0.35)",
                    }}
                  >
                    <div style={{ width:54, minWidth:54, alignSelf:"stretch", background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Video size={20} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div style={{ flex:1, padding:"14px 14px" }}>
                      <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                        Download as Video
                      </p>
                    </div>
                    <div style={{ paddingRight:14, flexShrink:0 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Download size={15} color="#fff" strokeWidth={2.4} />
                      </div>
                    </div>
                  </button>
                ) : null}

                {/* ── Download MP3 ── */}
                {info.download_urls?.mp3 ? (
                  <button
                    onClick={() => handleDownload("mp3")}
                    style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background:"#16a34a",
                      border:"none", width:"100%", textAlign:"left",
                      cursor:"pointer",
                      boxShadow:"0 4px 16px rgba(22,163,74,0.35)",
                    }}
                  >
                    <div style={{ width:54, minWidth:54, alignSelf:"stretch", background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Music size={19} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div style={{ flex:1, padding:"14px 14px" }}>
                      <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                        Download MP3
                      </p>
                    </div>
                    <div style={{ paddingRight:14, flexShrink:0 }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.22)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Download size={15} color="#fff" strokeWidth={2.4} />
                      </div>
                    </div>
                  </button>
                ) : null}

              </div>
            ) : (
              <div style={{ padding:"12px 12px 14px", display:"flex", flexDirection:"column", gap:7 }}>
                {fmts.map(cfg => (
                  <button
                    key={cfg.format}
                    onClick={() => handleDownload(cfg.format)}
                    style={{
                      display:"flex", alignItems:"center", gap:0,
                      borderRadius:13, overflow:"hidden",
                      background: cfg.btnBg,
                      border:"none", width:"100%", textAlign:"left",
                      cursor:"pointer",
                      boxShadow: `0 4px 16px ${cfg.glowColor}`,
                    }}
                  >
                    {/* Left icon block */}
                    <div style={{
                      width:54, minWidth:54, alignSelf:"stretch",
                      background:"rgba(0,0,0,0.18)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      flexShrink:0,
                    }}>
                      {cfg.leftNode}
                    </div>

                    {/* Label */}
                    <div style={{ flex:1, padding:"14px 14px" }}>
                      <p style={{ margin:0, fontSize:13.5, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
                        {cfg.label}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div style={{ paddingRight:14, flexShrink:0 }}>
                      <div style={{
                        width:32, height:32, borderRadius:"50%",
                        background:"rgba(0,0,0,0.22)",
                        display:"flex", alignItems:"center", justifyContent:"center",
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
      })()}
    </div>
  );
}
