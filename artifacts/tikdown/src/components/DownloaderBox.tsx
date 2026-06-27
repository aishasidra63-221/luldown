import { useState, useCallback } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Video, Music, Film, Copy, Download, Image,
  AlertCircle, Loader2, X, FlaskConical,
} from "lucide-react";

interface FormatOption {
  format: DownloadFormat;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { format: "mp4_1080", label: "HD 1080p — No Watermark",  sublabel: "Best Quality · Full HD",  Icon: Video, color: "#00e5e5" },
  { format: "mp4_720",  label: "720p — No Watermark",       sublabel: "Standard HD · Smaller",   Icon: Film,  color: "#a855f7" },
  { format: "mp3",      label: "MP3 Download — 192kbps",    sublabel: "Audio Only · High Quality",Icon: Music, color: "#e91e8c" },
  { format: "thumbnail",label: "Thumbnail Download",        sublabel: "Cover Image · JPG",        Icon: Image, color: "#f59e0b" },
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
      <div className="downloader-input-wrap flex items-center rounded-2xl">
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="Paste TikTok link here..."
          className="min-w-0 flex-1 bg-transparent pl-5 pr-2 py-5 text-base outline-none"
        />
        {url ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 mr-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0"
            style={{ background: "rgba(233,30,140,0.12)", color: "#e91e8c", border: "1px solid rgba(233,30,140,0.28)" }}
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        ) : (
          <button
            onClick={handlePaste}
            className="flex items-center gap-2 mr-3 px-4 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap shrink-0 active:scale-95"
            style={{ background: "rgba(0,229,229,0.22)", color: "#00e5e5", border: "2px solid rgba(0,229,229,0.55)", boxShadow: "0 0 12px rgba(0,229,229,0.18)" }}
          >
            <Copy className="w-4 h-4" />
            <span>Paste</span>
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
      {step === "info-ready" && info && (() => {
        const tags = (info.title || "").match(/#\w+/g) ?? [];
        const cleanTitle = (info.title || "").replace(/#\w+/g, "").trim();
        return (
          <div className="result-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* ── Demo badge ── */}
            {isDemo && (
              <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest"
                style={{ background: "rgba(0,229,229,0.08)", color: "#00e5e5", borderBottom: "1px solid rgba(0,229,229,0.12)" }}>
                <FlaskConical className="w-3 h-3" />
                DEMO — Yeh sirf preview hai
              </div>
            )}

            {/* ── Thumbnail image ── */}
            {info.thumbnail && (
              <div className="relative w-full overflow-hidden" style={{ maxHeight: "160px" }}>
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="w-full object-cover"
                  style={{ maxHeight: "160px" }}
                />
              </div>
            )}

            {/* ── Creator info ── */}
            <div className="px-4 pt-3 pb-3 space-y-2.5">
              {/* Avatar + username + title */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-black text-base text-white"
                  style={{ background: "linear-gradient(135deg, #00c8c8, #e91e8c)" }}>
                  {info.author ? info.author.replace("@","").charAt(0).toUpperCase() : "T"}
                </div>
                <div className="flex-1 min-w-0">
                  {info.author && (
                    <p className="font-black text-sm" style={{ color: "#00e5e5" }}>{info.author}</p>
                  )}
                  {cleanTitle && (
                    <p className="text-xs leading-snug line-clamp-3 mt-1" style={{ color: "rgba(200,215,235,0.75)" }}>
                      {cleanTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 6).map((tag) => (
                    <span key={tag} className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Photo post ── */}
            {isPhoto ? (
              <div className="p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: "rgba(200,215,235,0.35)" }}>
                  📸 Photo Post — {info.images!.length} image{info.images!.length > 1 ? "s" : ""}
                </p>
                {info.images!.length > 1 && (
                  <button
                    onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
                    disabled={photoDownloading !== null || isDemo}
                    className="gradient-btn w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm disabled:opacity-50"
                  >
                    <Download className="w-5 h-5" /> Save All {info.images!.length} Photos
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
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold disabled:opacity-50"
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
              /* ── Big download buttons ── */
              <div className="p-3 space-y-2">
                {formats.map(({ format, label, Icon, color }) => {
                  const isActive = activeDownload === format;
                  return (
                    <button
                      key={format}
                      onClick={() => handleDownload(format)}
                      disabled={!!activeDownload || isDemo}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.99] disabled:opacity-40"
                      style={{
                        background: `linear-gradient(90deg, ${color}22 0%, ${color}0a 100%)`,
                        border: `2px solid ${color}55`,
                        color,
                      }}
                    >
                      {/* Left: icon + label */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}25`, border: `1.5px solid ${color}45` }}>
                          {isActive
                            ? <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                            : <Icon className="w-5 h-5" style={{ color }} />}
                        </div>
                        <span style={{ color }}>
                          {isActive ? "Downloading…" : label}
                        </span>
                      </div>
                      {/* Right: download icon */}
                      <Download className="w-5 h-5 flex-shrink-0" style={{ color }} />
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
