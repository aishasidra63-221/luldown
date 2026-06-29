import { Link } from "wouter";

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
      background: "var(--card-bg)",
      borderTop: "1px solid var(--card-border)",
      transition: "background 0.25s ease",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 28px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: "28px 24px", marginBottom: 32 }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #4f6ef7 0%, #a855f7 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
                Lul<span style={{
                  background: "linear-gradient(90deg,#4f6ef7,#a855f7)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>Down</span>
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
                textTransform: "uppercase", color: "#4f6ef7", marginBottom: 14,
              }}>
                {heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
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
          borderTop: "1px solid var(--card-border)", paddingTop: 20,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8,
        }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            © {year} LulDown.com – All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Not affiliated with TikTok or ByteDance.
          </p>
        </div>
      </div>
    </footer>
  );
}
