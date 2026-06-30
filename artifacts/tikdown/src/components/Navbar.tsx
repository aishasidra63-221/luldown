import { Link, useLocation } from "wouter";
import { Menu, X, Moon } from "lucide-react";
import { useState } from "react";

const LINKS = [
  { href: "/",       label: "Home"    },
  { href: "/faq",    label: "FAQ"     },
  { href: "/history",label: "History" },
];

export default function Navbar() {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#0d0b1f",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        width: "100%", padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto",
      }}>

        {/* Logo */}
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#ffffff" }}>
              Lul<span style={{
                background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>Down</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ alignItems: "center", gap: 4 }}>
          {LINKS.map(({ href, label }) => {
            const active = loc === href;
            return (
              <Link key={href} href={href}>
                <div style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", transition: "color 0.15s, background 0.15s",
                  color: active ? "#7c8ff7" : "rgba(255,255,255,0.65)",
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "#fff"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.65)"; }}
                >
                  {label}
                </div>
              </Link>
            );
          })}
          <button style={{
            width: 34, height: 34, borderRadius: 8, marginLeft: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", cursor: "pointer",
          }} aria-label="Toggle theme">
            <Moon size={15} />
          </button>
        </nav>

        {/* Mobile hamburger */}
        <div className="nav-mobile">
          <button
            onClick={() => setOpen(!open)}
            style={{
              width: 38, height: 38, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)", cursor: "pointer",
            }}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          background: "#0d0b1f",
        }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <div onClick={() => setOpen(false)} style={{
                padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer",
                color: loc === href ? "#7c8ff7" : "rgba(255,255,255,0.65)",
                background: loc === href ? "rgba(99,102,241,0.12)" : "transparent",
              }}>
                {label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
