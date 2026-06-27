import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Copy, Download, CheckCircle2, ChevronRight, Zap, Lock, Smartphone, Music, Image, Play } from "lucide-react";

const FEATURES = [
  {
    Icon: CheckCircle2,
    label: "No Watermark",
    desc: "Original clean video — no TikTok logo, no username overlay.",
    stat: "100%",
    statLabel: "Clean",
    iconColor: "#7c3aed",
    statColor: "#7c3aed",
  },
  {
    Icon: Zap,
    label: "Lightning Fast",
    desc: "Video info in under 2 seconds. Download starts instantly.",
    stat: "<2s",
    statLabel: "Response",
    iconColor: "#d97706",
    statColor: "#d97706",
  },
  {
    Icon: Lock,
    label: "100% Private",
    desc: "Nothing stored on any server. Your downloads stay yours.",
    stat: "0",
    statLabel: "Data Stored",
    iconColor: "#2563eb",
    statColor: "#2563eb",
  },
  {
    Icon: Smartphone,
    label: "All Devices",
    desc: "iPhone, Android, Windows, Mac — any browser, no app needed.",
    stat: "Any",
    statLabel: "Device",
    iconColor: "#059669",
    statColor: "#059669",
  },
];

const STEPS = [
  { Icon: Copy,     num: "1", title: "Copy Link",     desc: "Open TikTok → tap Share → Copy Link",  color: "#7c3aed" },
  { Icon: Download, num: "2", title: "Paste & Click", desc: "Paste the URL here and hit Download",  color: "#4338ca" },
  { Icon: Play,     num: "3", title: "Save & Enjoy",  desc: "Pick your format — done in seconds!",  color: "#2563eb" },
];

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Luldown",
      "url": "https://luldown.com",
      "description": "Free TikTok video downloader without watermark. Download TikTok videos in 1080p, 720p, MP3, and photos.",
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
      "description": "Download TikTok videos without watermark in HD quality. Free, fast, no login required.",
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Is Luldown free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, completely free. No subscription, no hidden fees." } },
        { "@type": "Question", "name": "Does Luldown remove the watermark?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Luldown downloads the original clean video without any TikTok watermark or logo." } },
        { "@type": "Question", "name": "What formats does Luldown support?", "acceptedAnswer": { "@type": "Answer", "text": "MP4 1080p HD, MP4 720p, MP3 192kbps audio, and thumbnail JPG." } },
      ],
    },
  ],
};

export default function HomePage() {
  useSEO({
    title: "Luldown — Download TikTok Videos Without Watermark Free",
    description: "Download TikTok videos without watermark in 1080p HD, 720p, or MP3 audio. Free, fast, no login. Works on iPhone, Android, and PC.",
    jsonLd: HOME_JSONLD,
  });

  return (
    <div className="relative">
      <div className="hero-mesh" />

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-16">

        {/* ── Hero ── */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 hero-badge text-xs font-bold px-5 py-2 rounded-full">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Fast · Free · No Login Required
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-none text-white drop-shadow-lg">
              Lul<span className="gradient-text">down</span>
            </h1>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              TikTok Video Downloader
            </p>
          </div>

          <p className="text-base sm:text-lg text-white/75 max-w-md mx-auto leading-relaxed">
            No watermark. No login. No limits.<br />
            Save any TikTok video or music —{" "}
            <span className="text-white font-bold underline underline-offset-2">forever free.</span>
          </p>
        </header>

        {/* ── Downloader ── */}
        <div className="downloader-wrap rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-widest">TikTok Video Downloader</span>
          </div>

          <DownloaderBox />

          <div className="flex items-center justify-center gap-1.5 mt-5 flex-wrap">
            <span className="text-[10px] text-gray-400 mr-1">Supports:</span>
            {[
              { label: "MP4 1080p", color: "#7c3aed", bg: "#ede9fe" },
              { label: "MP4 720p",  color: "#4338ca", bg: "#e0e7ff" },
              { label: "MP3",       color: "#2563eb", bg: "#dbeafe" },
              { label: "Thumbnail", color: "#d97706", bg: "#fef3c7" },
            ].map(({ label, color, bg }) => (
              <span key={label}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: bg, color }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="space-y-7">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow">How It Works</h2>
            <p className="text-white/70 text-sm mt-1">Three steps. Done in seconds.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map(({ Icon, num, title, desc, color }) => (
              <div key={title} className="step-card rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: `${color}15`, border: `2px solid ${color}30` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                    style={{ background: color }}>
                    {num}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-[#1e1b4b] mb-1">{title}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow">Why Luldown?</h2>
            <p className="text-white/70 text-sm mt-1">Built for speed, privacy and quality.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ Icon, label, desc, stat, statLabel, iconColor, statColor }) => (
              <div key={label} className="stat-card rounded-2xl p-5 flex gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${iconColor}12`, border: `1.5px solid ${iconColor}25` }}>
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-[#1e1b4b]">{label}</span>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-black leading-none" style={{ color: statColor }}>{stat}</div>
                      <div className="text-[9px] text-gray-400 leading-none mt-0.5 uppercase tracking-wide">{statLabel}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEO Content ── */}
        <article className="space-y-6 text-sm text-white/60 pt-4">
          <div className="neon-divider" />
          <div className="pt-6">
            <h2 className="text-xl font-black text-white mb-3">Best TikTok Downloader — No Watermark</h2>
            <p className="leading-relaxed">
              Luldown is the fastest free TikTok video downloader in 2026. Paste any TikTok URL and instantly
              download in 1080p or 720p MP4 without watermark, or extract 192kbps MP3 audio — completely free,
              no account needed.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: "Download 1080p Without Watermark", body: "Save TikTok videos in full HD 1080p with no watermark or logo. Perfect for repurposing or saving memories." },
              { title: "Download 720p Without Watermark",  body: "Standard HD 720p — smaller file size, clean output, great for mobile storage." },
              { title: "Extract MP3 Audio 192kbps",        body: "Download TikTok sounds as high-quality 192kbps MP3 — great for ringtones, music discovery, podcasts." },
              { title: "Works on All Devices",             body: "Fully responsive — use on iPhone, Android, tablet, or desktop. No app install ever needed." },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold text-sm text-white/80 mb-1.5 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />
                  {title}
                </h3>
                <p className="leading-relaxed pl-6">{body}</p>
              </div>
            ))}
          </div>
        </article>

      </div>
    </div>
  );
}
