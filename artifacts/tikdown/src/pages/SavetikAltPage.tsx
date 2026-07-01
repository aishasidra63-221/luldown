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
  { q: "Is LulDown a free SaveTik alternative?",          a: "Yes. LulDown is 100% free — no subscription, no account, no ads. A far cleaner experience than SaveTik." },
  { q: "What makes LulDown better than SaveTik?",         a: "LulDown offers 1080p HD, thumbnail downloading, story saver, online viewer, 10 language support, and a PWA — none of which SaveTik provides." },
  { q: "Is SaveTik safe to use?",                         a: "SaveTik has reported ad pop-ups and redirects. LulDown runs on Cloudflare with zero third-party ad scripts, keeping your browsing safe and fast." },
  { q: "Can I use LulDown on my phone instead of SaveTik?", a: "Absolutely. LulDown works on all iOS and Android browsers and can be installed as a PWA — no app store download required." },
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

export default function SavetikAltPage() {
  useEffect(() => {
    document.title = "Best SaveTik Alternative 2025 — LulDown TikTok Downloader";

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',        "content", "Looking for a SaveTik alternative? LulDown is faster, cleaner, ad-free — with 1080p HD, thumbnails, stories, MP3 and 10 languages. 100% free.");
    setMeta('meta[property="og:title"]',       "content", "Best SaveTik Alternative — LulDown TikTok Downloader");
    setMeta('meta[property="og:description"]', "content", "LulDown vs SaveTik — why LulDown is the best free TikTok downloader in 2025.");
    setMeta('meta[name="twitter:title"]',      "content", "Best SaveTik Alternative — LulDown");

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://luldown.com/savetik-alternative";

    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    const ld = { "@context": "https://schema.org", "@type": "WebPage", "name": "SaveTik Alternative — LulDown", "description": "LulDown vs SaveTik comparison — the best free TikTok downloader alternative.", "url": "https://luldown.com/savetik-alternative" };
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
            SaveTik ALTERNATIVE
          </div>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 6, letterSpacing: "-0.01em" }}>
            LulDown vs SaveTik
          </h1>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14, letterSpacing: "-0.01em" }}>
            The Better Free TikTok Downloader
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            LulDown does everything SaveTik does — plus 1080p HD, thumbnail downloads, story saver, multilingual support, zero ads, and an installable PWA app.
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
            LulDown vs SaveTik — Feature Comparison
          </h2>
          <p style={{ textAlign: "center", color: GRAY_TEXT, fontSize: 14.5, marginBottom: 36 }}>
            Here's why users are switching from SaveTik to LulDown.
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: DARK_BG2, padding: "14px 20px" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Feature</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#a78bfa", textAlign: "center" }}>LulDown ✓</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>SaveTik</span>
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
            Why Switch from SaveTik to LulDown?
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            SaveTik (savetik.net / savetik.app) attracts users looking for a quick TikTok video saver, but its ad-heavy experience and missing features make it frustrating to use in 2025. If you need a <strong>SaveTik alternative</strong>, LulDown delivers a superior experience across every metric.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            LulDown is built on Cloudflare's global network — zero ad pop-ups, no redirects, no tracking. Just paste your TikTok link and get a direct download in seconds. Your data never touches LulDown's servers — downloads go straight from TikTok's CDN to your device.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            Compared to SaveTik, LulDown uniquely offers <strong>1080p full HD video</strong>, a <strong>TikTok Thumbnail Downloader</strong>, a <strong>Story Saver</strong>, and a built-in <strong>TikTok Online Viewer</strong> — plus full MP3 audio extraction. All features are free with no account required.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75 }}>
            Ready to upgrade? LulDown is the best <strong>SaveTik alternative</strong> in 2025. Paste any TikTok URL in the box above — no sign-up, no ads, instant download.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            SaveTik Alternative — FAQ
          </h2>
          {FAQS.map((item, i) => <FaqItem key={i} {...item} />)}
        </div>
      </section>

    </div>
  );
}
