import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Zap, Ban, MonitorPlay, MonitorSmartphone, ChevronRight, ClipboardCopy, ClipboardPaste, Download } from "lucide-react";

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Luldown",
      "url": "https://luldown.com",
      "description": "Free TikTok video downloader without watermark.",
    },
  ],
};

const FEATURES = [
  { label: "No Watermark", Icon: Ban,              color: "#e91e8c" },
  { label: "HD Quality",   Icon: MonitorPlay,       color: "#00e5e5" },
  { label: "Fast Download",Icon: Zap,               color: "#e91e8c" },
  { label: "All Devices",  Icon: MonitorSmartphone, color: "#a855f7" },
];

const STEPS = [
  { num: "1", label: "Copy link from\nTikTok",   Icon: ClipboardCopy,  color: "#e91e8c" },
  { num: "2", label: "Paste the link\nabove",    Icon: ClipboardPaste, color: "#00e5e5" },
  { num: "3", label: "Click download\nand enjoy",Icon: Download,       color: "#a855f7" },
];

export default function HomePage() {
  useSEO({
    title: "Luldown — Download TikTok Videos Without Watermark Free",
    description: "Download TikTok videos without watermark in 1080p HD, 720p, or MP3 audio. Free, fast, no login.",
    jsonLd: HOME_JSONLD,
  });

  return (
    <div className="relative">
      <div className="hero-mesh" />

      <div className="max-w-lg mx-auto px-4 pt-8 pb-16 space-y-6">

        {/* ── Hero ── */}
        <div className="text-center pt-4 pb-2">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 hero-badge text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3 h-3 fill-current" />
            100% Free
          </div>

          {/* Title */}
          <h1 className="hero-title font-black leading-tight mb-3"
            style={{ fontSize: "clamp(1.9rem, 7vw, 2.6rem)", letterSpacing: "-0.02em", fontFamily: "'Poppins', sans-serif" }}>
            <span style={{ color: "#00e5e5" }}>TikTok</span> Video Download<br />
            <span style={{ fontSize: "90%" }}>Without Watermark</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-sm font-medium mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Download any TikTok video for free — no watermark,<br className="hidden sm:block" /> no login, no limits.
          </p>
        </div>

        {/* ── Downloader ── */}
        <DownloaderBox />

        {/* ── How it works ── */}
        <div className="rounded-2xl p-6 how-it-works-card">
          <h2 className="text-lg font-black text-center mb-6 how-it-works-title">How it works?</h2>

          <div className="flex items-start justify-between gap-1">
            {STEPS.map(({ num, label, Icon, color }, i) => (
              <div key={num} className="flex items-start gap-1 flex-1">
                <div className="flex flex-col items-center gap-2.5 flex-1">
                  {/* Icon circle */}
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: `${color}18`, border: `2px solid ${color}45` }}>
                    <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.8} />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                      style={{ background: color }}>
                      {num}
                    </div>
                  </div>
                  {/* Label */}
                  <p className="text-xs text-center leading-snug font-medium step-label" style={{ whiteSpace: "pre-line" }}>
                    {label}
                  </p>
                </div>

                {/* Arrow */}
                {i < STEPS.length - 1 && (
                  <div className="flex-shrink-0 mt-5 text-sm font-bold step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature icons row ── */}
        <div className="grid grid-cols-4 gap-2.5">
          {FEATURES.map(({ label, Icon, color }) => (
            <div key={label} className="feature-icon-card">
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-1"
                style={{ background: `${color}18`, border: `1.5px solid ${color}35` }}>
                <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center feature-label">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── SEO text ── */}
        <div className="pt-2 space-y-4 text-sm seo-text">
          <div className="neon-divider" />
          <div className="pt-3">
            <h2 className="text-base font-black mb-2 seo-heading">Best TikTok Downloader — No Watermark</h2>
            <p className="leading-relaxed">
              Luldown lets you download TikTok videos in 1080p or 720p without watermark, or save as 192kbps MP3.
              Completely free, no account needed, works on any device.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "1080p Without Watermark", body: "Full HD quality, no TikTok branding or logo." },
              { title: "720p Download",            body: "Smaller file, same clean output for mobile." },
              { title: "MP3 Audio 192kbps",         body: "Extract TikTok audio as high-quality MP3." },
              { title: "All Devices",               body: "iPhone, Android, PC — no app needed." },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold text-xs mb-1 flex items-center gap-1.5 seo-subheading">
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00e5e5" }} />
                  {title}
                </h3>
                <p className="pl-5 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
