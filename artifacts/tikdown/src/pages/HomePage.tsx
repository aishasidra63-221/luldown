import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { useState } from "react";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

/* ─── FAQ ────────────────────────────────────────────── */
const HOME_FAQS = [
  { q: "Is Luldown free to use?",                         a: "Yes, 100% free. No subscription, no account, no hidden fees. You can download unlimited videos at no cost." },
  { q: "Do I need to install an extension or app?",       a: "No installation needed. Luldown works entirely in your browser — just paste the TikTok link and download. No extensions, no apps, no plugins." },
  { q: "Do I need a TikTok account to download videos?",  a: "No account required. You can download any public TikTok video without logging in or creating an account." },
  { q: "What formats are available?",                     a: "MP4 1080p (HD, no watermark), MP4 720p (standard, no watermark), and MP3 192kbps (audio only). Photo slideshows show all images directly." },
  { q: "Why is the video without a watermark?",           a: "TikTok stores two versions of every video — one with a watermark (shown in the app) and one clean original file. Luldown fetches the clean version directly." },
  { q: "How to download TikTok videos on iPhone (iOS)?",  a: "Open TikTok, tap Share → Copy Link. Then open Luldown in Safari, paste the link and tap Download. Long-press the download link and choose 'Download Linked File' to save to your Photos." },
  { q: "How to download TikTok videos on Android?",       a: "Copy the TikTok link from the Share menu, open Luldown in Chrome, paste and tap Download. The file will save to your Downloads folder automatically." },
  { q: "Can I download videos from private TikTok accounts?", a: "No. Luldown can only download videos from public TikTok accounts. Private account videos are not accessible without the account owner's permission." },
  { q: "Where are TikTok videos saved after downloading?", a: "On desktop, files go to your browser's Downloads folder. On iPhone, use 'Download Linked File' in Safari to save to the Files app. On Android, files save to the Downloads folder." },
  { q: "Is my data safe?",                                a: "Your download history is stored only in your browser — it never leaves your device. We don't collect or store any personal data on our servers." },
  { q: "Does it work on mobile?",                         a: "Yes. Luldown is fully responsive and works on iPhone, Android, tablets, and all desktop browsers. No app installation needed." },
  { q: "Why does the download open in a new tab?",        a: "This is a browser security restriction for cross-origin files. On desktop, right-click and choose 'Save As'. On mobile, long-press and tap 'Save'." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      marginBottom: 10,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "16px 20px", textAlign: "left",
        background: "transparent", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          background: open ? BLUE : "rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : GRAY_TEXT} strokeWidth="2.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── Feature icon circles ─────────────────────────── */
function IconCircle({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      background: bg, border: `2.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

const FEATURES = [
  {
    label: "Unlimited Download",
    desc: "Download as many TikTok videos as you want — no limits.",
    icon: (
      <IconCircle bg="rgba(192,132,252,0.1)" border="rgba(192,132,252,0.45)">
        <svg width="48" height="30" viewBox="0 0 48 30" fill="none">
          <defs>
            <linearGradient id="infGrad" x1="0" y1="0" x2="48" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#ec4899"/>
            </linearGradient>
          </defs>
          <path d="M24 15 C24 15 20 6 13 6 C8 6 3 10 3 15 C3 20 8 24 13 24 C20 24 24 15 24 15 C24 15 28 6 35 6 C40 6 45 10 45 15 C45 20 40 24 35 24 C28 24 24 15 24 15 Z"
            stroke="url(#infGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </IconCircle>
    ),
  },
  {
    label: "No Watermark",
    desc: "Clean videos without the TikTok logo or watermark.",
    icon: (
      <IconCircle bg="rgba(239,68,68,0.1)" border="rgba(239,68,68,0.4)">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2"/>
          <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </IconCircle>
    ),
  },
  {
    label: "MP4 & MP3",
    desc: "Save in HD video or extract audio as MP3 instantly.",
    icon: (
      <IconCircle bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.4)">
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
    desc: "Open the TikTok app and find the video you want to save. Play it to confirm it's the right one.",
    stepIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    n: "2",
    title: "Copy the Link",
    desc: "Tap Share → Copy Link. The TikTok URL is now in your clipboard ready to paste.",
    stepIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    n: "3",
    title: "Paste & Download",
    desc: "Come to LulDown, paste the link in the box above and click Download. Your video saves in seconds.",
    stepIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

const HOME_FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": HOME_FAQS.slice(0, 6).map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": { "@type": "Answer", "text": item.a },
  })),
};

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
    jsonLd: HOME_FAQ_JSONLD,
  });

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        background: `linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)`,
        position: "relative", overflow: "hidden",
        padding: "38px 24px 52px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 480, height: 480, background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse at 50% 50%, rgba(100,50,200,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.38) 0%, rgba(88,28,135,0.16) 45%, transparent 72%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 2, letterSpacing: "-0.01em" }}>
            TikTok Video Downloader
          </h1>
          <h1 style={{ fontSize: "clamp(1.8rem,5.5vw,2.8rem)", fontWeight: 700, lineHeight: 1.2, color: "#ffffff", WebkitTextStroke: "1.5px rgba(255,255,255,0.9)", marginBottom: 8, letterSpacing: "-0.01em" }}>
            No Watermark
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, fontWeight: 400, lineHeight: 1.6, transition: "none" }}>
            Fast. Free. High Quality. No Registration.
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox />
          </div>
          <div style={{ marginTop: 28, height: 52 }} />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px 40px" }} className="features-grid">
          {FEATURES.map(({ label, desc, icon }) => (
            <div key={label} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 16 }}>{icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 24, color: DARK_TEXT, marginBottom: 10, lineHeight: 1.3 }}>{label}</h3>
              <p style={{ fontSize: 15.5, color: GRAY_TEXT, lineHeight: 1.65, maxWidth: 220 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ SEO TEXT ══════════ */}
      <section style={{ background: WHITE, padding: "0 24px 52px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 700, color: DARK_TEXT, lineHeight: 1.25, marginBottom: 18, fontFamily: "'Poppins', sans-serif" }}>
            Download TikTok Videos Online — Free
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 20 }}>
            LulDown is a free TikTok downloader tool that helps you save TikTok videos without watermark
            in the highest quality MP4 format. No registration, no app needed — just paste the link and
            download instantly on any device.
          </p>
          <a href="#how-to" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: BLUE, textDecoration: "none" }}>
            Here's how it's done:
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ══════════ HOW TO ══════════ */}
      <section id="how-to" style={{ background: DARK_BG2, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.25rem,3.5vw,1.6rem)", fontWeight: 800, color: WHITE, lineHeight: 1.3, marginBottom: 36 }}>
            How to download TikTok without watermark?
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {STEPS.map(({ n, title, desc, stepIcon }) => (
              <div key={n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ position: "relative", flexShrink: 0, width: 68, height: 68 }}>
                  <div style={{
                    width: 62, height: 62, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {stepIcon}
                  </div>
                  <div style={{
                    position: "absolute", top: -2, right: -2,
                    width: 22, height: 22, borderRadius: "50%",
                    background: BLUE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 11, color: WHITE,
                    boxShadow: `0 3px 10px rgba(79,110,247,0.5)`,
                    border: `2px solid ${DARK_BG2}`,
                  }}>
                    {n}
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: WHITE, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            Frequently Asked Questions
          </h2>
          <div>
            {HOME_FAQS.slice(0, 6).map((item) => (
              <FAQItem key={item.q} {...item} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="/faq" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "11px 28px", borderRadius: 12,
              background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              textDecoration: "none", cursor: "pointer",
            }}>
              More FAQs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
