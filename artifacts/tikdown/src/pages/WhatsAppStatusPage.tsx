import { useEffect, useState } from "react";
import DownloaderBox from "@/components/DownloaderBox";

const DARK_BG2  = "#1a1730";
const WHITE     = "#F8F8FC";
const BLUE      = "#4f6ef7";
const GRAY_TEXT = "#6b7280";
const DARK_TEXT = "#111827";

const STEPS = [
  {
    num: "1",
    title: "Open TikTok & Copy Link",
    desc: "Find the video you want. Tap the Share button → Copy Link. The link is now on your clipboard.",
  },
  {
    num: "2",
    title: "Paste & Download on Luldown",
    desc: "Come back here, paste the link in the box above, tap Download Now. Pick MP4 720p (best size for WhatsApp Status).",
  },
  {
    num: "3",
    title: "Save to Phone",
    desc: "The video downloads to your phone without any TikTok watermark or logo.",
  },
  {
    num: "4",
    title: "Set as WhatsApp Status",
    desc: "Open WhatsApp → Status tab → tap the pencil icon → Video → select your downloaded TikTok video. Done!",
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#ffffff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 10, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: DARK_TEXT, lineHeight: 1.4 }}>{q}</span>
        <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: open ? BLUE : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "#fff" : GRAY_TEXT} strokeWidth="2.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            <path d="M6 9l6 6 6-6" />
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
      "description": "Download TikTok videos without watermark and set them as WhatsApp Status in 4 easy steps.",
      "step": STEPS.map((s, i) => ({
        "@type": "HowToStep",
        "position": i + 1,
        "name": s.title,
        "text": s.desc,
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
    <div style={{ background: WHITE, minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)",
        padding: "52px 24px 56px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>📲</span>
          <h1 style={{ margin: 0, fontSize: "clamp(22px,5vw,34px)", fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
            TikTok Video for <span style={{ color: "#25D366" }}>WhatsApp Status</span>
          </h1>
        </div>
        <p style={{ margin: "0 auto 28px", maxWidth: 560, fontSize: 15.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
          Download any TikTok video <strong style={{ color: "#fff" }}>without watermark</strong> and post it as your WhatsApp Status. Free, instant, no app needed.
        </p>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <DownloaderBox highlightFormat="mp4_720" />
        </div>
        <p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
          💡 Tip: Choose <strong style={{ color: "rgba(255,255,255,0.65)" }}>MP4 720p</strong> — best quality & size for WhatsApp Status
        </p>
      </div>

      {/* ── 4 Steps ── */}
      <div style={{ background: WHITE, padding: "52px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, color: DARK_TEXT, marginBottom: 8 }}>
            4 Steps to Set TikTok as WhatsApp Status
          </h2>
          <p style={{ textAlign: "center", color: GRAY_TEXT, fontSize: 14.5, marginBottom: 36 }}>
            From TikTok to WhatsApp Status in under a minute
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{
                display: "flex", alignItems: "flex-start", gap: 16,
                background: "#fff", borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                padding: "20px 22px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #7c3aed, #4f6ef7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16, color: "#fff",
                }}>
                  {step.num}
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: DARK_TEXT }}>{step.title}</p>
                  <p style={{ margin: 0, fontSize: 13.5, color: GRAY_TEXT, lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why no watermark ── */}
      <div style={{ background: "#f7f8fa", padding: "48px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(18px,4vw,24px)", fontWeight: 800, color: DARK_TEXT, marginBottom: 12 }}>
            Why Remove the Watermark for WhatsApp Status?
          </h2>
          <p style={{ color: GRAY_TEXT, fontSize: 14.5, lineHeight: 1.7, maxWidth: 580, margin: "0 auto 28px" }}>
            When you post a TikTok video with the watermark on WhatsApp Status, it looks messy — the TikTok logo and username overlay distract from the content. Luldown downloads the <strong style={{ color: DARK_TEXT }}>clean original version</strong> — no logo, no overlay, no username.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {[
              { icon: "✅", label: "No TikTok logo" },
              { icon: "✅", label: "No username overlay" },
              { icon: "✅", label: "Full HD quality" },
              { icon: "✅", label: "No app required" },
              { icon: "✅", label: "Works on iPhone & Android" },
              { icon: "✅", label: "100% free, always" },
            ].map(item => (
              <div key={item.label} style={{
                background: "#fff", borderRadius: 12, padding: "14px 16px",
                border: "1px solid rgba(0,0,0,0.06)",
                fontWeight: 600, fontSize: 13.5, color: DARK_TEXT,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ background: WHITE, padding: "48px 24px 60px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(18px,4vw,24px)", fontWeight: 800, color: DARK_TEXT, marginBottom: 28 }}>
            Frequently Asked Questions
          </h2>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

    </div>
  );
}
