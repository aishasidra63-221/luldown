import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/App";
import { FaTiktok } from "react-icons/fa";
import { BsDownload } from "react-icons/bs";

const LINKS = [
  { href: "/",        label: "Home"    },
  { href: "/faq",     label: "FAQ"     },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="navbar">
      <div style={{ width: "100%", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(90deg, #4f6ef7 0%, #a855f7 50%, #ec4899 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 14px rgba(168,85,247,0.45)",
            }}>
              {/* Download arrow icon — custom clean SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M7 12l5 5 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 20h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Lul<span style={{ background: "linear-gradient(90deg,#4f6ef7,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Down</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop">
          {LINKS.map(({ href, label }) => {
            const active = loc === href;
            return (
              <Link key={href} href={href}>
                <div style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", transition: "color 0.15s, background 0.15s",
                  color: active ? "#4f6ef7" : "var(--text-muted)",
                  background: active ? "rgba(79,110,247,0.08)" : "transparent",
                }}>
                  {label}
                </div>
              </Link>
            );
          })}
          <button onClick={toggle} className="theme-toggle" style={{ marginLeft: 8 }} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="nav-mobile" style={{ gap: 8 }}>
          <button onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
          <button onClick={() => setOpen(!open)} className="theme-toggle" aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          borderTop: "1px solid var(--navbar-border)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          background: "var(--navbar-bg)",
        }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <div onClick={() => setOpen(false)} style={{
                padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer",
                color: loc === href ? "#4f6ef7" : "var(--text-secondary)",
                background: loc === href ? "rgba(79,110,247,0.08)" : "transparent",
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
