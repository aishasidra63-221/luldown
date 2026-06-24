import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { ChevronRight, CheckCircle2, Zap, Lock, Smartphone } from "lucide-react";

const FEATURES = [
  { icon: CheckCircle2, label: "No Watermark",  desc: "Original quality video",  color: "text-green-500"  },
  { icon: Zap,          label: "HD Quality",    desc: "Up to 1080p resolution",   color: "text-yellow-500" },
  { icon: Lock,         label: "100% Private",  desc: "No data stored",           color: "text-blue-500"   },
  { icon: Smartphone,   label: "All Devices",   desc: "Works on any device",      color: "text-purple-500" },
];

const FAQS = [
  { q: "Can I download TikTok videos without watermark?", a: "Yes. Luldown gives you the original clean video — no TikTok logo, no username watermark, exactly as the creator recorded it." },
  { q: "What video quality is available?", a: "You can choose 1080p HD (best quality) or 720p standard quality. Both are watermark-free." },
  { q: "Does it work on iPhone and Android?", a: "Yes, Luldown works on all devices including iPhone, Android phones, tablets, and computers — no app required." },
  { q: "Is there a download limit?", a: "No. You can download as many TikTok videos as you want, completely free, with no daily limits." },
  { q: "Why is my video opening in a new tab?", a: "This can happen due to browser restrictions. On mobile, long-press the video and tap Save. On desktop, right-click and choose Save As." },
];

export default function VideoPage() {
  useSEO({
    title: "TikTok Video Downloader Without Watermark — Free HD Download",
    description: "Download TikTok videos without watermark in 1080p HD or 720p. Free, fast, no login required. Works on iPhone, Android, and PC.",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <header className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          TikTok Video Downloader<br />
          <span className="text-primary">Without Watermark</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Download any TikTok video in full HD quality — no watermark, no login, completely free.
        </p>
      </header>

      <DownloaderBox />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FEATURES.map(({ icon: Icon, label, desc, color }) => (
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
          <h2 className="text-xl font-bold text-foreground mb-3">Download TikTok Videos Without Watermark</h2>
          <p className="leading-relaxed">
            Luldown is the easiest way to save TikTok videos directly to your device — without the TikTok watermark
            or username overlay. Whether you want to keep a video for offline viewing, share it on another platform,
            or archive your favorite content, Luldown makes it simple and instant.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download TikTok in 1080p HD
            </h3>
            <p>Get the highest quality version of any TikTok video. Our 1080p HD option delivers crisp, clear video perfect for saving memories or repurposing content.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download TikTok in 720p
            </h3>
            <p>Prefer a smaller file size? The 720p option gives you clean, standard-quality video that's perfect for mobile storage and quick sharing.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Works on All Devices
            </h3>
            <p>Use Luldown on iPhone, Android, Mac, Windows, or any tablet — no app to install. Just paste the TikTok link and download instantly from your browser.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> No Account Needed
            </h3>
            <p>There's no signup, no subscription, and no personal data required. Just copy the TikTok link, paste it here, and download — it's that simple.</p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-foreground text-sm mb-1">{q}</h3>
                <p className="text-xs leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
