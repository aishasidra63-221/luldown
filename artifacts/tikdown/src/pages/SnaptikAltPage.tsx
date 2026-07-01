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
  { feature: "No Login Required",      luldown: true,  other: true  },
  { feature: "PWA / Installable App",  luldown: true,  other: false },
  { feature: "10 Languages",           luldown: true,  other: false },
  { feature: "Online Viewer",          luldown: true,  other: false },
];

const FAQS = [
  { q: "Is LulDown a free SnapTik alternative?",          a: "Yes. LulDown is 100% free with no ads, no pop-ups, and no sign-up — a faster and cleaner experience than SnapTik." },
  { q: "What does LulDown offer that SnapTik doesn't?",   a: "LulDown provides 1080p HD downloads, thumbnail downloading, story downloader, an online TikTok viewer, multilingual support (10 languages), and a PWA installable app — none of which SnapTik offers." },
  { q: "Is LulDown safe to use instead of SnapTik?",      a: "Yes. LulDown runs on Cloudflare's global network, stores zero files on servers, and keeps your history only in your browser's localStorage." },
  { q: "Does SnapTik work on iPhone?",                    a: "SnapTik has limited iPhone support. LulDown works seamlessly on all iOS and Android devices directly from the browser — no app needed." },
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

export default function SnaptikAltPage() {
  useEffect(() => {
    document.title = "Best SnapTik Alternative 2025 — LulDown TikTok Downloader";

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',        "content", "Looking for a SnapTik alternative? LulDown is faster, cleaner, ad-free — with 1080p HD, thumbnails, stories, MP3 and 10 languages. 100% free.");
    setMeta('meta[property="og:title"]',       "content", "Best SnapTik Alternative — LulDown TikTok Downloader");
    setMeta('meta[property="og:description"]', "content", "LulDown vs SnapTik — why LulDown is the best free TikTok downloader in 2025.");
    setMeta('meta[name="twitter:title"]',      "content", "Best SnapTik Alternative — LulDown");

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://luldown.com/snaptik-alternative";

    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    const ld = { "@context": "https://schema.org", "@type": "WebPage", "name": "SnapTik Alternative — LulDown", "description": "LulDown vs SnapTik comparison — the best free TikTok downloader alternative.", "url": "https://luldown.com/snaptik-alternative" };
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
            SnapTik ALTERNATIVE
          </div>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 6, letterSpacing: "-0.01em" }}>
            LulDown vs SnapTik
          </h1>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14, letterSpacing: "-0.01em" }}>
            The Better Free TikTok Downloader
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            LulDown gives you everything SnapTik offers — plus 1080p HD, thumbnail downloads, story downloader, multilingual support, no ads, and a PWA you can install on your phone.
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
            LulDown vs SnapTik — Feature Comparison
          </h2>
          <p style={{ textAlign: "center", color: GRAY_TEXT, fontSize: 14.5, marginBottom: 36 }}>
            Here's why thousands of users switched from SnapTik to LulDown.
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: DARK_BG2, padding: "14px 20px" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Feature</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#a78bfa", textAlign: "center" }}>LulDown ✓</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>SnapTik</span>
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
            Why Switch from SnapTik to LulDown?
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            SnapTik has been a widely used TikTok downloader, but in 2025 it shows significant shortcomings: heavy ads, no 1080p HD support, no thumbnail downloader, and no story saving. If you're searching for a <strong>SnapTik alternative</strong>, LulDown was built to solve exactly those problems.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            LulDown runs on Cloudflare's global edge network — delivering faster speeds and higher reliability than SnapTik's servers. Your downloads go directly from TikTok's CDN to your device; LulDown never stores your files, keeping everything private.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            A key advantage over SnapTik is LulDown's <strong>1080p HD download</strong> — SnapTik caps at lower resolutions. LulDown also includes a <strong>TikTok Thumbnail Downloader</strong>, a <strong>Story Downloader</strong>, an online <strong>TikTok Viewer</strong>, and full <strong>MP3 extraction</strong> — all for free.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75 }}>
            The verdict: if you need a free, fast, ad-free <strong>SnapTik alternative</strong> with more features and better performance — LulDown is the answer. Paste any TikTok link above and experience the difference instantly.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            SnapTik Alternative — FAQ
          </h2>
          {FAQS.map((item, i) => <FaqItem key={i} {...item} />)}
        </div>
      </section>

    </div>
  );
}
