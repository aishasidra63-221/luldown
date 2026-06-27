import { useState, useCallback } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Video, Music, Film, Copy, Download, Image,
  AlertCircle, Clock, User, Eye, Heart, Loader2, X, FlaskConical,
} from "lucide-react";

interface FormatOption {
  format: DownloadFormat;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { format: "mp4_1080", label: "MP4 — 1080p HD",  sublabel: "Best quality · No Watermark",   Icon: Video, color: "#00e5e5" },
  { format: "mp4_720",  label: "MP4 — 720p",       sublabel: "Standard HD · No Watermark",    Icon: Film,  color: "#a855f7" },
  { format: "mp3",      label: "MP3 Audio",         sublabel: "192 kbps · Audio only",         Icon: Music, color: "#e91e8c" },
  { format: "thumbnail",label: "Thumbnail",         sublabel: "Cover image · JPG",             Icon: Image, color: "#f59e0b" },
];

const DEMO_DATA: VideoInfo = {
  success: true,
  title: "This is how your result card will look 🎉 Title shows here like this",
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

function fmtNum(n?: number) {
  if (!n) return null;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Step = "idle" | "loading-info" | "info-ready" | "downloading" | "error";

interface Props {
  highlightFormat?: DownloadFormat;
}

export default function DownloaderBox({ highlightFormat }: Props) {
  const [url, setUrl]                           = useState("");
  const [step, setStep]                         = useState<Step>("idle");
  const [info, setInfo]                         = useState<VideoInfo | null>(null);
  const [error, setError]                       = useState("");
  const [activeDownload, setActiveDownload]     = useState<DownloadFormat | null>(null);
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const [isDemo, setIsDemo]                     = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(async (action: string): Promise<string | undefined> => {
    if (!executeRecaptcha) return undefined;
    try { return await executeRecaptcha(action); } catch { return undefined; }
  }, [executeRecaptcha]);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setIsDemo(false);
    setStep("loading-info");
    setError("");
    setInfo(null);
    try {
      const token = await getToken("fetch_info");
      const data  = await fetchVideoInfo(trimmed, token);
      setInfo(data);
      setStep("info-ready");
    } catch (e: any) {
      setError(e.message || "Failed to fetch video info");
      setStep("error");
    }
  };

  const handleDemo = () => {
    setIsDemo(true);
    setUrl("https://www.tiktok.com/@demo/video/1234567890");
    setInfo(DEMO_DATA);
    setStep("info-ready");
    setError("");
  };

  const handleDownload = async (format: DownloadFormat) => {
    if (isDemo) return;
    setActiveDownload(format);
    try {
      const token = await getToken("download");
      await downloadVideo(url.trim(), format, {
        title:         info?.title,
        author:        info?.author,
        thumbnail:     info?.thumbnail,
        download_urls: info?.download_urls,
      }, token);
    } catch (e: any) {
      setError(e.message || "Download failed");
      setStep("error");
    } finally {
      setActiveDownload(null);
    }
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
    <div className="space-y-3">

      {/* ── Input box ── */}
      <div className="downloader-input-wrap flex items-center rounded-2xl overflow-hidden">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="Paste TikTok link here..."
          className="flex-1 bg-transparent pl-5 pr-2 py-5 text-base outline-none"
        />
        {url ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 mx-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(233,30,140,0.12)", color: "#e91e8c", border: "1px solid rgba(233,30,140,0.28)" }}
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        ) : (
          <button
            onClick={handlePaste}
            className="flex items-center gap-1.5 mx-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: "rgba(0,229,229,0.12)", color: "#00e5e5", border: "1px solid rgba(0,229,229,0.28)" }}
          >
            <Copy className="w-4 h-4" />
            Paste
          </button>
        )}
      </div>

      {/* ── Download Now — full width ── */}
      <button
        onClick={handleFetch}
        disabled={!url.trim() || step === "loading-info"}
        className="gradient-btn w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2.5"
      >
        {step === "loading-info"
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Fetching…</>
          : <><Download className="w-5 h-5" /> Download Now</>}
      </button>

      {/* ── Demo button ── */}
      {step === "idle" && (
        <button
          onClick={handleDemo}
          className="demo-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Preview Demo — dekho result card kaisa dikhega
        </button>
      )}

      {/* ── Error ── */}
      {step === "error" && (
        <div className="error-box flex items-start gap-2.5 p-4 rounded-2xl text-sm border">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Result card ── */}
      {step === "info-ready" && info && (
        <div className="result-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">

          {/* Demo badge */}
          {isDemo && (
            <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest"
              style={{ background: "rgba(0,229,229,0.08)", color: "#00e5e5", borderBottom: "1px solid rgba(0,229,229,0.15)" }}>
              <FlaskConical className="w-3 h-3" />
              DEMO MODE — Yeh sirf preview hai, download nahi hoga
            </div>
          )}

          {/* Thumbnail */}
          {info.thumbnail ? (
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img src={info.thumbnail} alt={info.title} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(8,10,18,0.95) 0%, rgba(8,10,18,0.35) 55%, transparent 100%)" }} />
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "linear-gradient(90deg, #00e5e5, #e91e8c)" }} />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-sm line-clamp-2 mb-2">{info.title}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(0,229,229,0.15)", color: "#00e5e5", border: "1px solid rgba(0,229,229,0.25)" }}>
                    <User className="w-3 h-3" /> {info.author}
                  </span>
                  {info.duration > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(200,215,235,0.6)" }}>
                      <Clock className="w-3 h-3" /> {fmtDuration(info.duration)}
                    </span>
                  )}
                  {!!info.view_count && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(200,215,235,0.6)" }}>
                      <Eye className="w-3 h-3" /> {fmtNum(info.view_count)}
                    </span>
                  )}
                  {!!info.like_count && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#e91e8c" }}>
                      <Heart className="w-3 h-3 fill-current" /> {fmtNum(info.like_count)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-bold text-white">{info.title || "TikTok Video"}</p>
              <p className="text-sm mt-1" style={{ color: "rgba(200,215,235,0.5)" }}>{info.author}</p>
            </div>
          )}

          {/* Photo post */}
          {isPhoto ? (
            <div className="p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(200,215,235,0.35)" }}>
                📸 Photo Post — {info.images!.length} image{info.images!.length > 1 ? "s" : ""}
              </p>
              {info.images!.length > 1 && (
                <button
                  onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
                  disabled={photoDownloading !== null || isDemo}
                  className="gradient-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Save All {info.images!.length} Photos
                </button>
              )}
              <div className={`grid gap-3 ${info.images!.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {info.images!.map((imgUrl, i) => (
                  <div key={i} className="rounded-xl overflow-hidden flex flex-col"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,13,22,0.6)" }}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs rounded-md px-1.5 py-0.5 font-bold">
                        {i + 1}/{info.images!.length}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePhotoDownload(imgUrl, i)}
                      disabled={photoDownloading !== null || isDemo}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
                      style={{ color: "#00e5e5", borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {photoDownloading === i
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                        : <><Download className="w-3 h-3" /> Save Photo</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Format buttons */
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3 step-label">Choose Format</p>
              {formats.map(({ format, label, sublabel, Icon, color }) => {
                const isActive      = activeDownload === format;
                const isHighlighted = highlightFormat === format;
                return (
                  <button
                    key={format}
                    onClick={() => handleDownload(format)}
                    disabled={!!activeDownload || isDemo}
                    className={`format-btn w-full flex items-center gap-3.5 p-3.5 rounded-xl ${isHighlighted ? "format-btn-active" : ""}`}
                    style={isHighlighted ? { borderColor: `${color}50`, background: `${color}08` } : {}}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}14`, border: `1.5px solid ${color}28` }}>
                      {isActive
                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
                        : <Icon className="w-4 h-4" style={{ color }} />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm">{isActive ? "Downloading…" : label}</div>
                      <div className="text-xs opacity-50">{sublabel}</div>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0 opacity-20" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
