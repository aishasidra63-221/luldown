import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { Shield, Zap, MonitorSmartphone, Download, ChevronRight } from "lucide-react";

const FEATURES = [
  {
    Icon: Shield,
    title: "No Watermark",
    desc: "Download crystal-clear HD videos with zero TikTok branding — exactly as the creator made it.",
    accentA: "#0891b2", accentB: "#06b6d4",
    iconColor: "#0891b2",
    tag: "Clean Output",
  },
  {
    Icon: Zap,
    title: "Lightning Fast",
    desc: "Get your file in seconds. Direct server links skip the queue — no waiting, no compression.",
    accentA: "#d97706", accentB: "#f59e0b",
    iconColor: "#d97706",
    tag: "Instant",
  },
  {
    Icon: MonitorSmartphone,
    title: "All Devices",
    desc: "iPhone, Android, PC, tablet — works perfectly on any screen, any browser, anywhere.",
    accentA: "#7c3aed", accentB: "#a78bfa",
    iconColor: "#7c3aed",
    tag: "Universal",
  },
  {
    Icon: Download,
    title: "Multiple Formats",
    desc: "Choose 1080p, 720p, or MP3 audio. Photo slideshows saved as full-res images too.",
    accentA: "#059669", accentB: "#34d399",
    iconColor: "#059669",
    tag: "Flexible",
  },
];

const STEPS = [
  { n: "1", title: "Copy the link",  desc: "Open TikTok, tap Share → Copy link on any video." },
  { n: "2", title: "Paste it above", desc: "Paste the link into the input box above."          },
  { n: "3", title: "Download",       desc: "Pick your format and the file saves instantly."    },
];

const FAQ = [
  { q: "Is it really free?",          a: "Yes — no account, no paywall, no watermark on output."             },
  { q: "What formats are supported?", a: "MP4 1080p, MP4 720p, MP3 192kbps, and photo album downloads."      },
  { q: "Does it work on mobile?",     a: "Fully responsive — works on any browser, any device."               },
  { q: "Is my data stored?",          a: "No. Download history is saved only in your browser's localStorage." },
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
        <div style={{ marginBottom: 24 }}>
          <span className="pill-badge fade-up">
            <Zap size={12} fill="currentColor" />
            Free · No Watermark · Instant Download
          </span>
        </div>

        <h1 className="hero-title fade-up-2" style={{ marginBottom: 16 }}>
          TikTok Video Downloader{" "}
          <span className="hero-accent">No Watermark</span>
        </h1>

        <p className="fade-up-3" style={{
          fontSize: 16, color: "var(--text-secondary)",
          lineHeight: 1.65, maxWidth: 480, margin: "0 auto 36px",
        }}>
          Paste any TikTok link and get clean HD video, audio, or photos — no account needed, no hidden fees.
        </p>

        <div className="fade-up-3" style={{ maxWidth: 600, margin: "0 auto" }}>
          <DownloaderBox />
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════ */}
      <section style={{ padding: "0 20px 64px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cyan)", marginBottom: 10 }}>
          Simple Process
        </p>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          How It Works
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 48 }}>
          Three steps — takes less than 10 seconds.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} style={{ position: "relative", display: "flex", alignItems: "stretch" }}>
              <div className="step-card" style={{ flex: 1 }}>
                <div className="step-num">{n}</div>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>{desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", right: -18, top: "50%", transform: "translateY(-50%)", color: "var(--cyan)", opacity: 0.4, zIndex: 1 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
          {FEATURES.map(({ Icon, title, desc, accentA, accentB, iconColor, tag }) => (
            <div
              key={title}
              className="feature-card"
              style={{ "--card-accent-a": accentA, "--card-accent-b": accentB } as React.CSSProperties}
            >
              {/* Icon */}
              <div className="feature-icon">
                <div className="feature-icon-inner" />
                <Icon size={22} style={{ color: iconColor }} strokeWidth={2} />
              </div>

              {/* Tag pill */}
              <span style={{
                display: "inline-block", marginBottom: 10,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "3px 8px", borderRadius: 999,
                background: `${accentA}18`,
                border: `1px solid ${accentA}35`,
                color: accentA,
              }}>
                {tag}
              </span>

              <h3 style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.2 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" style={{ maxWidth: 960, margin: "0 auto" }} />

      {/* ══ FAQ ═══════════════════════════════════════════ */}
      <section style={{ padding: "56px 20px 72px", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
          Best TikTok Downloader — No Watermark, No Login
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, marginBottom: 28 }}>
          Always fast, no limits, completely free forever.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} className="faq-card">
              <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>{q}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
