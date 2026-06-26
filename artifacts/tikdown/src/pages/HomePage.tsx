import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Copy, Search, Download, CheckCircle2, ChevronRight, Zap, Lock, Smartphone } from "lucide-react";

const FEATURES = [
  { Icon: CheckCircle2, label: "No Watermark",   desc: "Clean original video",  gradient: "from-emerald-500/20 to-emerald-500/5", icon_color: "text-emerald-400"  },
  { Icon: Zap,          label: "Lightning Fast",  desc: "Instant results",       gradient: "from-amber-500/20 to-amber-500/5",   icon_color: "text-amber-400" },
  { Icon: Lock,         label: "100% Private",    desc: "Nothing stored",        gradient: "from-violet-500/20 to-violet-500/5", icon_color: "text-violet-400"   },
  { Icon: Smartphone,   label: "All Devices",     desc: "iPhone, Android, PC",   gradient: "from-cyan-500/20 to-cyan-500/5",     icon_color: "text-cyan-400" },
];

const STEPS = [
  { Icon: Copy,     num: "01", title: "Copy Link",    desc: "Open TikTok, tap Share → Copy Link" },
  { Icon: Search,   num: "02", title: "Paste & Fetch", desc: "Paste the URL and click Fetch"     },
  { Icon: Download, num: "03", title: "Download",     desc: "Choose 1080p, 720p or MP3"          },
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
        { "@type": "Question", "name": "What formats does Luldown support?", "acceptedAnswer": { "@type": "Answer", "text": "MP4 1080p HD, MP4 720p, MP3 192kbps audio, and TikTok photo slideshows." } },
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

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="hero-orb-purple absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-60" />
        <div className="hero-orb-cyan absolute top-[20%] -right-40 w-[500px] h-[500px] rounded-full opacity-50" />
        <div className="hero-orb-purple absolute bottom-[20%] left-[30%] w-[400px] h-[400px] rounded-full opacity-30" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14 space-y-14">

        {/* Hero */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 badge-shimmer border border-primary/25 text-primary text-xs font-semibold px-4 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Fast · Free · No Login Required
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.08]">
              <span className="gradient-text">Luldown</span>
            </h1>
            <p className="text-2xl sm:text-3xl font-bold text-foreground/80 tracking-tight">
              Download TikTok Videos
            </p>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              No watermark. No login. No limits. Save any TikTok video or music instantly — forever free.
            </p>
          </div>
        </header>

        {/* Downloader */}
        <DownloaderBox />

        {/* How it works */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground text-sm mt-1">Three steps. Done in seconds.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map(({ Icon, num, title, desc }) => (
              <div key={title} className="glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4 card-hover">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-btn text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {parseInt(num)}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map(({ Icon, label, desc, gradient, icon_color }) => (
            <div key={label} className={`glass-card rounded-xl p-4 flex flex-col items-start gap-3 card-hover bg-gradient-to-br ${gradient}`}>
              <div className="w-9 h-9 rounded-xl bg-black/30 border border-white/8 flex items-center justify-center">
                <Icon className={`w-4.5 h-4.5 ${icon_color}`} />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SEO Content */}
        <article className="space-y-6 text-sm text-muted-foreground border-t border-border/50 pt-10">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Luldown — Best TikTok Downloader Without Watermark</h2>
            <p className="leading-relaxed">
              Luldown is the fastest and most reliable TikTok video downloader in 2026. Paste any TikTok URL
              and instantly download in 1080p or 720p MP4 without watermark, or extract 192kbps MP3 audio —
              completely free, no account or app installation needed.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Download 1080p Without Watermark", body: "Save TikTok videos in full HD 1080p quality with no watermark or logo overlay. Perfect for repurposing content or saving memories." },
              { title: "Download 720p Without Watermark",  body: "Get standard HD 720p quality videos, smaller file size with clean output — great for mobile storage." },
              { title: "Extract MP3 Audio",                body: "Download TikTok sounds and music as high-quality 192kbps MP3 files — great for ringtones, podcasts, and music discovery." },
              { title: "Works on All Devices",             body: "Fully responsive — use Luldown on iPhone, Android, tablet, or desktop. No app download required." },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold text-sm text-foreground mb-1.5 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
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
