import { Shield, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import BackHomeButton from "@/components/BackHomeButton";

const SECTIONS = [
  {
    title: "Information We Do Not Collect",
    content: "Luldown does not collect, store, or process any personal information. We do not require you to register an account, provide an email address, or log in. We do not collect your name, IP address, device identifiers, or any other personally identifiable information.",
  },
  {
    title: "How the Service Works",
    content: "When you paste a TikTok URL, our service resolves the publicly available CDN link for that video. The URL is processed in real time and is never stored on our servers after your request is completed. Your browser then downloads the file directly from TikTok's CDN — Luldown does not download, store, or re-host any media files.",
  },
  {
    title: "Download History (Browser Only)",
    content: "Your download history is stored exclusively in your own browser's localStorage — it never leaves your device and is never transmitted to our servers. We have no access to your download history. You can clear it at any time by visiting the History page and clicking 'Clear History', or by clearing your browser's local storage.",
  },
  {
    title: "Cookies",
    content: "Luldown does not use advertising cookies, tracking cookies, or any third-party marketing cookies. The only browser storage we use is localStorage for your local download history, which is entirely optional and user-controlled.",
  },
  {
    title: "Google reCAPTCHA",
    content: "We use Google reCAPTCHA v3 (invisible) to protect our service from automated bots and abuse. reCAPTCHA operates in the background and may collect certain device and behavioral signals as described in Google's Privacy Policy (policies.google.com/privacy). Luldown does not store or process any reCAPTCHA scores.",
  },
  {
    title: "Third-Party Services",
    content: "Videos and media files are served directly from TikTok's content delivery network (CDN) to your browser. Luldown acts solely as a URL resolver. We do not use Google Analytics, Facebook Pixel, or any third-party advertising or analytics platforms.",
  },
  {
    title: "Children's Privacy",
    content: "Luldown is not directed at children under the age of 13. We do not knowingly collect any information from children. If you are under 13, please do not use this service.",
  },
  {
    title: "No Hosting of Video Content",
    content: "We do not host, store, or upload any videos on our servers. All video content remains on TikTok's servers. We only provide a technical link to publicly available content.",
  },
  {
    title: "No Personal Data Collection",
    content: "We do not store any personally identifiable information. We do not know your name, email, or any other personal details unless you voluntarily provide them.",
  },
  {
    title: "User Responsibility for Content",
    content: "We are not responsible for the content of videos downloaded by users. Users must ensure they have the right to download and use the content.",
  },
  {
    title: "Direct CDN Streaming",
    content: "Videos are streamed directly from TikTok's CDN to the user. No video data is ever stored on our infrastructure.",
  },
  {
    title: "Temporary Metadata Caching",
    content: "We only temporarily cache video metadata (title, author, download links) for performance purposes. No actual video files are stored.",
  },
  {
    title: "Copyright Compliance",
    content: "Our service is provided as a technical tool only. We comply with applicable copyright laws and will respond to valid legal notices.",
  },
  {
    title: "Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. Continued use of the service after changes are posted constitutes your acceptance of the revised policy.",
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
