import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

/* ─── Colors ──────────────────────────────────────────── */
const DARK_BG   = "#13112b";
const DARK_BG2  = "#0f0d24";
const WHITE     = "#ffffff";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

/* ─── FAQ ────────────────────────────────────────────── */
const HOME_FAQS = [
  { q: "Is Luldown free to use?",           a: "Yes, 100% free. No subscription, no account, no hidden fees. You can download unlimited videos at no cost." },
  { q: "What formats are available?",        a: "MP4 1080p (HD, no watermark), MP4 720p (standard, no watermark), and MP3 192kbps (audio only). Photo slideshows show all images directly." },
  { q: "Why is the video without a watermark?", a: "TikTok stores two versions of every video — one with a watermark (shown in the app) and one clean original file. Luldown fetches the clean version directly." },
  { q: "Is my data safe?",                   a: "Your download history is stored only in your browser — it never leaves your device. We don't collect or store any personal data on our servers." },
  { q: "Does it work on mobile?",            a: "Yes. Luldown is fully responsive and works on iPhone, Android, tablets, and all desktop browsers. No app installation needed." },
  { q: "Why does the download open in a new tab?", a: "This is a browser security restriction for cross-origin files. On desktop, right-click and choose 'Save As'. On mobile, long-press and tap 'Save'." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid rgba(0,0,0,0.08)",
      overflow: "hidden",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "16px 0", textAlign: "left",
        background: "transparent", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={16} style={{
          color: GRAY_TEXT, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }} />
      </button>
      {open && (
        <div style={{ padding: "0 0 16px", fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.65 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Features (3 items, NO cards) ────────────────────── */
const FEATURES = [
  {
    label: "Unlimited",
    desc:  "Download as many TikTok videos as you want — no daily limits.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M6 18c0-3.31 2.69-6 6-6 1.66 0 3.16.67 4.24 1.76L18 16" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M30 18c0 3.31-2.69 6-6 6-1.66 0-3.16-.67-4.24-1.76L18 20" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 18c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="18" cy="18" rx="12" ry="6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "No Watermark",
    desc:  "Get clean videos without the TikTok logo or watermark.",
    icon: (
      <span style={{ fontSize: 32, lineHeight: 1 }}>🚫</span>
    ),
  },
  {
    label: "MP4 & MP3",
    desc:  "Save in HD video or extract audio as MP3 instantly.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M9 18V5l12-2v13" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke="#9ca3af" strokeWidth="1.8"/>
        <circle cx="18" cy="16" r="3" stroke="#9ca3af" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

/* ─── Steps ──────────────────────────────────────────── */
const STEPS = [
  {
    n: "1",
    title: "Find a TikTok Video",
    desc:  "Open the TikTok app and find the video you want to save. Play it to confirm it's the right one.",
  },
  {
    n: "2",
    title: "Copy the Link",
    desc:  "Tap Share → Copy Link. The TikTok URL is now in your clipboard ready to paste.",
  },
  {
    n: "3",
    title: "Paste & Download",
    desc:  "Come to LulDown, paste the link in the box above and click Download. Your video saves in seconds.",
  },
];

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
  });

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════
          HERO — dark navy
      ══════════════════════════════════════════ */}
      <section style={{
        background: DARK_BG,
        position: "relative",
        overflow: "hidden",
        padding: "52px 24px 52px",
        textAlign: "center",
      }}>
        {/* Subtle purple glow blob */}
        <div style={{
          position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          {/* Title */}
          <h1 style={{
            fontSize: "clamp(2rem, 6vw, 3rem)",
            fontWeight: 800, lineHeight: 1.18,
            color: "#ffffff",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}>
            TikTok Video Downloader
          </h1>
          <h1 style={{
            fontSize: "clamp(1.8rem, 5.5vw, 2.8rem)",
            fontWeight: 800, lineHeight: 1.18,
            background: "linear-gradient(90deg, #4f6ef7 0%, #7c3aed 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}>
            Without Watermark
          </h1>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.55)",
            marginBottom: 40, fontWeight: 400, lineHeight: 1.6,
          }}>
            Fast. Free. High Quality. No Registration.
          </p>

          {/* Downloader box */}
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <DownloaderBox />
          </div>

          {/* Advertisement placeholder */}
          <div style={{
            marginTop: 28,
            padding: "14px 20px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.25)",
            fontSize: 12, letterSpacing: "0.08em",
          }}>
            — Advertisement —
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — pure white, NO cards
      ══════════════════════════════════════════ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{
          maxWidth: 860, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "32px 40px",
        }}
          className="features-grid"
        >
          {FEATURES.map(({ label, desc, icon }) => (
            <div key={label} style={{ textAlign: "left" }}>
              <div style={{ marginBottom: 14 }}>{icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: DARK_TEXT, marginBottom: 8 }}>{label}</h3>
              <p style={{ fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEO TEXT — white
      ══════════════════════════════════════════ */}
      <section style={{ background: WHITE, padding: "0 24px 52px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800, color: DARK_TEXT, lineHeight: 1.25,
            marginBottom: 18,
          }}>
            Download TikTok Videos Online — Free
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 20 }}>
            LulDown is a free TikTok downloader tool that helps you save TikTok videos without watermark
            in the highest quality MP4 format. No registration, no app needed — just paste the link and
            download instantly on any device.
          </p>
          <a href="#how-to" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 600, color: BLUE,
            textDecoration: "none",
          }}>
            Here's how it's done:
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW TO — dark navy again
      ══════════════════════════════════════════ */}
      <section id="how-to" style={{ background: DARK_BG2, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(1.25rem, 3.5vw, 1.6rem)",
            fontWeight: 800, color: WHITE, lineHeight: 1.3,
            marginBottom: 36,
          }}>
            How to download TikTok without watermark?
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {/* Number badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: BLUE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 15, color: WHITE,
                  boxShadow: `0 4px 14px rgba(79,110,247,0.4)`,
                }}>
                  {n}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: WHITE, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ — white
      ══════════════════════════════════════════ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem, 3vw, 1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            Frequently Asked Questions
          </h2>
          <div>
            {HOME_FAQS.map((item) => (
              <FAQItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
