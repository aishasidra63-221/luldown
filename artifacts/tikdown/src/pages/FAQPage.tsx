import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How do I download a TikTok video?",
    a: "Open TikTok, tap Share → Copy Link on any video. Come back to Luldown, paste the link in the box, click Fetch, then choose your format — 1080p, 720p, or MP3.",
  },
  {
    q: "Is Luldown free to use?",
    a: "Yes, 100% free. No subscription, no account, no hidden fees. You can download unlimited videos at no cost.",
  },
  {
    q: "Why is the video without watermark?",
    a: "TikTok stores two versions of every video on their CDN — one with a watermark (added by the app) and one clean original file. Luldown resolves the clean CDN URL directly, bypassing the app-layer watermark.",
  },
  {
    q: "What formats are available?",
    a: "We offer three formats: MP4 1080p (HD, no watermark), MP4 720p (standard, no watermark), and MP3 192kbps (audio only). For photo slideshows, all images are shown directly from CDN.",
  },
  {
    q: "Can I download private TikTok videos?",
    a: "No. Luldown can only download public TikTok videos. Private or restricted videos cannot be accessed.",
  },
  {
    q: "Why is the download opening in a new tab instead of saving?",
    a: "This is a browser security restriction for cross-origin files. On desktop, right-click the video and choose 'Save As'. On mobile, long-press the video and tap 'Save'. The file comes directly from TikTok's CDN.",
  },
  {
    q: "Is my data safe? Do you store my history?",
    a: "Your download history is stored only in your browser's localStorage — it never leaves your device. We do not collect or store any personal data on our servers.",
  },
  {
    q: "Does Luldown work on mobile?",
    a: "Yes. Luldown is fully responsive and works on iPhone, Android, tablets, and all desktop browsers. No app installation needed.",
  },
  {
    q: "Is this legal?",
    a: "Downloading TikTok content for personal, non-commercial use is generally permitted. Redistributing, selling, or claiming others' content as your own violates TikTok's Terms of Service and copyright law. Always respect the original creator.",
  },
  {
    q: "The video failed to load — what should I do?",
    a: "Try copying the link again from TikTok and pasting it fresh. Some videos may be region-restricted or temporarily unavailable. If the issue persists, the video may be private.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left bg-card hover:bg-secondary transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed bg-card">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground">Everything you need to know about Luldown</p>
      </header>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <FAQItem key={item.q} {...item} />
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">Still have questions?</p>
        <p className="text-xs text-muted-foreground">Contact us at <span className="text-primary">support@luldown.com</span></p>
      </div>
    </div>
  );
}
