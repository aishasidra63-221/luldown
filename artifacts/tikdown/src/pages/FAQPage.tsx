import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I download a TikTok video?",
        a: "Open TikTok, tap Share → Copy Link on any video. Come back to Luldown, paste the link in the box, click Download Now, then choose your format — 1080p, 720p, or MP3.",
      },
      {
        q: "Is Luldown free to use?",
        a: "Yes, 100% free. No subscription, no account, no hidden fees. You can download unlimited videos at no cost.",
      },
      {
        q: "Do I need to install an extension or app?",
        a: "No installation needed. Luldown works entirely in your browser — just paste the TikTok link and download. No extensions, no apps, no plugins required.",
      },
      {
        q: "Do I need a TikTok account to download videos?",
        a: "No account required. You can download any public TikTok video without logging in or creating an account.",
      },
    ],
  },
  {
    category: "Formats & Quality",
    items: [
      {
        q: "What formats are available?",
        a: "We offer three formats: MP4 1080p (HD, no watermark), MP4 720p (standard, no watermark), and MP3 192kbps (audio only). For photo slideshows, all images are shown and downloadable individually.",
      },
      {
        q: "Why is the video without a watermark?",
        a: "TikTok stores two versions of every video on their CDN — one with a watermark (added by the app) and one clean original file. Luldown resolves the clean CDN URL directly, bypassing the app-layer watermark.",
      },
      {
        q: "How to download TikTok video in HD 1080p?",
        a: "Paste the TikTok link and click Download Now. When the result card appears, choose 'Download HD 1080p — No Watermark'. This gives you the highest quality version available.",
      },
      {
        q: "Can I download only the audio (MP3)?",
        a: "Yes. After pasting the link and clicking Download Now, select 'Download MP3 Audio — 192kbps'. The audio is extracted at 192kbps quality.",
      },
      {
        q: "Can I download TikTok photo slideshows?",
        a: "Yes. If a TikTok post is a photo slideshow, Luldown will show all images. You can download each photo individually or save all at once.",
      },
    ],
  },
  {
    category: "Device & Browser",
    items: [
      {
        q: "How to download TikTok videos on iPhone (iOS)?",
        a: "Open TikTok, tap Share → Copy Link. Then open Luldown in Safari, paste the link and tap Download. Long-press the download link and choose 'Download Linked File' to save directly to your Files app or Photos.",
      },
      {
        q: "How to download TikTok videos on Android?",
        a: "Copy the TikTok link from the Share menu, open Luldown in Chrome, paste and tap Download. The file will save to your Downloads folder automatically. You can then move it to Gallery from there.",
      },
      {
        q: "Does Luldown work on desktop (PC/Mac)?",
        a: "Yes. Luldown works on all desktop browsers — Chrome, Firefox, Safari, Edge. Paste the link, click Download, then right-click the file and choose 'Save As' to pick your save location.",
      },
      {
        q: "Why does the download open in a new tab instead of saving?",
        a: "This is a browser security restriction for cross-origin files. On desktop, right-click the video and choose 'Save As'. On mobile, long-press and tap 'Save'. The file comes directly from TikTok's CDN.",
      },
    ],
  },
  {
    category: "Privacy & Safety",
    items: [
      {
        q: "Is my data safe? Do you store my history?",
        a: "Your download history is stored only in your browser's localStorage — it never leaves your device and is never sent to our servers. We do not collect or store any personal data. You can clear your history anytime from the History page.",
      },
      {
        q: "Can Luldown see what I download?",
        a: "No. Luldown acts as a URL resolver only — your browser fetches the file directly from TikTok's CDN. We do not receive, log, or store the content of any download.",
      },
      {
        q: "Can I download videos from private TikTok accounts?",
        a: "No. Luldown can only download videos from public TikTok accounts. Private account videos are not publicly accessible and cannot be downloaded.",
      },
      {
        q: "Is it legal to download TikTok videos?",
        a: "Downloading TikTok content for personal, non-commercial use is generally acceptable. Redistributing, reselling, or claiming others' content as your own violates TikTok's Terms of Service and copyright law. Always respect the original creator and use downloaded content responsibly.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    items: [
      {
        q: "The video failed to load — what should I do?",
        a: "Try copying the link again fresh from TikTok and pasting it into Luldown. Some videos may be temporarily unavailable or region-restricted. If the issue persists, the video may have been deleted or set to private.",
      },
      {
        q: "Where are TikTok videos saved after downloading?",
        a: "On desktop, files go to your browser's Downloads folder. On iPhone, use 'Download Linked File' in Safari to save to the Files app. On Android, files save to your Downloads folder and can be moved to Gallery.",
      },
      {
        q: "Why is the download speed slow?",
        a: "Download speed depends on TikTok's CDN and your internet connection — Luldown does not throttle or limit downloads in any way. Large 1080p files may take a moment on slower connections.",
      },
      {
        q: "The link I pasted is not working — why?",
        a: "Make sure you are pasting the full TikTok video URL (it should contain 'tiktok.com' and a video ID). Short links from the TikTok app (vm.tiktok.com) also work. Links to profile pages or sounds are not supported.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.09)",
      overflow: "hidden",
      background: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12,
          padding: "16px 18px", textAlign: "left",
          background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14.5, color: "#111827", lineHeight: 1.45 }}>{q}</span>
        <ChevronDown size={16} style={{
          color: "#6b7280", flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }} />
      </button>
      {open && (
        <div style={{
          padding: "12px 18px 16px",
          fontSize: 14, color: "#4b5563", lineHeight: 1.7,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  useSEO({
    title: "FAQ — Luldown TikTok Downloader",
    description: "Frequently asked questions about Luldown — how to download TikTok videos, supported formats, privacy, and more.",
  });

  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh" }}>

      <div style={{
        background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)",
        padding: "48px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(120,40,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
          background: "rgba(79,110,247,0.15)",
          border: "1px solid rgba(79,110,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <HelpCircle size={24} color="#4f6ef7" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em",
          position: "relative",
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.55)", position: "relative" }}>
          Everything you need to know about Luldown
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 20px 60px" }}>
        {FAQS.map((section) => (
          <div key={section.category} style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "#4f6ef7",
              marginBottom: 14, paddingLeft: 4,
            }}>
              {section.category}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {section.items.map((item) => (
                <FAQItem key={item.q} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
