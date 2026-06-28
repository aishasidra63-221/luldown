import { Link } from "wouter";
import { Download } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const cols = [
    {
      heading: "Tools",
      links: [
        { href: "/",        label: "Video Downloader" },
        { href: "/",        label: "MP3 Extractor"    },
        { href: "/history", label: "Download History" },
      ],
    },
    {
      heading: "Info",
      links: [
        { href: "/faq",     label: "FAQ"     },
        { href: "/blog",    label: "Blog"    },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "/privacy",    label: "Privacy Policy" },
        { href: "/disclaimer", label: "Disclaimer"     },
        { href: "/terms",      label: "Terms of Use"   },
      ],
    },
  ];

  return (
    <footer style={{
      background: "var(--footer-bg)",
      borderTop: "1px solid var(--footer-border)",
      transition: "background 0.25s ease",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 32px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: "32px 24px", marginBottom: 40 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, var(--cyan) 0%, var(--cyan-dark) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Download size={15} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
                Lul<span style={{ color: "var(--cyan)" }}>Down</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 220 }}>
              The fastest free TikTok downloader. No watermark. No login. No limits.
            </p>
          </div>

          {/* Link columns */}
          {cols.map(({ heading, links }) => (
            <div key={heading}>
              <h4 style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--cyan)", marginBottom: 16,
              }}>
                {heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href}>
                      <span style={{
                        fontSize: 13, color: "var(--text-muted)", cursor: "pointer",
                        transition: "color 0.15s",
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--border-subtle)", paddingTop: 24,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8,
        }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            © {year} LulDown. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Not affiliated with TikTok or ByteDance.
          </p>
        </div>
      </div>
    </footer>
  );
}
