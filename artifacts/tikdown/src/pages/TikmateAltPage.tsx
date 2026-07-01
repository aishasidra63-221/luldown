import { useEffect, useState } from "react";
import DownloaderBox from "@/components/DownloaderBox";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

const COMPARE = [
  { feature: "No Watermark",           luldown: true,  other: true  },
  { feature: "1080p HD Download",      luldown: true,  other: false },
  { feature: "MP3 Audio Extraction",   luldown: true,  other: true  },
  { feature: "Thumbnail Downloader",   luldown: true,  other: false },
  { feature: "Story Downloader",       luldown: true,  other: false },
  { feature: "No Ads / Pop-ups",       luldown: true,  other: false },
  { feature: "No App Install Needed",  luldown: true,  other: false },
  { feature: "PWA / Installable App",  luldown: true,  other: false },
  { feature: "10 Languages",           luldown: true,  other: false },
  { feature: "Online Viewer",          luldown: true,  other: false },
];

const FAQS = [
  { q: "Is LulDown a free TikMate alternative?",         a: "Yes. LulDown is 100% free — no app to install, no ads, no account needed. A much lighter alternative to TikMate." },
  { q: "What does LulDown do better than TikMate?",      a: "LulDown works entirely from your browser — no app download needed. It also offers 1080p HD, thumbnail downloading, story saver, online viewer, and 10-language support that TikMate lacks." },
  { q: "Do I need to install an app like TikMate?",      a: "No. LulDown works directly in any browser on iPhone, Android, PC or Mac. If you want an app-like experience, LulDown is a PWA you can install from your browser in one tap." },
  { q: "Is TikMate safe?",                               a: "App-based downloaders like TikMate require device permissions and may carry risks. LulDown is browser-based — nothing is installed, no permissions needed, fully transparent." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: open ? BLUE : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : GRAY_TEXT} strokeWidth="2.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {open && <div style={{ padding: "0 20px 16px", fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

export default function TikmateAltPage() {
  useEffect(() => {
    document.title = "Best TikMate Alternative 2025 — LulDown TikTok Downloader";

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',        "content", "Looking for a TikMate alternative? LulDown works in your browser — no app install. 1080p HD, MP3, thumbnails, stories. Free, ad-free, no login.");
    setMeta('meta[property="og:title"]',       "content", "Best TikMate Alternative — LulDown TikTok Downloader");
    setMeta('meta[property="og:description"]', "content", "LulDown vs TikMate — why LulDown is the best free TikTok downloader in 2025. No app needed.");
    setMeta('meta[name="twitter:title"]',      "content", "Best TikMate Alternative — LulDown");

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://luldown.com/tikmate-alternative";

    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    const ld = { "@context": "https://schema.org", "@type": "WebPage", "name": "TikMate Alternative — LulDown", "description": "LulDown vs TikMate comparison — the best free browser-based TikTok downloader alternative.", "url": "https://luldown.com/tikmate-alternative" };
    let script = document.getElementById("page-jsonld") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "page-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(ld);

    return () => {
      document.title = "LulDown — TikTok Downloader";
      document.getElementById("page-jsonld")?.remove();
    };
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ background: "linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)", position: "relative", overflow: "hidden", padding: "44px 24px 56px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 480, height: 480, background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(79,110,247,0.15)", border: "1px solid rgba(79,110,247,0.3)", borderRadius: 20, padding: "5px 16px", fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 18, letterSpacing: "0.05em" }}>
            TikMate ALTERNATIVE
          </div>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 6, letterSpacing: "-0.01em" }}>
            LulDown vs TikMate
          </h1>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14, letterSpacing: "-0.01em" }}>
            No App Needed. Browser-Based. Free.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            Unlike TikMate, LulDown requires zero app installation. Download TikTok videos in 1080p HD, extract MP3, save stories and thumbnails — all directly from your browser, completely free.
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox />
          </div>
          <div style={{ marginTop: 28, height: 28 }} />
        </div>
      </section>

      {/* ══ COMPARISON TABLE ══ */}
      <section style={{ background: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 800, color: DARK_TEXT, textAlign: "center", marginBottom: 8 }}>
            LulDown vs TikMate — Feature Comparison
          </h2>
          <p style={{ textAlign: "center", color: GRAY_TEXT, fontSize: 14.5, marginBottom: 36 }}>
            Here's why LulDown is the smarter TikMate alternative in 2025.
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: DARK_BG2, padding: "14px 20px" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Feature</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#a78bfa", textAlign: "center" }}>LulDown ✓</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>TikMate</span>
            </div>
            {COMPARE.map(({ feature, luldown, other }, i) => (
              <div key={feature} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", padding: "13px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", background: i % 2 === 0 ? "#ffffff" : "#fafafa", alignItems: "center" }}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: DARK_TEXT }}>{feature}</span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ color: luldown ? "#16a34a" : "#ef4444", fontWeight: 700, fontSize: 18 }}>{luldown ? "✓" : "✗"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ color: other ? "#16a34a" : "#ef4444", fontWeight: 700, fontSize: 18 }}>{other ? "✓" : "✗"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SEO CONTENT ══ */}
      <section style={{ background: "#f8f9fc", padding: "0 24px 56px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 700, color: DARK_TEXT, marginBottom: 18 }}>
            Why Choose LulDown over TikMate?
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            TikMate (tikmate.io) is an app-based TikTok downloader that requires users to download and install software on their device. In 2025, this approach is outdated — app installs ask for device permissions, take up storage, and carry security risks. If you're looking for a <strong>TikMate alternative</strong>, LulDown works directly in your browser with zero installation.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            LulDown is a browser-based PWA — meaning you get all the benefits of an app (fast, offline-ready, installable) without any of the risks. Just open luldown.com in Safari or Chrome, paste your TikTok URL, and download in seconds. No permissions, no storage used, no tracking.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            Feature-wise, LulDown goes far beyond TikMate: <strong>1080p full HD</strong> downloads, <strong>MP3 audio extraction</strong>, a dedicated <strong>Thumbnail Downloader</strong>, a <strong>TikTok Story Saver</strong>, and an integrated <strong>online viewer</strong>. All 10 supported languages have their own SEO pages — something no other TikTok downloader offers at this scale.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75 }}>
            Skip the app install. LulDown is the safest, fastest, most feature-rich <strong>TikMate alternative</strong> available. Paste any TikTok link above and download instantly — no sign-up, completely free.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            TikMate Alternative — FAQ
          </h2>
          {FAQS.map((item, i) => <FaqItem key={i} {...item} />)}
        </div>
      </section>

    </div>
  );
}
