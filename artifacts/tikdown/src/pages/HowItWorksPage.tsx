import { useSEO } from "@/hooks/use-seo";
import { Copy, Search, Download, CheckCircle2, Link as LinkIcon, Film, Music, Image } from "lucide-react";

const STEPS = [
  {
    num: 1,
    icon: Copy,
    title: "Copy the TikTok Link",
    desc: "Open TikTok and find the video, audio, or photo post you want to download. Tap the Share button, then tap 'Copy Link'. The link is now in your clipboard.",
    tip: "Works with any TikTok link — full URLs, short links (tiktok.com/t/...), and profile video links.",
  },
  {
    num: 2,
    icon: Search,
    title: "Paste & Fetch",
    desc: "Come back to Luldown and tap the input box at the top of the page. Tap 'Paste' to fill in the link automatically, then press the 'Fetch' button.",
    tip: "Luldown will instantly retrieve the video details — title, author, thumbnail, and available formats.",
  },
  {
    num: 3,
    icon: Download,
    title: "Choose Format & Download",
    desc: "Once the video info appears, choose your preferred format: MP4 1080p (HD), MP4 720p, or MP3 Audio. Click your choice and the file downloads directly to your device.",
    tip: "For photo posts, you'll see all images displayed. Click 'Save All Photos' to download everything at once.",
  },
];

const FORMATS = [
  { icon: Film,  label: "MP4 1080p HD",   desc: "Highest quality video, no watermark. Best for archiving and editing.",         color: "text-blue-500",   bg: "bg-blue-500/10"  },
  { icon: Film,  label: "MP4 720p",        desc: "Standard quality video, no watermark. Smaller file size, great for mobile.",    color: "text-purple-500", bg: "bg-purple-500/10"},
  { icon: Music, label: "MP3 Audio",       desc: "192kbps audio only. Extract songs, sounds, and voice clips from any video.",    color: "text-green-500",  bg: "bg-green-500/10" },
  { icon: Image, label: "Photo Download",  desc: "Download all images from TikTok slideshow posts in full original resolution.",  color: "text-pink-500",   bg: "bg-pink-500/10"  },
];

export default function HowItWorksPage() {
  useSEO({
    title: "How Luldown Works — TikTok Downloader Guide",
    description: "Learn how to use Luldown to download TikTok videos, MP3 audio, and photo slideshows in 3 simple steps. Free and no login required.",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold text-foreground">How Luldown Works</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Luldown makes downloading TikTok videos, audio, and photos as simple as copying and pasting a link.
          Here's everything you need to know.
        </p>
      </header>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map(({ num, icon: Icon, title, desc, tip }) => (
          <div key={num} className="bg-card border border-border rounded-2xl p-6 flex gap-5">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center">
                {num}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-foreground">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              <div className="flex items-start gap-2 text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {tip}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formats */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Available Download Formats</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {FORMATS.map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported link types */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-primary" /> Supported Link Formats
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "https://www.tiktok.com/@username/video/1234567890",
            "https://tiktok.com/t/XXXXXXX  (short link)",
            "https://vm.tiktok.com/XXXXXXX  (share link)",
            "https://vt.tiktok.com/XXXXXXX  (video share link)",
          ].map((link) => (
            <li key={link} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <code className="text-xs bg-secondary px-2 py-0.5 rounded">{link}</code>
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy note */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Your privacy is protected</p>
        <p>Luldown does not store your download history on any server. Your history is saved only in your browser's local storage and is never sent to us. You can clear it anytime from Settings.</p>
      </div>
    </div>
  );
}
