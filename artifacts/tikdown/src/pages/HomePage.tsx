import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Copy, Search, Download, CheckCircle2, ChevronRight, Zap, Lock, Smartphone } from "lucide-react";

const FEATURES = [
  { Icon: CheckCircle2, label: "No Watermark",   desc: "Clean videos",      color: "text-green-500"  },
  { Icon: Zap,          label: "Lightning Fast",  desc: "Instant download",  color: "text-yellow-500" },
  { Icon: Lock,         label: "100% Private",    desc: "No data stored",    color: "text-blue-500"   },
  { Icon: Smartphone,   label: "Mobile Ready",    desc: "Works everywhere",  color: "text-purple-500" },
];

const STEPS = [
  { Icon: Copy,     title: "Copy Link",    desc: "Open TikTok, tap Share → Copy Link" },
  { Icon: Search,   title: "Paste & Fetch", desc: "Paste the link and click Fetch"    },
  { Icon: Download, title: "Download",     desc: "Pick 720p, 1080p or MP3"            },
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
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          Fast · Free · No Login Required
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Luldown<br />
          <span className="text-primary">TikTok Videos Free</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          The easiest way to save TikTok videos and music — free forever, no account needed.
        </p>
      </header>

      <DownloaderBox />

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

      <article className="space-y-6 text-sm text-muted-foreground border-t border-border pt-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Luldown — Best TikTok Downloader Without Watermark</h2>
          <p className="leading-relaxed">
            Luldown is the fastest and most reliable TikTok video downloader in 2026. Paste any TikTok URL
            and instantly download in 1080p or 720p MP4 without watermark, or extract 192kbps MP3 audio —
            completely free, no account or app installation needed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download 1080p Without Watermark
            </h3>
            <p>Save TikTok videos in full HD 1080p quality with no watermark or logo overlay. Perfect for repurposing content or saving memories.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download 720p Without Watermark
            </h3>
            <p>Get standard HD 720p quality videos, smaller file size with clean output — great for mobile storage.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Extract MP3 Audio
            </h3>
            <p>Download TikTok sounds and music as high-quality 192kbps MP3 files — great for ringtones, podcasts, and music discovery.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Works on All Devices
            </h3>
            <p>Fully responsive — use Luldown on iPhone, Android, tablet, or desktop. No app download required.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
