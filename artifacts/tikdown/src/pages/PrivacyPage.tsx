import { Shield, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import BackHomeButton from "@/components/BackHomeButton";

const SECTIONS = [
  {
    title: "No Personal Data Collected",
    content: "Luldown does not collect, store, or process any personal information. No account, email, or login is required. We do not know your name, IP address, or any other personal details.",
  },
  {
    title: "How the Service Works",
    content: "When you paste a TikTok URL, we resolve the publicly available CDN link in real time. Your browser downloads the file directly from TikTok's CDN — Luldown does not store, host, or re-host any media files.",
  },
  {
    title: "Download History & Cookies",
    content: "Your download history is stored only in your browser's localStorage — it never leaves your device. We do not use advertising or tracking cookies, and we do not use Google Analytics or any third-party analytics platforms.",
  },
  {
    title: "Third-Party Services",
    content: "Media is served directly from TikTok's CDN. We may use Google reCAPTCHA v3 (invisible) for bot protection; it operates in the background per Google's Privacy Policy. Luldown does not store reCAPTCHA scores.",
  },
  {
    title: "Content & Copyright",
    content: "We do not host or redistribute any video content. We only provide a technical link to publicly available content. Users are responsible for ensuring they have the right to download and use any content. We comply with applicable copyright laws and respond to valid legal notices.",
  },
  {
    title: "Changes to This Policy",
    content: "We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of the service constitutes acceptance of the revised policy.",
  },
];

export default function PrivacyPage() {
  useSEO({
    title: "Privacy Policy — Luldown",
    description: "Luldown privacy policy — what we collect, how we store data, and your rights.",
  });

  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh" }}>

      <div style={{
        background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)",
        padding: "48px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 16, left: 20, zIndex: 10 }}>
          <BackHomeButton />
        </div>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(120,40,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
          background: "rgba(79,110,247,0.15)",
          border: "1px solid rgba(79,110,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <Shield size={24} color="#4f6ef7" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em",
          position: "relative",
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", position: "relative" }}>
          Last updated: July 2025 · Effective immediately
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, marginBottom: 28, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
          At Luldown, we take your privacy seriously. This policy explains what information we collect (and do not collect), how we handle your data, and your rights as a user of luldown.com.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SECTIONS.map((s, i) => (
            <div key={s.title} style={{
              background: "#ffffff",
              borderRadius: i === 0 ? "16px 16px 0 0" : i === SECTIONS.length - 1 ? "0 0 16px 16px" : 0,
              borderTop: i === 0 ? "1px solid rgba(0,0,0,0.09)" : "none",
              borderLeft: "1px solid rgba(0,0,0,0.09)",
              borderRight: "1px solid rgba(0,0,0,0.09)",
              borderBottom: "1px solid rgba(0,0,0,0.09)",
              padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <ChevronRight size={16} color="#4f6ef7" style={{ marginTop: 3, flexShrink: 0 }} />
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>{s.title}</h2>
                  <p style={{ fontSize: 13.5, color: "#4b5563", lineHeight: 1.7 }}>{s.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
