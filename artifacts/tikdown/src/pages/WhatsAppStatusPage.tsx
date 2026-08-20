import { useEffect, useState } from "react";
import DownloaderBox from "@/components/DownloaderBox";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

const FEATURES = [
  {
    title: "No Watermark",
    desc: "Download the clean original video — no TikTok logo, no username overlay.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.35)",
  },
  {
    title: "720p Quality",
    desc: "Perfect resolution for WhatsApp Status — smooth playback, small file size.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.35)",
  },
  {
    title: "Instant Download",
    desc: "Video is ready in seconds — no waiting, no processing queue.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    bg: "rgba(79,110,247,0.1)", border: "rgba(79,110,247,0.35)",
  },
  {
    title: "iPhone & Android",
    desc: "Works in Safari and Chrome — downloaded video goes straight to your gallery.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.35)",
  },
];

const STEPS = [
  {
    title: "Open TikTok & Copy Link",
    desc: "Find the video you want. Tap the Share button → Copy Link. The link is now on your clipboard.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    title: "Paste & Download",
    desc: "Paste the link in the box above, tap Download Now. Choose MP4 720p — best size for WhatsApp Status.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    title: "Set as WhatsApp Status",
    desc: "Open WhatsApp → Status tab → pencil icon → Video → select your downloaded TikTok video. Done!",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
];

const FAQS = [
  {
    q: "What is the maximum video length for WhatsApp Status?",
    a: "WhatsApp Status supports videos up to 30 seconds long. If your TikTok video is longer, you may need to trim it before uploading.",
  },
  {
    q: "Which video format works best for WhatsApp Status?",
    a: "MP4 format works perfectly. Download the TikTok video as MP4 720p from Luldown — it's the ideal size and quality for WhatsApp Status.",
  },
  {
    q: "Why should I remove the TikTok watermark before posting as status?",
    a: "The TikTok watermark and username overlay look unprofessional on WhatsApp Status. Luldown downloads the clean original version without any overlay.",
  },
  {
    q: "Can I use TikTok audio/music as WhatsApp Status?",
    a: "Yes! Download the TikTok video as MP3 from Luldown, then set it as your WhatsApp voice status or use the audio with another video.",
  },
  {
    q: "Does this work on iPhone and Android?",
    a: "Yes. Luldown works in Safari (iPhone) and Chrome (Android). The downloaded video goes directly to your gallery, ready to use as WhatsApp Status.",
  },
];

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

export default function WhatsAppStatusPage() {
  useEffect(() => {
    document.title = "TikTok Video Download for WhatsApp Status — No Watermark | LulDown";

    const setMeta = (sel: string, attr: string, val: string) => {
      document.querySelector(sel)?.setAttribute(attr, val);
    };
    setMeta('meta[name="description"]',        "content", "Download TikTok videos without watermark and set them as WhatsApp Status. Free, fast, no app needed. Works on iPhone & Android.");
    setMeta('meta[property="og:title"]',       "content", "TikTok Video Download for WhatsApp Status — No Watermark | LulDown");
    setMeta('meta[property="og:description"]', "content", "Download TikTok videos without watermark and use them as your WhatsApp Status. 100% free.");
    setMeta('meta[name="twitter:title"]',      "content", "TikTok Video Download for WhatsApp Status — LulDown");
    setMeta('meta[name="twitter:description"]',"content", "Download TikTok videos without watermark for WhatsApp Status. Free & instant.");

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = "https://luldown.com/tiktok-for-whatsapp-status";

    const ld = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Download TikTok Video for WhatsApp Status",
      "description": "Download TikTok videos without watermark and set them as WhatsApp Status in 3 easy steps.",
      "totalTime": "PT1M",
      "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "0" },
      "tool": [{ "@type": "HowToTool", "name": "LulDown.com" }],
      "step": STEPS.map((s, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": s.title,
        "text": s.desc,
        "url": `https://luldown.com/tiktok-for-whatsapp-status#step-${i + 1}`,
      })),
    };
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
      <section style={{
        background: "linear-gradient(160deg, #16133a 0%, #1f1854 60%, #151230 100%)",
        position: "relative", overflow: "hidden",
        padding: "38px 24px 52px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 480, height: 480, background: "radial-gradient(ellipse at 50% 50%, rgba(120,40,220,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "160%", height: "160%", background: "radial-gradient(ellipse at 50% 50%, rgba(109,40,217,0.38) 0%, rgba(88,28,135,0.16) 45%, transparent 72%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "clamp(2rem,6vw,3rem)", fontWeight: 700, lineHeight: 1.05, color: "#ffffff", marginBottom: 2, letterSpacing: "-0.01em" }}>
            TikTok Video for
            <span style={{ display: "block", fontSize: "clamp(1.8rem,5.5vw,2.8rem)", lineHeight: 1.2, background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 50%, #25D366 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8, letterSpacing: "-0.01em" }}>
              WhatsApp Status
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, fontWeight: 400, lineHeight: 1.6 }}>
            Download any TikTok video without watermark and post it as your WhatsApp Status. Free, instant, no app needed.
          </p>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <DownloaderBox highlightFormat="mp4_720" />
          </div>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
            💡 Tip: Choose <strong style={{ color: "rgba(255,255,255,0.65)" }}>MP4 720p</strong> — best quality & size for WhatsApp Status
          </p>
          <div style={{ marginTop: 28, height: 52 }} />
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "32px 24px" }} className="features-grid-4">
          {FEATURES.map(({ title, desc, icon, bg, border }) => (
            <div key={title} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: bg, border: `2.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {icon}
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
            Why Remove the Watermark for WhatsApp Status?
          </h2>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            When you post a TikTok video with the watermark on WhatsApp Status, it looks messy — the TikTok logo and username overlay distract from the content. Your friends and family see the TikTok branding instead of enjoying your video.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75, marginBottom: 16 }}>
            Luldown downloads the <strong style={{ color: DARK_TEXT }}>clean original version</strong> — no logo, no overlay, no username. The video looks like your own content on WhatsApp Status, not a repost.
          </p>
          <p style={{ fontSize: 14.5, color: GRAY_TEXT, lineHeight: 1.75 }}>
            WhatsApp Status supports MP4 videos up to 30 seconds. Most TikTok videos fit perfectly. Download in 720p for the best balance of quality and file size.
          </p>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: DARK_BG2, padding: "52px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.2rem,3vw,1.55rem)", fontWeight: 800, color: WHITE, lineHeight: 1.3, marginBottom: 36 }}>
            How to Set TikTok Video as WhatsApp Status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {STEPS.map(({ title, desc, icon }, i) => (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }} id={`step-${i + 1}`}>
                <div style={{ position: "relative", flexShrink: 0, width: 68, height: 68 }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
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
      <section style={{ background: WHITE, padding: "52px 24px 64px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.2rem,3vw,1.5rem)", color: DARK_TEXT, marginBottom: 24 }}>
            Frequently Asked Questions
          </h2>
          {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

    </div>
  );
}
