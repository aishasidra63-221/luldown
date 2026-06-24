import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { ChevronRight, Image, Download, Lock, Smartphone } from "lucide-react";

const FEATURES = [
  { icon: Image,      label: "Full Resolution", desc: "Original image quality",   color: "text-pink-500"   },
  { icon: Download,   label: "Bulk Download",   desc: "Save all photos at once",  color: "text-yellow-500" },
  { icon: Lock,       label: "100% Private",    desc: "No data stored",           color: "text-blue-500"   },
  { icon: Smartphone, label: "All Devices",     desc: "Works on any browser",     color: "text-purple-500" },
];

const FAQS = [
  { q: "How do I download TikTok photo slideshows?", a: "Paste the TikTok photo post link, click Fetch, and Luldown will show all the images. Click 'Save Photo' to download individually or 'Save All' to download every photo at once." },
  { q: "Can I download all photos at once?", a: "Yes. For photo slideshows with multiple images, a 'Save All Photos' button appears so you can download every image in one click." },
  { q: "Are the photos in full quality?", a: "Yes. Luldown downloads TikTok photos in their original full resolution — no compression or quality loss." },
  { q: "What format are TikTok photos saved in?", a: "Photos are saved as JPG files — the standard format used by TikTok's platform — compatible with all devices and apps." },
  { q: "Does this work for all TikTok image posts?", a: "Yes, as long as the post is public. Private TikTok posts cannot be accessed by any tool." },
];

export default function PhotoPage() {
  useSEO({
    title: "TikTok Photo Downloader — Save TikTok Slideshows & Images Free",
    description: "Download TikTok photo slideshows and images in full resolution. Save all photos at once — free, no login, no watermark.",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <header className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          TikTok Photo Downloader<br />
          <span className="text-primary">Save Slideshows Free</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Download TikTok photo posts and image slideshows in full resolution — all images, all at once.
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
          <h2 className="text-xl font-bold text-foreground mb-3">Download TikTok Photo Posts & Slideshows</h2>
          <p className="leading-relaxed">
            TikTok photo posts (slideshows) contain multiple images that are difficult to save directly from the app.
            Luldown lets you download every single image from any public TikTok photo post — in full original quality,
            instantly, with no watermark. Just paste the link and get all your images.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Download All Slideshow Images
            </h3>
            <p>For multi-image TikTok posts, download every photo from the slideshow in a single click. No need to save them one by one.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Full Resolution Images
            </h3>
            <p>Every photo is downloaded at its original resolution — no compression, no quality loss. Perfect for sharing, printing, or archiving.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> No TikTok App Required
            </h3>
            <p>Works entirely in your browser. Paste the link on mobile or desktop — no TikTok app, no third-party app, nothing to install.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Preview Before Saving
            </h3>
            <p>After fetching, you can see a preview of all images before downloading. Pick individual photos or save all at once.</p>
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
