import { useState } from "react";
import { fetchVideoInfo, downloadVideo, VideoInfo, DownloadFormat } from "@/lib/api";
import {
  Video, Music, Image, Film, Copy, Search, Download, CheckCircle2,
  AlertCircle, Play, Clock, User, Eye, Heart, Loader2, X, ChevronRight,
  Shield, Zap, Lock, Smartphone
} from "lucide-react";

type Step = "idle" | "loading-info" | "info-ready" | "downloading" | "error";

interface FormatOption {
  format: DownloadFormat;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { format: "mp4_nowm", label: "MP4 — No Watermark", sublabel: "HD quality, clean", Icon: Video, color: "text-blue-500" },
  { format: "mp4",      label: "MP4 — Original",     sublabel: "With watermark",    Icon: Film,  color: "text-purple-500" },
  { format: "mp3",      label: "MP3 Audio",           sublabel: "192kbps audio",    Icon: Music, color: "text-green-500" },
  { format: "photo",    label: "Photo / Slideshow",   sublabel: "Download images",  Icon: Image, color: "text-orange-500" },
];

const FEATURES = [
  { Icon: CheckCircle2, label: "No Watermark",    desc: "Clean videos",    color: "text-green-500"  },
  { Icon: Zap,          label: "Lightning Fast",  desc: "Instant download", color: "text-yellow-500" },
  { Icon: Lock,         label: "100% Private",    desc: "No data stored",  color: "text-blue-500"   },
  { Icon: Smartphone,   label: "Mobile Ready",    desc: "Works everywhere", color: "text-purple-500" },
];

const STEPS = [
  { Icon: Copy,     title: "Copy Link",   desc: "Open TikTok, tap Share → Copy Link" },
  { Icon: Search,   title: "Paste & Fetch", desc: "Paste the link and click Fetch"     },
  { Icon: Download, title: "Download",    desc: "Pick MP4, MP3 or Photo format"       },
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

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState("");
  const [activeDownload, setActiveDownload] = useState<DownloadFormat | null>(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStep("loading-info");
    setError("");
    setInfo(null);
    try {
      const data = await fetchVideoInfo(trimmed);
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
      await downloadVideo(url.trim(), format, {
        title: info?.title,
        author: info?.author,
        thumbnail: info?.thumbnail,
      });
    } catch (e: any) {
      setError(e.message || "Download failed");
      setStep("error");
    } finally {
      setActiveDownload(null);
    }
  };

  const handlePaste = async () => {
    try { setUrl(await navigator.clipboard.readText()); } catch {}
  };

  const reset = () => { setUrl(""); setStep("idle"); setInfo(null); setError(""); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      {/* ── Hero ── */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          Fast · Free · No Login Required
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          LUL Downloader<br />
          <span className="text-primary">TikTok Videos Free</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          The easiest way to save TikTok videos, music, and photos — free forever, no account needed.
        </p>
      </header>

      {/* ── Input Card ── */}
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

        {/* Error */}
        {(step === "error") && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── Video Info + Download ── */}
      {step === "info-ready" && info && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Thumbnail header */}
          <div className="relative">
            {info.thumbnail ? (
              <div className="relative h-40 sm:h-52 overflow-hidden bg-secondary">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-semibold text-sm line-clamp-2 mb-1">{info.title}</p>
                  <div className="flex items-center gap-3 text-white/70 text-xs">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> @{info.author}</span>
                    {info.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDuration(info.duration)}</span>}
                    {info.view_count && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtNum(info.view_count)}</span>}
                    {info.like_count && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {fmtNum(info.like_count)}</span>}
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

          {/* Format buttons */}
          <div className="p-5 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose Format</p>
            {FORMAT_OPTIONS.map(({ format, label, sublabel, Icon, color }) => {
              const isActive = activeDownload === format;
              return (
                <button
                  key={format}
                  onClick={() => handleDownload(format)}
                  disabled={!!activeDownload}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-secondary group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors`}>
                    {isActive
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Icon className={`w-4 h-4 ${color} group-hover:text-white`} />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">{isActive ? "Downloading…" : label}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{sublabel}</div>
                  </div>
                  <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Steps ── */}
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map(({ Icon, title, desc }, i) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-4 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {i + 1}
            </div>
            <div className="mt-2 flex justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="font-semibold text-sm text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>

      {/* ── Feature badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FEATURES.map(({ Icon, label, desc, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEO Content ── */}
      <article className="space-y-6 text-sm text-muted-foreground border-t border-border pt-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">LUL Downloader — Best TikTok Downloader Without Watermark</h2>
          <p className="leading-relaxed">
            LUL Downloader is the fastest and most reliable TikTok video downloader in 2025. Paste any TikTok URL
            and instantly download in HD MP4 without watermark, extract MP3 audio, or save photos from TikTok
            slideshows — completely free, no account or app installation needed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download MP4 Without Watermark
            </h3>
            <p>Save TikTok videos in full HD quality with no watermark or logo overlay. Perfect for repurposing content or saving memories.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Extract MP3 Audio
            </h3>
            <p>Download TikTok sounds and music as high-quality 192kbps MP3 files — great for ringtones, podcasts, and music discovery.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download TikTok Photos
            </h3>
            <p>Save images from TikTok photo slideshows and carousel posts in full resolution with a single click.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Works on All Devices
            </h3>
            <p>Fully responsive — use TikDown on iPhone, Android, tablet, or desktop. No app download required.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
