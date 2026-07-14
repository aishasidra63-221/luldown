import { Link } from "wouter";

const COLS = [
  {
    heading: "Tools",
    links: [
      { href: "/",        label: "Video Downloader" },
      { href: "/",        label: "MP3 Extractor"    },
      { href: "/history", label: "Download History" },
    ],
  },
  {
    heading: "Help",
    links: [
      { href: "/faq",  label: "FAQ"  },
      { href: "/blog", label: "Blog" },
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

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#0d0b1e", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 28px" }}>

        {/* Top grid: brand + 3 link columns */}
        <div style={{ marginBottom: 40 }} className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
                LulDown
              </span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 230 }}>
              Free TikTok video downloader. No watermark. No login. No limits. Works on all devices.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map(({ heading, links }) => (
            <div key={heading} className={heading === "Tools" ? "footer-tools" : ""}>
              <h4 style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#ffffff", marginBottom: 16,
              }}>
                {heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href}>
                      <span
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", cursor: "pointer", transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            © {year} LulDown.com — All rights reserved
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            Not affiliated with TikTok or ByteDance.
          </p>
        </div>
      </div>
    </footer>
  );
}
