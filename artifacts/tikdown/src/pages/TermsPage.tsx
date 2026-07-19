import { FileText, ChevronRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import BackHomeButton from "@/components/BackHomeButton";

const SECTIONS = [
  {
    title: "Acceptance & Service",
    content: "By using Luldown (luldown.com), you agree to these Terms and our Privacy Policy. Luldown is a free tool that resolves publicly available TikTok CDN links so your browser can download them directly. We do not host, store, or distribute any media content.",
  },
  {
    title: "Permitted Use",
    content: "You may use Luldown for personal, non-commercial purposes only — such as saving videos for offline viewing or backing up your own content. Automated scraping, bulk downloading, and commercial redistribution are strictly prohibited.",
  },
  {
    title: "Copyright & No Affiliation",
    content: "All downloaded content belongs to its original creators. Luldown claims no ownership over any media. Luldown is independent and not affiliated with TikTok™ or ByteDance Ltd. in any way. You are solely responsible for ensuring your use of downloaded content complies with copyright law.",
  },
  {
    title: "Liability & Changes",
    content: "This service is provided \"as is\" without warranties. We are not liable for damages, interruptions, or content unavailability. We reserve the right to update these Terms at any time — continued use constitutes acceptance of any changes.",
  },
];

export default function TermsPage() {
  useSEO({
    title: "Terms & Conditions — Luldown",
    description: "Terms and conditions for using Luldown TikTok video downloader.",
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
          <FileText size={24} color="#4f6ef7" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em",
          position: "relative",
        }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", position: "relative" }}>
          Last updated: July 2025 · Please read carefully before use
        </p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, marginBottom: 28, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
          Please read these Terms and Conditions carefully before using Luldown. By using this service, you confirm that you are at least 13 years of age and agree to comply with these terms.
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
