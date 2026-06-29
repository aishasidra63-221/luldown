import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { FaTiktok } from "react-icons/fa";
import { FiGift, FiUser, FiShield, FiHeadphones, FiLock } from "react-icons/fi";
import { MdHd } from "react-icons/md";
import { RiShieldCheckLine } from "react-icons/ri";
import { BsLightningChargeFill, BsClipboard, BsDownload, BsCheck2Circle } from "react-icons/bs";

const FEATURES = [
  {
    label: "No Watermark",
    sub: "Clean videos",
    color: "#4f6ef7",
    bg: "rgba(79,110,247,0.12)",
    icon: <RiShieldCheckLine size={24} color="#4f6ef7" />,
  },
  {
    label: "HD Quality",
    sub: "High Quality",
    color: "#e63f7a",
    bg: "rgba(230,63,122,0.12)",
    icon: <MdHd size={26} color="#e63f7a" />,
  },
  {
    label: "Fast Download",
    sub: "In seconds",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: <BsLightningChargeFill size={20} color="#8b5cf6" />,
  },
  {
    label: "All Devices",
    sub: "Android, iOS, PC",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="13" height="10" rx="2" stroke="#10b981" strokeWidth="2"/>
        <rect x="16" y="8" width="6" height="9" rx="1.5" stroke="#10b981" strokeWidth="2"/>
        <path d="M2 19h13M8 19v2M8.5 21h5" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: "1", title: "Copy link from TikTok",
    color: "#4f6ef7", badgeColor: "#4f6ef7",
    bg: "rgba(79,110,247,0.13)",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#4f6ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    n: "2", title: "Paste the link above",
    color: "#8b5cf6", badgeColor: "#8b5cf6",
    bg: "rgba(139,92,246,0.13)",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <rect x="8" y="2" width="8" height="4" rx="1.5" stroke="#8b5cf6" strokeWidth="2"/>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 12h6M9 16h4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    n: "3", title: "Click download and enjoy",
    color: "#e63f7a", badgeColor: "#e63f7a",
    bg: "rgba(230,63,122,0.13)",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#e63f7a" strokeWidth="2"/>
        <path d="M12 8v6M9 11l3 3 3-3" stroke="#e63f7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const FOOTER_ITEMS = [
  { icon: <FiGift size={15} />,      label: "100% Free",       color: "#a855f7" },
  { icon: <FiUser size={15} />,      label: "No Registration", color: "#4f6ef7" },
  { icon: <FiShield size={15} />,    label: "Secure & Safe",   color: "#10b981" },
  { icon: <FiHeadphones size={15} />,label: "Fast Support",    color: "#ec4899" },
];

export default function HomePage() {
  useSEO({
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
  });

  return (
    <div style={{ position: "relative", background: "var(--page-bg)", overflowX: "hidden" }}>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="section-wide" style={{ padding: "40px 24px 24px", textAlign: "center", maxWidth: 620, margin: "0 auto", position: "relative" }}>

        {/* TikTok watermark — very faint background */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          opacity: 0.03, pointerEvents: "none", overflow: "hidden",
          width: 160, height: 200,
        }}>
          <FaTiktok size={160} style={{ color: "var(--tiktok-mark)" }} />
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(1.75rem, 4.8vw, 2.6rem)",
          fontWeight: 800, lineHeight: 1.18,
          color: "var(--text-primary)",
          marginBottom: 18,
        }}>
          TikTok Video Downloader<br />No Watermark
        </h1>

        <p style={{
          fontSize: 14.5, color: "var(--text-muted)",
          marginBottom: 32, fontWeight: 400, lineHeight: 1.6,
        }}>
          Fast. Free. High Quality.
        </p>

        {/* Downloader */}
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <DownloaderBox />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section className="section-wide" style={{ padding: "36px 24px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
          background: "var(--card-bg)", borderRadius: 18,
          border: "1px solid var(--card-border)",
          padding: "22px 12px",
        }}>
          {FEATURES.map(({ label, sub, color, bg, icon }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {icon}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700, fontSize: 11, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section className="section-wide" style={{ padding: "36px 24px 0", maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{
          textAlign: "center", fontWeight: 800, fontSize: 17,
          color: "var(--text-primary)", marginBottom: 18,
        }}>
          How it works?
        </h2>

        <div className="steps-grid">
          {STEPS.map(({ n, title, icon, bg, color }) => (
            <div key={n} style={{
              background: "var(--card-bg)",
              borderRadius: 16,
              border: "1px solid var(--card-border)",
              padding: "32px 20px 28px",
              display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center", gap: 14,
              flex: 1,
            }}>
              {/* Icon circle */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {icon}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 22, height: 22, borderRadius: "50%",
                  background: color,
                  color: "#fff", fontSize: 11, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--card-bg)",
                  boxShadow: `0 2px 8px ${color}55`,
                }}>
                  {n}
                </div>
              </div>

              {/* Text */}
              <div>
                <p style={{
                  fontSize: 14, fontWeight: 700,
                  color: "var(--text-primary)", lineHeight: 1.4,
                  marginBottom: 4,
                }}>
                  {title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {n === "1" && "Open TikTok and copy the video link"}
                  {n === "2" && "Paste the link into the box above"}
                  {n === "3" && "Choose your format and download"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAFE & SECURE ─────────────────────────── */}
      <section className="section-wide" style={{ padding: "36px 24px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          background: "var(--safe-card-bg)",
          borderRadius: 18,
          border: "1px solid rgba(16,185,129,0.18)",
          padding: "22px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          overflow: "hidden", position: "relative",
        }}>
          {/* Subtle green glow in background */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Left: Lock icon + text */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            <div style={{
              width: 62, height: 62, borderRadius: "50%",
              background: "rgba(16,185,129,0.13)",
              border: "1.5px solid rgba(16,185,129,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <FiLock size={28} color="#10b981" strokeWidth={2.2} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 16, color: "#10b981", marginBottom: 5, letterSpacing: "-0.01em" }}>
                Safe &amp; Secure
              </p>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55 }}>
                We don't store any videos.<br />Your data is 100% safe.
              </p>
            </div>
          </div>

          {/* Right: Shield with sparkles */}
          <div style={{ position: "relative", flexShrink: 0, marginLeft: 12 }}>
            {/* Sparkle stars */}
            <span style={{ position: "absolute", top: -8, right: 2, fontSize: 13, color: "#10b981", opacity: 0.8 }}>✦</span>
            <span style={{ position: "absolute", top: 4, right: -10, fontSize: 9, color: "#10b981", opacity: 0.6 }}>✦</span>
            <span style={{ position: "absolute", bottom: -6, left: -8, fontSize: 10, color: "#10b981", opacity: 0.6 }}>✦</span>

            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "rgba(16,185,129,0.1)",
              border: "1.5px solid rgba(16,185,129,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Shield with check SVG */}
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5L12 2z"
                  stroke="#10b981" strokeWidth="1.8" strokeLinejoin="round"
                  fill="rgba(16,185,129,0.12)" />
                <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER BAR ────────────────────────────── */}
      <section className="section-wide" style={{ padding: "20px 24px 48px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          background: "var(--card-bg)",
          borderRadius: 18,
          border: "1px solid var(--card-border)",
          padding: "0 8px",
          display: "flex", alignItems: "stretch",
          overflow: "hidden",
        }}>
          {FOOTER_ITEMS.map(({ icon, label, color }, i) => (
            <div key={label} style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "14px 6px",
              fontSize: 11, fontWeight: 600,
              color: "var(--text-secondary)",
              borderRight: i < FOOTER_ITEMS.length - 1 ? "1px solid var(--card-border)" : "none",
            }}>
              <span style={{ color }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
