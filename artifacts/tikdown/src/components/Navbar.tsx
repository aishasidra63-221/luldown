import { Link, useLocation } from "wouter";
import { Download, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/App";

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
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, var(--cyan) 0%, var(--cyan-dark) 100%)",
              boxShadow: "0 2px 12px var(--cyan-glow)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Download size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Lul<span style={{ color: "var(--cyan)" }}>Down</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav (≥640px) */}
        <nav className="nav-desktop">
          {LINKS.map(({ href, label }) => {
            const active = loc === href;
            return (
              <Link key={href} href={href}>
                <div style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", transition: "color 0.15s, background 0.15s",
                  color: active ? "var(--cyan)" : "var(--text-muted)",
                  background: active ? "var(--tag-bg)" : "transparent",
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

        {/* Mobile controls (< 640px) */}
        <div className="nav-mobile">
          <button onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
          <button onClick={() => setOpen(!open)} className="theme-toggle" aria-label="Menu">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          background: "var(--navbar-bg)",
        }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <div onClick={() => setOpen(false)} style={{
                padding: "12px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer", color: loc === href ? "var(--cyan)" : "var(--text-secondary)",
                background: loc === href ? "var(--tag-bg)" : "transparent",
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
