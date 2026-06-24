import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { ChevronRight, CheckCircle2, Zap, Lock, Star } from "lucide-react";

const FEATURES = [
  { icon: CheckCircle2, label: "Clean Video",    desc: "Zero watermark overlay",  color: "text-green-500"  },
  { icon: Zap,          label: "Instant",        desc: "No waiting, no queue",    color: "text-yellow-500" },
  { icon: Lock,         label: "No Login",       desc: "Completely anonymous",    color: "text-blue-500"   },
  { icon: Star,         label: "HD Quality",     desc: "1080p available",         color: "text-purple-500" },
];

const FAQS = [
  { q: "Why do TikTok videos have watermarks?", a: "The TikTok app adds a username and logo watermark during playback. This watermark is not part of the original video file — Luldown gives you the original clean version." },
  { q: "Is the downloaded video truly watermark-free?", a: "Yes. Luldown downloads the original video file without any watermarks — no TikTok logo, no username, no app branding." },
  { q: "Can I use the downloaded video for editing?", a: "The video is free of watermarks, making it ideal for video editing, repurposing, or archiving. Always make sure you have the creator's permission before repurposing their content." },
  { q: "What resolution is available for watermark-free download?", a: "You can choose 1080p HD or 720p. Both options are completely watermark-free." },
  { q: "Does screen recording give watermark-free videos?", a: "No — screen recording captures the watermark too. Luldown downloads the original source file, which has no watermark at all." },
];

export default function NoWatermarkPage() {
  useSEO({
    title: "Download TikTok Without Watermark — Free HD Video Saver",
    description: "Download TikTok videos without watermark in HD quality. No TikTok logo, no username overlay. Free, instant, no login required.",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <header className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Download TikTok<br />
          <span className="text-primary">Without Watermark</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Get the original, clean TikTok video — no logo, no username, no app branding. Free and instant.
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
          <h2 className="text-xl font-bold text-foreground mb-3">What Does "No Watermark" Mean?</h2>
          <p className="leading-relaxed">
            When you save a TikTok video using the TikTok app's built-in save feature, the downloaded file
            includes a watermark — the TikTok logo and the creator's username. Luldown bypasses this and
            provides you with the original video file, which contains no watermark of any kind. The video
            is exactly as the creator recorded it.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> No TikTok Logo
            </h3>
            <p>The downloaded video has no TikTok branding, no logo in the corner, and no spinning disc overlay. Just the pure original content.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> No Username Watermark
            </h3>
            <p>The creator's username that normally appears at the bottom of TikTok-saved videos is completely absent in Luldown downloads.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Better Than Screen Recording
            </h3>
            <p>Screen recording captures the watermark, reduces quality, and includes your phone's UI. Luldown gives you a clean, full-quality file every time.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Ready for Editing
            </h3>
            <p>A clean, watermark-free video is perfect for use in video editors, presentations, and creative projects. Always credit the original creator.</p>
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
