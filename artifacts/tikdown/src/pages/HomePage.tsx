import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Shield, Zap, MonitorSmartphone, Download, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    Icon: Shield,
    title: "No Watermark",
    desc: "Download clean HD videos — no TikTok logo, no watermark.",
  },
  {
    Icon: Zap,
    title: "Lightning Fast",
    desc: "Direct CDN links mean instant downloads at full speed.",
  },
  {
    Icon: MonitorSmartphone,
    title: "All Devices",
    desc: "Works perfectly on iPhone, Android, PC and tablet.",
  },
  {
    Icon: Download,
    title: "Multiple Formats",
    desc: "1080p, 720p, MP3 audio, or photo albums — your choice.",
  },
];

const STEPS = [
  { n: "1", title: "Copy the link", desc: "Open TikTok, tap Share → Copy link on any video." },
  { n: "2", title: "Paste it above", desc: "Paste the link into the input box at the top of this page." },
  { n: "3", title: "Download", desc: "Pick your format and the file downloads instantly." },
];

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
  });

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div className="bg-mesh" />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{ padding: "72px 20px 56px", textAlign: "center", maxWidth: 680, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{ marginBottom: 24 }}>
          <span className="pill-badge fade-up">
            <Zap size={12} fill="currentColor" />
            Free · No Watermark · Instant Download
          </span>
        </div>

        {/* Heading */}
        <h1 className="hero-title fade-up-2" style={{ marginBottom: 16 }}>
          Download TikTok Videos{" "}
          <span className="hero-accent">Without Watermark</span>
        </h1>

        {/* Subtitle */}
        <p className="fade-up-3" style={{
          fontSize: 16, color: "rgba(180,185,210,0.65)", marginBottom: 36,
          lineHeight: 1.65, maxWidth: 480, margin: "0 auto 36px",
        }}>
          Paste any TikTok link and get clean HD video, audio, or photos — no account needed, no hidden fees.
        </p>

        {/* Downloader */}
        <div className="fade-up-3" style={{ maxWidth: 600, margin: "0 auto" }}>
          <DownloaderBox />
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════ */}
      <section style={{ padding: "0 20px 64px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22d3ee", marginBottom: 10 }}>
          Simple Process
        </p>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, color: "#f4f4f6", marginBottom: 8 }}>
          How It Works
        </h2>
        <p style={{ fontSize: 14, color: "rgba(180,185,210,0.5)", marginBottom: 48 }}>
          Three steps — takes less than 10 seconds.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} style={{ position: "relative", display: "flex", alignItems: "stretch", gap: 0 }}>
              <div className="step-card" style={{ flex: 1 }}>
                <div className="step-num">{n}</div>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f4f4f6", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "rgba(180,185,210,0.55)", lineHeight: 1.55 }}>{desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  display: "flex", alignItems: "center", padding: "0 4px",
                  color: "rgba(34,211,238,0.3)", fontSize: 20, flexShrink: 0,
                  position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)",
                  zIndex: 1,
                }}>
                  <ChevronRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" style={{ maxWidth: 960, margin: "0 auto" }} />

      {/* ══ FEATURES ══════════════════════════════════════ */}
      <section style={{ padding: "64px 20px 72px", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={20} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f4f4f6", marginBottom: 6 }}>{title}</h3>
              <p style={{ fontSize: 13, color: "rgba(180,185,210,0.55)", lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" style={{ maxWidth: 960, margin: "0 auto" }} />

      {/* ══ SEO TEXT ══════════════════════════════════════ */}
      <section style={{ padding: "56px 20px 72px", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 800, color: "#f4f4f6", marginBottom: 12 }}>
          Best TikTok Downloader — No Watermark, No Login
        </h2>
        <p style={{ fontSize: 14, color: "rgba(180,185,210,0.48)", lineHeight: 1.75, marginBottom: 24 }}>
          LulDown uses direct CDN links so your browser downloads the file straight from TikTok's servers — zero bandwidth from our side. That means it's always fast, regardless of traffic. No sign-up required, no limits on how many videos you can download, and completely free forever.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { q: "Is it really free?", a: "Yes — no account, no paywall, no watermark on output." },
            { q: "What formats are supported?", a: "MP4 1080p, MP4 720p, MP3 192kbps, and photo album downloads." },
            { q: "Does it work on mobile?", a: "Fully responsive — works on any browser, any device." },
            { q: "Is my data stored?", a: "No. Download history is saved only in your browser's localStorage." },
          ].map(({ q, a }) => (
            <div key={q} style={{
              padding: "16px 18px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#f4f4f6", marginBottom: 6 }}>{q}</p>
              <p style={{ fontSize: 12, color: "rgba(180,185,210,0.5)", lineHeight: 1.5 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
