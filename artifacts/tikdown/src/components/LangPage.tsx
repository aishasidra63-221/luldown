import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import DownloaderBox from "@/components/DownloaderBox";
import { T, PageTranslation } from "@/i18n/translations";
import { Lang, PageKey, LANG_META, ALL_LANGS, buildHreflangUrls, buildPageUrl, SITE_URL } from "@/i18n/langMeta";
import { DownloadFormat } from "@/lib/api";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

/* ── SEO effect: title, description, canonical, hreflang ── */
function useLangSEO(lang: Lang, pageKey: PageKey, tr: PageTranslation) {
  useEffect(() => {
    document.title = tr.metaTitle;

    const setMeta = (sel: string, attr: string, val: string) =>
      document.querySelector(sel)?.setAttribute(attr, val);

    setMeta('meta[name="description"]',       "content", tr.metaDescription);
    setMeta('meta[property="og:title"]',      "content", tr.metaTitle);
    setMeta('meta[property="og:description"]', "content", tr.metaDescription);
    setMeta('meta[name="twitter:title"]',     "content", tr.metaTitle);
    setMeta('meta[name="twitter:description"]', "content", tr.metaDescription);

    const pageUrl = buildPageUrl(lang, pageKey) || "/";
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_URL + pageUrl;

    const prev = document.querySelectorAll('link[rel="alternate"]');
    prev.forEach(el => el.remove());
    buildHreflangUrls(pageKey).forEach(({ hreflang, href }) => {
      const el = document.createElement("link");
      el.rel = "alternate";
      el.setAttribute("hreflang", hreflang);
      el.setAttribute("href", href);
      document.head.appendChild(el);
    });

    return () => {
      document.title = "LUL Downloader — Download TikTok Videos Free";
      document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());
    };
  }, [lang, pageKey, tr.metaTitle]);
}

/* ── FAQ accordion ── */
function FAQItem({ q, a }: { q: string; a: string }) {
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

/* ── Feature card icons ── */
const FEATURE_ICONS = [
  <svg key="f1" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="f2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  <svg key="f3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  <svg key="f4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
];

const FEATURE_BG = [
  { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.35)" },
  { bg: "rgba(6,182,212,0.1)",  border: "rgba(6,182,212,0.35)"  },
  { bg: "rgba(79,110,247,0.1)", border: "rgba(79,110,247,0.35)" },
  { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)" },
];

const STEP_ICONS = [
  <svg key="s1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  <svg key="s2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  <svg key="s3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
];

interface Props {
  lang: Lang;
  pageKey: PageKey;
  highlightFormat?: DownloadFormat;
}

export default function LangPage({ lang, pageKey, highlightFormat }: Props) {
  const tr = T[lang][pageKey];
  const meta = LANG_META[lang];
  const dir = meta.dir;

  useLangSEO(lang, pageKey, tr);

  const switchLang = (_targetLang: Lang) => {
    // URL navigation disabled — address bar stays on luldown.com
  };

  return (
    <div style={{ overflowX: "hidden" }} dir={dir}>

      {/* ══ HERO ══ */}
      <section style={{
        background: "linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)",
        position: "relative", overflow: "hidden",
        padding: "38px 24px 52px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 480, height: 480, background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.38) 0%, rgba(88,28,135,0.16) 45%, transparent 72%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 2, letterSpacing: "-0.01em" }}>
            {tr.h1Line1}
          </h1>
          <h1 style={{ fontSize: "clamp(1.8rem,5.5vw,2.8rem)", fontWeight: 700, lineHeight: 1.2, background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8, letterSpacing: "-0.01em" }}>
            {tr.h1Line2}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, fontWeight: 400, lineHeight: 1.6 }}>
            {tr.subheading}
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox highlightFormat={highlightFormat} />
          </div>
          <div style={{ marginTop: 28, height: 52 }} />
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "32px 24px" }} className="features-grid-4">
          {tr.features.map(({ title, desc }, i) => (
            <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: FEATURE_BG[i].bg, border: `2.5px solid ${FEATURE_BG[i].border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {FEATURE_ICONS[i]}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 18, color: DARK_TEXT, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 14, color: GRAY_TEXT, lineHeight: 1.65, maxWidth: 180 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SEO TEXT ══ */}
      <section style={{ background: WHITE, padding: "0 24px 52px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,1.9rem)", fontWeight: 700, color: DARK_TEXT, lineHeight: 1.25, marginBottom: 18 }}>
            {tr.seoH2}
          </h2>
          {tr.seoText.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>{para}</p>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: DARK_BG2, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.2rem,3vw,1.55rem)", fontWeight: 800, color: WHITE, lineHeight: 1.3, marginBottom: 36 }}>
            {tr.howItWorksTitle}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {tr.steps.map(({ title, desc }, i) => (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ position: "relative", flexShrink: 0, width: 68, height: 68 }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {STEP_ICONS[i]}
                  </div>
                  <div style={{ position: "absolute", top: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: WHITE, boxShadow: `0 3px 10px rgba(79,110,247,0.5)`, border: `2px solid ${DARK_BG2}` }}>
                    {i + 1}
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

      {/* ══ FAQ ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            {tr.faqTitle}
          </h2>
          {tr.faqs.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </section>

      {/* ══ LANGUAGE SWITCHER (bottom) ══ */}
      <section style={{ background: "#f1f5f9", padding: "24px", textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: 12, color: GRAY_TEXT, marginBottom: 10 }}>Available in:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {ALL_LANGS.map(l => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                background: l === lang ? BLUE : "transparent",
                color: l === lang ? "#fff" : GRAY_TEXT,
                borderColor: l === lang ? BLUE : "rgba(0,0,0,0.15)",
              }}
            >
              {LANG_META[l].nativeName}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
