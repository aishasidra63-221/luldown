import { HelpCircle, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";

const FAQS = [
  {
    q: "How do I download a TikTok video?",
    a: "Open TikTok, tap Share → Copy Link on any video. Come back to Luldown, paste the link in the box, click Download Now, then choose your format — 1080p, 720p, or MP3.",
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
    <div style={{
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.09)",
      overflow: "hidden",
      background: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s",
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
          padding: "0 18px 16px",
          fontSize: 14, color: "#4b5563", lineHeight: 1.7,
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingTop: 12,
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

      {/* Hero strip */}
      <div style={{
        background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)",
        padding: "48px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Purple glow */}
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

      {/* FAQ list */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 60px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>

        {/* Contact card */}
        <div style={{
          marginTop: 36,
          background: "#ffffff",
          border: "1px solid rgba(79,110,247,0.18)",
          borderRadius: 16,
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
            background: "rgba(79,110,247,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageCircle size={20} color="#4f6ef7" />
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>
            Still have questions?
          </p>
          <p style={{ fontSize: 13.5, color: "#6b7280" }}>
            Contact us at{" "}
            <a href="mailto:support@luldown.com" style={{ color: "#4f6ef7", fontWeight: 600, textDecoration: "none" }}>
              support@luldown.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
