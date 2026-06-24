import { useState, useCallback } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Video, Music, Film, Copy, Search, Download,
  AlertCircle, Clock, User, Eye, Heart, Loader2, X,
} from "lucide-react";

interface FormatOption {
  format: DownloadFormat;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { format: "mp4_1080", label: "MP4 — 1080p",  sublabel: "HD · No Watermark",       Icon: Video, color: "text-blue-500"  },
  { format: "mp4_720",  label: "MP4 — 720p",   sublabel: "Standard · No Watermark",  Icon: Film,  color: "text-purple-500" },
  { format: "mp3",      label: "MP3 Audio",    sublabel: "192kbps · Audio only",      Icon: Music, color: "text-green-500" },
];

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
  const [url, setUrl]                         = useState("");
  const [step, setStep]                       = useState<Step>("idle");
  const [info, setInfo]                       = useState<VideoInfo | null>(null);
  const [error, setError]                     = useState("");
  const [activeDownload, setActiveDownload]   = useState<DownloadFormat | null>(null);
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(async (action: string): Promise<string | undefined> => {
    if (!executeRecaptcha) return undefined;
    try { return await executeRecaptcha(action); } catch { return undefined; }
  }, [executeRecaptcha]);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
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

  const handleDownload = async (format: DownloadFormat) => {
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
    setPhotoDownloading(index);
    try { await downloadPhoto(imgUrl, index); }
    finally { setPhotoDownloading(null); }
  };

  const handlePaste = async () => {
    try { setUrl(await navigator.clipboard.readText()); } catch {}
  };

  const reset = () => { setUrl(""); setStep("idle"); setInfo(null); setError(""); };

  const isPhoto = info?.is_photo && (info.images?.length ?? 0) > 0;

  const formats = highlightFormat
    ? [...FORMAT_OPTIONS].sort((a) => (a.format === highlightFormat ? -1 : 1))
    : FORMAT_OPTIONS;

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="https://www.tiktok.com/@user/video/..."
              className="w-full pl-4 pr-16 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {url ? (
              <button onClick={reset} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handlePaste} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Copy className="w-3 h-3" /> Paste
              </button>
            )}
          </div>
          <button
            onClick={handleFetch}
            disabled={!url.trim() || step === "loading-info"}
            className="px-5 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap"
          >
            {step === "loading-info"
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching</>
              : <><Search className="w-4 h-4" /> Fetch</>}
          </button>
        </div>

        {step === "error" && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {step === "info-ready" && info && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">

          {/* Thumbnail */}
          <div className="relative">
            {info.thumbnail ? (
              <div className="relative h-40 sm:h-52 overflow-hidden bg-secondary">
                <img src={info.thumbnail} alt={info.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm line-clamp-2 mb-1">{info.title}</p>
                  <div className="flex items-center gap-3 text-white/70 text-xs flex-wrap">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> @{info.author}</span>
                    {info.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(info.duration)}</span>}
                    {!!info.view_count && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtNum(info.view_count)}</span>}
                    {!!info.like_count && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {fmtNum(info.like_count)}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border-b border-border">
                <p className="font-semibold text-foreground">{info.title || "TikTok Video"}</p>
                <p className="text-sm text-muted-foreground mt-1">@{info.author}</p>
              </div>
            )}
          </div>

          {/* Photo grid */}
          {isPhoto ? (
            <div className="p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                📸 Photo Post — {info.images!.length} image{info.images!.length > 1 ? "s" : ""}
              </p>
              {info.images!.length > 1 && (
                <button
                  onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
                  disabled={photoDownloading !== null}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Save All {info.images!.length} Photos
                </button>
              )}
              <div className={`grid gap-3 ${info.images!.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {info.images!.map((imgUrl, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border bg-secondary flex flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-md px-1.5 py-0.5">
                        {i + 1}/{info.images!.length}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePhotoDownload(imgUrl, i)}
                      disabled={photoDownloading !== null}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
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
            <div className="p-5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose Format</p>
              {formats.map(({ format, label, sublabel, Icon, color }) => {
                const isActive = activeDownload === format;
                const isHighlighted = highlightFormat === format;
                return (
                  <button
                    key={format}
                    onClick={() => handleDownload(format)}
                    disabled={!!activeDownload}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group ${
                      isHighlighted
                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                        : "border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isHighlighted ? "bg-white/20" : "bg-secondary group-hover:bg-white/20"
                    }`}>
                      {isActive
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Icon className={`w-4 h-4 ${isHighlighted ? "text-white" : `${color} group-hover:text-white`}`} />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{isActive ? "Downloading…" : label}</div>
                      <div className={`text-xs ${isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground group-hover:text-primary-foreground/70"}`}>{sublabel}</div>
                    </div>
                    <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
