import { AlertTriangle, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import BackHomeButton from "@/components/BackHomeButton";

const SECTIONS = [
  {
    title: "No Affiliation with TikTok",
    content: "Luldown is an independent service not associated with, sponsored by, or endorsed by TikTok™ or ByteDance Ltd. All trademarks referenced are property of their respective owners.",
  },
  {
    title: "Personal Use & Copyright",
    content: "This service is for personal, non-commercial use only. All downloaded content remains the property of its original creators. Do not redistribute, resell, or publicly republish content without the creator's permission. Users are solely responsible for compliance with copyright laws.",
  },
  {
    title: "No Server Storage",
    content: "Luldown does not store any video, audio, or image files. All media is delivered directly from TikTok's CDN to your browser — we only resolve the URL.",
  },
  {
    title: "Availability & Liability",
    content: "This service is provided \"as is\" without warranties of any kind. We do not guarantee availability or that all videos can be downloaded, as this depends on TikTok's infrastructure. Luldown shall not be liable for any damages or legal consequences arising from use of this service.",
  },
];

export default function DisclaimerPage() {
  useSEO({
    title: "Disclaimer — Luldown",
    description: "Luldown disclaimer — no affiliation with TikTok, personal use only, copyright notice.",
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
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <AlertTriangle size={24} color="#f59e0b" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em",
          position: "relative",
        }}>
          Disclaimer
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", position: "relative" }}>
          Last updated: July 2025 · Please read before using this service
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
        <div style={{
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
          fontSize: 13.5,
          color: "#92400e",
          lineHeight: 1.65,
        }}>
          <strong>Important:</strong> Luldown is an independent tool not affiliated with TikTok or ByteDance. Please use this service responsibly and respect the rights of content creators.
        </div>

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
                <ChevronRight size={16} color="#f59e0b" style={{ marginTop: 3, flexShrink: 0 }} />
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
