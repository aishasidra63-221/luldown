import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Zap, WifiOff, Tv2, MonitorSmartphone, ChevronRight } from "lucide-react";

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Luldown",
      "url": "https://luldown.com",
      "description": "Free TikTok video downloader without watermark.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://luldown.com/?url={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "name": "Luldown TikTok Downloader",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    },
  ],
};

const FEATURES = [
  {
    label: "No Watermark",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    color: "#e91e8c",
  },
  {
    label: "HD Quality",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M8 12h2m0 0V9m0 3v3m4-6v6m0-6h2a1 1 0 010 3h-2m0 0h2a1 1 0 010 3h-2" />
      </svg>
    ),
    color: "#00e5e5",
  },
  {
    label: "Fast Download",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    color: "#e91e8c",
  },
  {
    label: "All Devices",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="3" width="15" height="11" rx="2" />
        <path d="M17 8h3a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-1" />
      </svg>
    ),
    color: "#a855f7",
  },
];

const STEPS = [
  {
    num: "1",
    label: "Copy link from\nTikTok",
    color: "#e91e8c",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: "2",
    label: "Paste the link\nabove",
    color: "#00e5e5",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M12 12v4m-2-2h4" />
      </svg>
    ),
  },
  {
    num: "3",
    label: "Click download\nand enjoy",
    color: "#e91e8c",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
        <path d="M9 16l6-8" strokeWidth={1.4} opacity="0.4" />
      </svg>
    ),
  },
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
        <div className="relative pt-4 pb-2">

          {/* TikTok music note decoration */}
          <div className="absolute -top-2 right-0 opacity-20 pointer-events-none select-none"
            aria-hidden="true">
            <svg viewBox="0 0 120 130" width="110" height="110" fill="none">
              <path d="M85 10 C85 10 95 18 110 18 L110 40 C95 40 80 32 80 32 L80 90 C80 105 68 118 53 118 C38 118 26 106 26 91 C26 76 38 64 53 64 C57 64 61 65 65 67 L65 45 C46 43 30 57 26 75" fill="none" stroke="#00e5e5" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="53" cy="91" r="14" fill="none" stroke="#e91e8c" strokeWidth="6"/>
            </svg>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 hero-badge text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3 h-3 fill-current" />
            100% Free
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3" style={{ color: "#ffffff" }}>
            Download{" "}
            <span style={{ color: "#00e5e5" }}>TikTok</span>{" "}
            Videos<br />Without Watermark
          </h1>

          {/* Subtitle */}
          <p className="text-base font-medium mb-6" style={{ color: "rgba(200,210,230,0.65)" }}>
            Fast. Free. High Quality.
          </p>
        </div>

        {/* ── Downloader ── */}
        <DownloaderBox />

        {/* ── Feature icons row ── */}
        <div className="grid grid-cols-4 gap-2.5 pt-1">
          {FEATURES.map(({ label, icon, color }) => (
            <div key={label} className="feature-icon-card" style={{ color }}>
              <div>{icon}</div>
              <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: "rgba(200,215,235,0.7)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div className="rounded-2xl p-6" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-lg font-black text-white text-center mb-6">How it works?</h2>

          <div className="flex items-start justify-between gap-2">
            {STEPS.map(({ num, label, color, icon }, i) => (
              <div key={num} className="flex items-start gap-2 flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  {/* Icon circle */}
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `2px solid ${color}40` }}>
                    <div style={{ color }}>{icon}</div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                      style={{ background: color, fontSize: "10px" }}>
                      {num}
                    </div>
                  </div>
                  {/* Label */}
                  <p className="text-xs text-center leading-snug font-medium" style={{ color: "rgba(200,215,235,0.8)", whiteSpace: "pre-line" }}>
                    {label}
                  </p>
                </div>

                {/* Arrow between steps */}
                {i < STEPS.length - 1 && (
                  <div className="flex-shrink-0 mt-5 text-xs font-black" style={{ color: "rgba(200,215,235,0.3)" }}>
                    —→
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── SEO text ── */}
        <div className="pt-2 space-y-4 text-sm" style={{ color: "rgba(200,215,235,0.45)" }}>
          <div className="neon-divider" />
          <div className="pt-3">
            <h2 className="text-base font-black text-white mb-2">Best TikTok Downloader — No Watermark</h2>
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
                <h3 className="font-semibold text-xs mb-1 flex items-center gap-1.5" style={{ color: "rgba(200,215,235,0.6)" }}>
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
