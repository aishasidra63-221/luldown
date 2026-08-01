import { useEffect, useState } from "react";
import DownloaderBox from "@/components/DownloaderBox";

const DARK_BG  = "linear-gradient(160deg, #1a1012 0%, #2a0f0f 60%, #1a0a0a 100%)";
const WHITE    = "#F8F8FC";
const RED      = "#ef4444";
const GREEN    = "#16a34a";
const BLUE     = "#4f6ef7";
const GRAY     = "#6b7280";
const DARK     = "#111827";

export interface NotWorkingConfig {
  competitor:   string;     // "SnapTik"
  domain:       string;     // "snaptik.app"
  slug:         string;     // "snaptik-not-working"
  reasons:      string[];   // common reasons it breaks
  faqs:         { q: string; a: string }[];
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK, lineHeight: 1.4 }}>{q}</span>
        <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: open ? BLUE : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : GRAY} strokeWidth="2.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {open && <div style={{ padding: "0 20px 16px", fontSize: 13.5, color: GRAY, lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

export default function NotWorkingPage({ cfg }: { cfg: NotWorkingConfig }) {
  useEffect(() => {
    const { competitor, domain, slug } = cfg;
    document.title = `${competitor} Not Working? Use LulDown Instead — Free TikTok Downloader`;

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',        "content", `${competitor} (${domain}) not working today? LulDown is up and running right now — download TikTok videos without watermark, free, instant. No sign-up needed.`);
    setMeta('meta[property="og:title"]',       "content", `${competitor} Not Working? Try LulDown — Free TikTok Downloader`);
    setMeta('meta[property="og:description"]', "content", `${competitor} down or broken? Switch to LulDown instantly — faster, ad-free, 1080p HD TikTok downloads.`);
    setMeta('meta[name="twitter:title"]',      "content", `${competitor} Not Working? LulDown Works Right Now`);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = `https://luldown.com/${slug}`;
    document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

    const ld = {
      "@context": "https://schema.org", "@type": "FAQPage",
      "name": `${competitor} Not Working — Use LulDown Instead`,
      "url": `https://luldown.com/${slug}`,
      "mainEntity": cfg.faqs.map(f => ({
        "@type": "Question", "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    };
    let script = document.getElementById("page-jsonld") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "page-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(ld);

    return () => { document.title = "LulDown — TikTok Downloader"; document.getElementById("page-jsonld")?.remove(); };
  }, []);

  const { competitor, domain } = cfg;

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ══ HERO ══ */}
      <section style={{ background: DARK_BG, position: "relative", overflow: "hidden", padding: "44px 24px 56px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(220,40,40,0.22) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>

          {/* Status badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#fca5a5" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: RED, display: "inline-block" }} />
              {competitor} — Issues Reported
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.35)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#86efac" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
              LulDown — Fully Operational ✓
            </div>
          </div>

          <h1 style={{ fontSize: "clamp(1.9rem,5.5vw,2.9rem)", fontWeight: 800, lineHeight: 1.1, color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em" }}>
            {competitor} Not Working?
          </h1>
          <h2 style={{ fontSize: "clamp(1.3rem,3.5vw,2rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg,#7c3aed,#4f6ef7,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14 }}>
            LulDown Is Up Right Now — Download Instantly
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            {competitor} ({domain}) down or broken today? LulDown is a free TikTok downloader that works right now — no watermark, 1080p HD, no ads, no login.
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox />
          </div>
          <div style={{ marginTop: 28, height: 20 }} />
        </div>
      </section>

      {/* ══ WHY NOT WORKING ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 800, color: DARK, marginBottom: 8, textAlign: "center" }}>
            Why Is {competitor} Not Working?
          </h2>
          <p style={{ textAlign: "center", color: GRAY, fontSize: 14.5, marginBottom: 32 }}>
            Common reasons {competitor} breaks down:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cfg.reasons.map((reason, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: RED, fontSize: 13, fontWeight: 800 }}>!</span>
                </div>
                <p style={{ fontSize: 14, color: DARK, lineHeight: 1.6, margin: 0 }}>{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY LULDOWN ══ */}
      <section style={{ background: "#f8f9fc", padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 800, color: DARK, marginBottom: 18 }}>
            Use LulDown Instead of {competitor}
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY, lineHeight: 1.75, marginBottom: 16 }}>
            LulDown is a <strong>free TikTok video downloader</strong> that runs on Cloudflare's global edge network — it's fast, reliable, and never goes down due to server limits. Unlike {competitor}, LulDown has <strong>no ads, no pop-ups, and no sign-up required</strong>.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY, lineHeight: 1.75, marginBottom: 16 }}>
            Key advantages over {competitor}: <strong>1080p HD downloads</strong>, <strong>MP3 audio extraction</strong>, <strong>TikTok Thumbnail Downloader</strong>, <strong>Story Downloader</strong>, and an <strong>online TikTok Viewer</strong> — all free, all in one place.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY, lineHeight: 1.75 }}>
            When {competitor} is down, thousands of users switch to LulDown. Try it now — paste any TikTok link above and your file downloads instantly.
          </p>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK, marginBottom: 24 }}>
            {competitor} Not Working — FAQ
          </h2>
          {cfg.faqs.map((item, i) => <FaqItem key={i} {...item} />)}
        </div>
      </section>

    </div>
  );
}
