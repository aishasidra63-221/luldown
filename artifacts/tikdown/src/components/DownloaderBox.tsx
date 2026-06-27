import { useState, useCallback } from "react";
import { fetchVideoInfo, downloadVideo, downloadPhoto, VideoInfo, DownloadFormat } from "@/lib/api";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Video, Music, Film, Copy, Download,
  AlertCircle, Clock, User, Eye, Heart, Loader2, X,
  CheckCircle2, LinkIcon,
} from "lucide-react";

// ── TikTok URL validation ─────────────────────────────────────────────────────
const TIKTOK_PATTERN = /^https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\//i;

function isTikTokUrl(s: string): boolean {
  return TIKTOK_PATTERN.test(s.trim());
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface FormatOption {
  format: DownloadFormat;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format:    "mp4_1080",
    label:     "MP4 — 1080p HD",
    sublabel:  "Full HD · No Watermark",
    Icon:      Video,
    iconBg:    "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-500",
  },
  {
    format:    "mp4_720",
    label:     "MP4 — 720p",
    sublabel:  "Standard HD · No Watermark",
    Icon:      Film,
    iconBg:    "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-500",
  },
  {
    format:    "mp3",
    label:     "MP3 Audio",
    sublabel:  "192kbps · Audio only",
    Icon:      Music,
    iconBg:    "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-500",
  },
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

interface Props { highlightFormat?: DownloadFormat; }

// ── TikTok Icon SVG ───────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z"/>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DownloaderBox({ highlightFormat }: Props) {
  const [url, setUrl]                           = useState("");
  const [step, setStep]                         = useState<Step>("idle");
  const [info, setInfo]                         = useState<VideoInfo | null>(null);
  const [error, setError]                       = useState("");
  const [activeDownload, setActiveDownload]     = useState<DownloadFormat | null>(null);
  const [photoDownloading, setPhotoDownloading] = useState<number | null>(null);
  const [urlError, setUrlError]                 = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(async (action: string): Promise<string | undefined> => {
    if (!executeRecaptcha) return undefined;
    try { return await executeRecaptcha(action); } catch { return undefined; }
  }, [executeRecaptcha]);

  const handleChange = (val: string) => {
    setUrl(val);
    setUrlError("");
    if (step === "error") { setStep("idle"); setError(""); }
  };

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // TikTok-only validation
    if (!isTikTokUrl(trimmed)) {
      setUrlError("Please paste a TikTok link (tiktok.com, vm.tiktok.com)");
      return;
    }

    setStep("loading-info");
    setError("");
    setUrlError("");
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
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setUrlError("");
    } catch {}
  };

  const reset = () => {
    setUrl(""); setStep("idle"); setInfo(null);
    setError(""); setUrlError("");
  };

  const isPhoto   = info?.is_photo && (info.images?.length ?? 0) > 0;
  const isValid   = isTikTokUrl(url);
  const hasUrl    = url.trim().length > 0;
  const formats   = highlightFormat
    ? [...FORMAT_OPTIONS].sort((a) => (a.format === highlightFormat ? -1 : 1))
    : FORMAT_OPTIONS;

  // input border state
  const inputBorder = urlError
    ? "border-red-400 ring-2 ring-red-400/20"
    : hasUrl && isValid
    ? "border-emerald-400 ring-2 ring-emerald-400/20"
    : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";

  return (
    <div className="space-y-4">

      {/* ── Input Box ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

        {/* Header strip */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-secondary/30">
          <TikTokIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Paste a TikTok link to download
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium">Ready</span>
          </div>
        </div>

        {/* Input row */}
        <div className="p-4">
          <div className={`flex items-center gap-2 rounded-xl border ${inputBorder} bg-background transition-all duration-200 px-4`}>
            {/* Link icon */}
            <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />

            {/* Input */}
            <input
              type="url"
              value={url}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="https://www.tiktok.com/@user/video/..."
              className="flex-1 py-3.5 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm min-w-0"
            />

            {/* Valid check / clear */}
            {hasUrl && (
              isValid
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <button onClick={reset} className="p-0.5 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
            )}

            {/* Paste button (when empty) */}
            {!hasUrl && (
              <button
                onClick={handlePaste}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0 bg-primary/8 hover:bg-primary/15 px-2.5 py-1 rounded-lg"
              >
                <Copy className="w-3 h-3" />
                Paste
              </button>
            )}
          </div>

          {/* URL validation error */}
          {urlError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium px-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {urlError}
            </p>
          )}

          {/* Download button */}
          <button
            onClick={handleFetch}
            disabled={!hasUrl || step === "loading-info"}
            className="gradient-btn mt-3 w-full py-3.5 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
          >
            {step === "loading-info"
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching info…</>
              : <><Download className="w-4 h-4" /> Download Video</>}
          </button>

          {/* Supported hint */}
          <p className="text-center text-[11px] text-muted-foreground mt-2.5">
            Supports TikTok videos, MP3 audio &amp; photo slideshows
          </p>
        </div>

        {/* API error */}
        {step === "error" && error && (
          <div className="mx-4 mb-4 flex items-start gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-xl text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ── Result Card ───────────────────────────────────────────────────── */}
      {step === "info-ready" && info && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">

          {/* Thumbnail */}
          <div className="relative">
            {info.thumbnail ? (
              <div className="relative h-44 sm:h-56 overflow-hidden bg-secondary">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                {/* Reset button */}
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Video meta */}
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm line-clamp-2 mb-1.5 drop-shadow">
                    {info.title}
                  </p>
                  <div className="flex items-center gap-3 text-white/75 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> @{info.author}
                    </span>
                    {info.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtDuration(info.duration)}
                      </span>
                    )}
                    {!!info.view_count && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {fmtNum(info.view_count)}
                      </span>
                    )}
                    {!!info.like_count && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {fmtNum(info.like_count)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border-b border-border flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{info.title || "TikTok Video"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">@{info.author}</p>
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Photo grid */}
          {isPhoto ? (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  📸 Photo Post — {info.images!.length} image{info.images!.length > 1 ? "s" : ""}
                </p>
              </div>
              {info.images!.length > 1 && (
                <button
                  onClick={() => info.images!.forEach((u, i) => setTimeout(() => handlePhotoDownload(u, i), i * 400))}
                  disabled={photoDownloading !== null}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-btn text-white text-sm font-semibold disabled:opacity-50"
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
                      className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
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
            <div className="p-5 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Choose Format
              </p>
              {formats.map(({ format, label, sublabel, Icon, iconBg, iconColor }) => {
                const isActive      = activeDownload === format;
                const isHighlighted = highlightFormat === format;
                return (
                  <button
                    key={format}
                    onClick={() => handleDownload(format)}
                    disabled={!!activeDownload}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group ${
                      isHighlighted
                        ? "gradient-btn border-transparent text-white"
                        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isHighlighted ? "bg-white/20" : `${iconBg} group-hover:bg-primary/10`
                    }`}>
                      {isActive
                        ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        : <Icon className={`w-5 h-5 ${isHighlighted ? "text-white" : `${iconColor} group-hover:text-primary`}`} />}
                    </div>

                    {/* Labels */}
                    <div className="text-left flex-1">
                      <div className={`font-semibold text-sm ${isHighlighted ? "text-white" : "text-foreground"}`}>
                        {isActive ? "Downloading…" : label}
                      </div>
                      <div className={`text-xs mt-0.5 ${isHighlighted ? "text-white/70" : "text-muted-foreground"}`}>
                        {sublabel}
                      </div>
                    </div>

                    {/* Arrow */}
                    <Download className={`w-4 h-4 flex-shrink-0 transition-all ${
                      isHighlighted ? "text-white opacity-80" : "opacity-0 group-hover:opacity-60 text-primary"
                    }`} />
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
