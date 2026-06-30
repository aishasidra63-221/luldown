import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { useState } from "react";

const DARK_BG   = "#0d0b1f";
const DARK_BG2  = "#13112b";
const WHITE     = "#ffffff";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

/* ─── FAQ ────────────────────────────────────────────── */
const HOME_FAQS = [
  { q: "Is LulDown free to use?",              a: "Yes, 100% free. No subscription, no account, no hidden fees. You can download unlimited videos at no cost." },
  { q: "Is it safe to use?",                   a: "Completely safe. We don't store any personal data. Your history stays in your browser's local storage only." },
  { q: "Can I download TikTok videos on my mobile?", a: "Yes. LulDown is fully responsive and works on iPhone, Android, tablets, and all desktop browsers. No app needed." },
  { q: "Does it work for private videos?",     a: "No. Private videos are protected by TikTok and cannot be downloaded by any third-party tool." },
  { q: "Which formats are supported?",         a: "MP4 1080p (HD, no watermark), MP4 720p (standard), and MP3 192kbps audio only. Photo slideshows are fully supported too." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "18px 0", textAlign: "left",
        background: "transparent", border: "none", cursor: "pointer",
      }}>
        <span style={{ fontWeight: 600, fontSize: 14.5, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <div style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          border: `1.5px solid rgba(0,0,0,0.15)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: GRAY_TEXT,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {open ? <path d="M5 12h14" /> : <><path d="M12 5v14"/><path d="M5 12h14"/></>}
          </svg>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 0 18px", fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.7 }}>
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
    desc: "Get clean videos without the TikTok logo or watermark.",
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    n: "2",
    title: "Copy the Link",
    desc: "Tap Share → Copy Link. The TikTok URL is now in your clipboard ready to paste.",
    stepIcon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
  });

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        background: `linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)`,
        position: "relative", overflow: "hidden",
        padding: "52px 24px 52px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 480, height: 480, background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse at 50% 50%, rgba(100,50,200,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-10px", right: "-10px", opacity: 0.035, pointerEvents: "none", userSelect: "none", transform: "rotate(-5deg)" }}>
          <svg width="180" height="210" viewBox="0 0 90 100" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M62.5 0C63.8 13.2 71.6 21 85 22v14.5c-8.1 0.8-15.2-1.8-22.5-6.3V60c0 19.6-14.8 34-34.3 33.5C9.8 93 0 80.5 0 65.5 0 49.5 12 37 28.2 37c2.8 0 5.5 0.4 8 1.1V53c-2.3-0.8-4.8-1.2-7.3-1.2C18.5 51.8 12 58.2 12 66s6.5 14 14.7 14c8.5 0 14.8-6 14.8-14V0h21Z"/>
          </svg>
        </div>
        {[[8,15],[92,8],[18,72],[85,55],[45,5],[70,80],[30,45],[60,20],[15,90],[80,30],[50,65],[25,20],[75,70],[40,85],[65,40]].map(([x,y],i) => (
          <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: i%3===0?3:2, height: i%3===0?3:2, borderRadius: "50%", background: `rgba(255,255,255,${i%4===0?0.5:0.25})`, pointerEvents: "none" }} />
        ))}

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 800, lineHeight: 1.18, color: "#ffffff", marginBottom: 12, letterSpacing: "-0.02em" }}>
            TikTok Video Downloader
          </h1>
          <h1 style={{ fontSize: "clamp(1.8rem,5.5vw,2.8rem)", fontWeight: 800, lineHeight: 1.18, background: "linear-gradient(90deg,#4f6ef7 0%,#7c3aed 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 20, letterSpacing: "-0.02em" }}>
            Without Watermark
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, fontWeight: 400, lineHeight: 1.6 }}>
            Fast. Free. High Quality. No Registration.
          </p>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <DownloaderBox />
          </div>
          <div style={{ marginTop: 28, height: 52 }} />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section style={{ background: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "32px 40px" }} className="features-grid">
          {FEATURES.map(({ label, desc, icon }) => (
            <div key={label} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 18 }}>{icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: DARK_TEXT, marginBottom: 10, lineHeight: 1.3 }}>{label}</h3>
              <p style={{ fontSize: 14, color: GRAY_TEXT, lineHeight: 1.65, maxWidth: 220 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ SEO / INFO — 2 column ══════════ */}
      <section style={{ background: WHITE, padding: "0 24px 56px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 60px", alignItems: "center" }} className="seo-grid">
          {/* Left: text */}
          <div>
            <h2 style={{ fontSize: "clamp(1.35rem,3.5vw,1.85rem)", fontWeight: 800, color: DARK_TEXT, lineHeight: 1.25, marginBottom: 16 }}>
              Download TikTok Videos Online — Free
            </h2>
            <p style={{ fontSize: 14, color: GRAY_TEXT, lineHeight: 1.8, marginBottom: 22 }}>
              LulDown is a free TikTok downloader tool that helps you save TikTok videos without watermark
              in the highest quality MP4 format. No registration, no app needed — just paste the link and
              download instantly on any device.
            </p>
            <a href="#how-to" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: BLUE, textDecoration: "none" }}>
              Here's how it's done →
            </a>
          </div>

          {/* Right: phone mockup */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
            {/* Phone frame */}
            <div style={{
              width: 160, height: 300, borderRadius: 28,
              background: "linear-gradient(160deg,#1a1730 0%,#0d0b1f 100%)",
              border: "2.5px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 60px rgba(79,110,247,0.18), 0 8px 24px rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              {/* TikTok icon inside */}
              <div style={{ width: 54, height: 54, borderRadius: 14, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                <svg width="28" height="28" viewBox="0 0 90 100" fill="white">
                  <path d="M62.5 0C63.8 13.2 71.6 21 85 22v14.5c-8.1 0.8-15.2-1.8-22.5-6.3V60c0 19.6-14.8 34-34.3 33.5C9.8 93 0 80.5 0 65.5 0 49.5 12 37 28.2 37c2.8 0 5.5 0.4 8 1.1V53c-2.3-0.8-4.8-1.2-7.3-1.2C18.5 51.8 12 58.2 12 66s6.5 14 14.7 14c8.5 0 14.8-6 14.8-14V0h21Z"/>
                </svg>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.05em" }}>TikTok</div>

              {/* Screen shine */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg,rgba(255,255,255,0.04) 0%,transparent 100%)", borderRadius: "28px 28px 0 0" }} />
            </div>

            {/* Floating badge — MP4 */}
            <div style={{
              position: "absolute", top: "10%", right: "4%",
              background: "linear-gradient(135deg,#4f6ef7,#7c3aed)",
              borderRadius: 12, padding: "7px 13px",
              boxShadow: "0 8px 24px rgba(79,110,247,0.4)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>MP4</span>
            </div>

            {/* Floating badge — MP3 */}
            <div style={{
              position: "absolute", bottom: "15%", left: "2%",
              background: "linear-gradient(135deg,#06b6d4,#3b82f6)",
              borderRadius: 12, padding: "7px 13px",
              boxShadow: "0 8px 24px rgba(6,182,212,0.35)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>MP3</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW TO ══════════ */}
      <section id="how-to" style={{ background: DARK_BG2, padding: "56px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.25rem,3.5vw,1.6rem)", fontWeight: 800, color: WHITE, lineHeight: 1.3, marginBottom: 40 }}>
            How to download TikTok without watermark?
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {STEPS.map(({ n, title, desc, stepIcon }) => (
              <div key={n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {/* Dual icon: outer dark circle + number badge */}
                <div style={{ position: "relative", flexShrink: 0, width: 48, height: 48 }}>
                  {/* Dark icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {stepIcon}
                  </div>
                  {/* Number badge overlapping top-right */}
                  <div style={{
                    position: "absolute", top: -4, right: -4,
                    width: 20, height: 20, borderRadius: "50%",
                    background: BLUE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 10, color: WHITE,
                    boxShadow: `0 3px 10px rgba(79,110,247,0.5)`,
                    border: `2px solid ${DARK_BG2}`,
                  }}>
                    {n}
                  </div>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: WHITE, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section style={{ background: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 60px", alignItems: "start" }} className="faq-grid">

          {/* Left: accordion */}
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
              Frequently Asked Questions
            </h2>
            <div>
              {HOME_FAQS.map((item) => (
                <FAQItem key={item.q} {...item} />
              ))}
            </div>
          </div>

          {/* Right: decorative chat bubbles illustration */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>
              {/* Large bubble */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 180, height: 180, borderRadius: "50% 50% 10% 50%",
                background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                boxShadow: "0 20px 60px rgba(99,102,241,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="10" r="1" fill="rgba(255,255,255,0.8)"/>
                  <circle cx="12" cy="10" r="1" fill="rgba(255,255,255,0.8)"/>
                  <circle cx="15" cy="10" r="1" fill="rgba(255,255,255,0.8)"/>
                </svg>
              </div>
              {/* Small bubble */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                width: 90, height: 90, borderRadius: "50% 50% 50% 10%",
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                boxShadow: "0 10px 30px rgba(6,182,212,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Dot decoration */}
              <div style={{ position: "absolute", top: 50, right: 20, width: 10, height: 10, borderRadius: "50%", background: "#a855f7", opacity: 0.6 }} />
              <div style={{ position: "absolute", top: 30, right: 50, width: 6, height: 6, borderRadius: "50%", background: "#06b6d4", opacity: 0.5 }} />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
