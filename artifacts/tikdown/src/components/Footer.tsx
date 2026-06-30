import { Link } from "wouter";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "#0d0b1e", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          © {year} LulDown.com — All rights reserved
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { href: "/privacy",    label: "Privacy" },
            { href: "/terms",      label: "Terms"   },
            { href: "/disclaimer", label: "Disclaimer" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
