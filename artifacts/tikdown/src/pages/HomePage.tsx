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

const SEO_ITEMS = [
  { title: "1080p Without Watermark", body: "Full HD quality, no TikTok branding or logo." },
  { title: "720p Download",            body: "Smaller file, same clean output for mobile." },
  { title: "MP3 Audio 192kbps",         body: "Extract TikTok audio as high-quality MP3." },
  { title: "All Devices",               body: "iPhone, Android, PC — no app needed." },
];

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader No Watermark",
    description: "Download TikTok videos without watermark in HD quality. Free, fast, unlimited downloads. No login required. Works on All Devices.",
    jsonLd: HOME_JSONLD,
  });

  return (
    <div className="relative">
      <div className="hero-mesh" />

      {/* ── Responsive outer shell ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-16">

        {/* ═══════════════════════════════════════
            MOBILE layout  (< lg): single column
            DESKTOP layout (≥ lg): two columns
        ═══════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-14 xl:gap-20">

          {/* ── LEFT column: hero + downloader ── */}
          <div className="flex-1 lg:max-w-2xl space-y-6">

            {/* Hero */}
            <div className="text-center lg:text-left pt-4 pb-2">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 hero-badge text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <Zap className="w-3 h-3 fill-current" />
                Free • Fast • Secure
              </div>

              {/* Title */}
              <h1
                className="hero-title font-black leading-tight mb-3"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.4rem)",
                  letterSpacing: "-0.02em",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <span style={{ background: "linear-gradient(90deg, #00e5e5, #e91e8c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>TikTok</span> Video Downloader
                <br />
                <span style={{ fontSize: "90%" }}>No Watermark</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-subtitle text-sm lg:text-base font-medium mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Download TikTok videos without watermark in HD quality. Free, fast, unlimited downloads. No login required. Works All Device.
              </p>
            </div>

            {/* Downloader */}
            <DownloaderBox />

          </div>

          {/* ── RIGHT column: only visible on desktop ── */}
          <div className="hidden lg:flex flex-col gap-6 w-80 xl:w-96 pt-4 flex-shrink-0">

            {/* Feature icon cards — 2×2 grid (upar) */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ label, Icon, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl relative overflow-hidden"
                  style={{ background: `${color}0c`, border: `1.5px solid ${color}30` }}
                >
                  {/* Glow blob */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${color}55 0%, transparent 70%)` }} />
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center relative z-10"
                    style={{ background: `${color}22`, border: `2px solid ${color}50`, width: 52, height: 52 }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs font-bold text-center feature-label relative z-10">{label}</span>
                </div>
              ))}
            </div>

            {/* How it works — vertical on desktop (neeche) */}
            <div className="rounded-2xl p-5 how-it-works-card">
              <h2 className="text-base font-black mb-5 how-it-works-title">How it works?</h2>
              <div className="flex flex-col gap-4">
                {STEPS.map(({ num, label, Icon, color }, i) => (
                  <div key={num}>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18`, border: `2px solid ${color}45` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
                        <div
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                          style={{ background: color }}
                        >
                          {num}
                        </div>
                      </div>
                      <p className="text-sm font-medium step-label" style={{ whiteSpace: "pre-line" }}>
                        {label}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="ml-6 mt-1 text-sm step-arrow opacity-30">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SEO mini-cards */}
            <div className="space-y-3">
              {SEO_ITEMS.map(({ title, body }) => (
                <div key={title}>
                  <h3 className="font-semibold text-xs mb-0.5 flex items-center gap-1.5 seo-subheading">
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00e5e5" }} />
                    {title}
                  </h3>
                  <p className="pl-5 text-xs leading-relaxed seo-text">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works — mobile only (below downloader, upar features se) ── */}
        <div className="mt-6 rounded-2xl p-6 how-it-works-card lg:hidden">
          <h2 className="text-lg font-black text-center mb-6 how-it-works-title">How it works?</h2>
          <div className="flex items-start justify-between gap-1">
            {STEPS.map(({ num, label, Icon, color }, i) => (
              <div key={num} className="flex items-start gap-1 flex-1">
                <div className="flex flex-col items-center gap-2.5 flex-1">
                  <div
                    className="relative w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: `${color}18`, border: `2px solid ${color}45` }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.8} />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                      style={{ background: color }}
                    >
                      {num}
                    </div>
                  </div>
                  <p className="text-xs text-center leading-snug font-medium step-label" style={{ whiteSpace: "pre-line" }}>
                    {label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-shrink-0 mt-5 text-sm font-bold step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature cards — mobile only ── */}
        <div className="grid grid-cols-2 gap-3 mt-4 lg:hidden">
          {FEATURES.map(({ label, Icon, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl relative overflow-hidden"
              style={{ background: `${color}0d`, border: `1.5px solid ${color}35` }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}30 0%, transparent 65%)` }} />
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center relative z-10"
                style={{ background: `${color}22`, border: `2px solid ${color}55` }}
              >
                <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />
              </div>
              <span className="text-xs font-bold text-center feature-label relative z-10 leading-snug">{label}</span>
            </div>
          ))}
        </div>

        {/* ── SEO text — mobile only ── */}
        <div className="pt-2 mt-6 space-y-4 text-sm seo-text lg:hidden">
          <div className="neon-divider" />
          <div className="pt-3">
            <h2 className="text-base font-black mb-2 seo-heading">Best TikTok Downloader — No Watermark</h2>
            <p className="leading-relaxed">
              Luldown lets you download TikTok videos in 1080p or 720p without watermark, or save as 192kbps MP3.
              Completely free, no account needed, works on any device.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SEO_ITEMS.map(({ title, body }) => (
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

        {/* ── Desktop SEO section (full width below both columns) ── */}
        <div className="hidden lg:block mt-10 pt-8 space-y-4 text-sm seo-text">
          <div className="neon-divider" />
          <div className="pt-3 max-w-3xl">
            <h2 className="text-lg font-black mb-2 seo-heading">Best TikTok Downloader — No Watermark</h2>
            <p className="leading-relaxed">
              Luldown lets you download TikTok videos in 1080p or 720p without watermark, or save as 192kbps MP3.
              Completely free, no account needed, works on any device.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
