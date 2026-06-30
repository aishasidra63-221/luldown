import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

/* ─── Colors ──────────────────────────────────────────── */
const DARK_BG   = "#0d0b1f";
const DARK_BG2  = "#1a1730";
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
/* ── Icon circle helper ───────────────────── */
function IconCircle({ color, bg, border, children }: {
  color: string; bg: string; border: string; children: React.ReactNode
}) {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      background: bg,
      border: `2.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

const FEATURES = [
  {
    label: "Unlimited Download",
    desc:  "Download as many TikTok videos as you want — no limits.",
    icon: (
      <IconCircle color="#c084fc" bg="rgba(192,132,252,0.1)" border="rgba(192,132,252,0.45)">
        {/* Infinity — stroke SVG with gradient */}
        <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="infGrad" x1="0" y1="0" x2="48" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7"/>
              <stop offset="100%" stopColor="#ec4899"/>
            </linearGradient>
          </defs>
          <path
            d="M24 15 C24 15 20 6 13 6 C8 6 3 10 3 15 C3 20 8 24 13 24 C20 24 24 15 24 15 C24 15 28 6 35 6 C40 6 45 10 45 15 C45 20 40 24 35 24 C28 24 24 15 24 15 Z"
            stroke="url(#infGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </IconCircle>
    ),
  },
  {
    label: "No Watermark",
    desc:  "Clean videos without the TikTok logo or watermark.",
    icon: (
      <IconCircle color="#ef4444" bg="rgba(239,68,68,0.1)" border="rgba(239,68,68,0.4)">
        {/* Prohibition / no symbol — outer ring + diagonal slash */}
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2"/>
          <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </IconCircle>
    ),
  },
  {
    label: "MP4 & MP3",
    desc:  "Save in HD video or extract audio as MP3 instantly.",
    icon: (
      <IconCircle color="#6366f1" bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.4)">
        {/* Single music note */}
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
          <path d="M9 18V5l12-2v13" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="18" r="3" fill="rgba(129,140,248,0.25)" stroke="#818cf8" strokeWidth="2"/>
          <circle cx="18" cy="16" r="3" fill="rgba(129,140,248,0.25)" stroke="#818cf8" strokeWidth="2"/>
        </svg>
      </IconCircle>
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
          HERO — dark space
      ══════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)`,
        position: "relative",
        overflow: "hidden",
        padding: "52px 24px 52px",
        textAlign: "center",
      }}>

        {/* Purple glow — left */}
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 480, height: 480,
          background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Purple glow — center top */}
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse at 50% 50%, rgba(100,50,200,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* TikTok musical-note watermark — top right */}
        <div style={{
          position: "absolute", top: "-10px", right: "-10px",
          opacity: 0.035, pointerEvents: "none", userSelect: "none",
          transform: "rotate(-5deg)",
        }}>
          <svg width="180" height="210" viewBox="0 0 90 100" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M62.5 0C63.8 13.2 71.6 21 85 22v14.5c-8.1 0.8-15.2-1.8-22.5-6.3V60c0 19.6-14.8 34-34.3 33.5C9.8 93 0 80.5 0 65.5 0 49.5 12 37 28.2 37c2.8 0 5.5 0.4 8 1.1V53c-2.3-0.8-4.8-1.2-7.3-1.2C18.5 51.8 12 58.2 12 66s6.5 14 14.7 14c8.5 0 14.8-6 14.8-14V0h21Z"/>
          </svg>
        </div>

        {/* Scattered stars/dots */}
        {[
          [8,15],[92,8],[18,72],[85,55],[45,5],[70,80],[30,45],[60,20],[15,90],[80,30],
          [50,65],[25,20],[75,70],[40,85],[65,40]
        ].map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            borderRadius: "50%",
            background: `rgba(255,255,255,${i % 4 === 0 ? 0.5 : 0.25})`,
            pointerEvents: "none",
          }} />
        ))}

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

          {/* Ad slot space preserved */}
          <div style={{ marginTop: 28, height: 52 }} />
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
            <div key={label} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 24, color: DARK_TEXT, marginBottom: 10, lineHeight: 1.3 }}>{label}</h3>
              <p style={{ fontSize: 15.5, color: GRAY_TEXT, lineHeight: 1.65, maxWidth: 220 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SEO TEXT — white
      ══════════════════════════════════════════ */}
      <section style={{ background: WHITE, padding: "0 24px 52px" }}>
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
