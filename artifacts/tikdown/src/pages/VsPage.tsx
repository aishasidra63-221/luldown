import { useEffect, useState } from "react";
import DownloaderBox from "@/components/DownloaderBox";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

const ALL_FEATURES = [
  "No Watermark",
  "1080p HD Download",
  "MP3 Audio Extraction",
  "Thumbnail Downloader",
  "Story Downloader",
  "No Ads / Pop-ups",
  "No Login Required",
  "PWA / Installable App",
  "18+ Languages",
  "Online Viewer",
];

export interface VsConfig {
  competitor:    string;    // "SnapTik"
  domain:        string;    // "snaptik.app"
  slug:          string;    // "snaptik-vs-luldown"
  otherHas:      string[];  // features competitor DOES have
  description:   string[];  // 3 content paragraphs
  faqs:          { q: string; a: string }[];
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: open ? BLUE : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : GRAY_TEXT} strokeWidth="2.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {open && <div style={{ padding: "0 20px 16px", fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

export default function VsPage({ cfg }: { cfg: VsConfig }) {
  useEffect(() => {
    const { competitor, domain, slug } = cfg;
    document.title = `LulDown vs ${competitor} — Which TikTok Downloader is Better? (2025)`;

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',        "content", `LulDown vs ${competitor} (${domain}) — full comparison. LulDown wins on 1080p HD, no ads, story downloader, thumbnail saver, and 18 languages. 100% free.`);
    setMeta('meta[property="og:title"]',       "content", `LulDown vs ${competitor} — Best Free TikTok Downloader 2025`);
    setMeta('meta[property="og:description"]', "content", `Comparing LulDown and ${competitor} — which TikTok downloader is faster, safer, and more feature-rich in 2025?`);
    setMeta('meta[name="twitter:title"]',      "content", `LulDown vs ${competitor} — TikTok Downloader Comparison`);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `https://luldown.com/${slug}`;
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    const ld = {
      "@context": "https://schema.org", "@type": "WebPage",
      "name": `LulDown vs ${competitor} — TikTok Downloader Comparison`,
      "description": `Detailed comparison of LulDown and ${competitor}. Find the best free TikTok downloader in 2025.`,
      "url": `https://luldown.com/${slug}`,
    };
    let script = document.getElementById("page-jsonld") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "page-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(ld);

    return () => { document.title = "LulDown — TikTok Downloader"; document.getElementById("page-jsonld")?.remove(); };
  }, []);

  const { competitor } = cfg;
  const otherSet = new Set(cfg.otherHas);

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ background: "linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)", position: "relative", overflow: "hidden", padding: "44px 24px 56px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.38) 0%, rgba(88,28,135,0.16) 45%, transparent 72%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(79,110,247,0.15)", border: "1px solid rgba(79,110,247,0.3)", borderRadius: 20, padding: "5px 16px", fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 18, letterSpacing: "0.05em" }}>
            HEAD-TO-HEAD COMPARISON
          </div>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 800, lineHeight: 1.05, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>
            LulDown vs {competitor}
          </h1>
          <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg,#7c3aed,#4f6ef7,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14 }}>
            Which TikTok Downloader Wins in 2025?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            We compared LulDown and {competitor} across every feature that matters — speed, quality, privacy, ads, and formats. Here's the full breakdown.
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox />
          </div>
          <div style={{ marginTop: 28, height: 20 }} />
        </div>
      </section>

      {/* ══ COMPARISON TABLE ══ */}
      <section style={{ background: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 800, color: DARK_TEXT, textAlign: "center", marginBottom: 8 }}>
            LulDown vs {competitor} — Full Feature Comparison
          </h2>
          <p style={{ textAlign: "center", color: GRAY_TEXT, fontSize: 14.5, marginBottom: 36 }}>
            Every feature compared side by side — decide for yourself.
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", background: DARK_BG2, padding: "14px 20px" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Feature</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#a78bfa", textAlign: "center" }}>LulDown ✓</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{competitor}</span>
            </div>
            {ALL_FEATURES.map((feature, i) => {
              const otherHas = otherSet.has(feature);
              return (
                <div key={feature} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", padding: "13px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", background: i % 2 === 0 ? "#fff" : "#fafafa", alignItems: "center" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: DARK_TEXT }}>{feature}</span>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 18 }}>✓</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ color: otherHas ? "#16a34a" : "#ef4444", fontWeight: 700, fontSize: 18 }}>{otherHas ? "✓" : "✗"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ SEO CONTENT ══ */}
      <section style={{ background: "#f8f9fc", padding: "0 24px 56px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 700, color: DARK_TEXT, marginBottom: 18 }}>
            LulDown vs {competitor} — The Verdict
          </h2>
          {cfg.description.map((para, i) => (
            <p key={i} style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: para }} />
          ))}
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            LulDown vs {competitor} — FAQ
          </h2>
          {cfg.faqs.map((item, i) => <FaqItem key={i} {...item} />)}
        </div>
      </section>

    </div>
  );
}
