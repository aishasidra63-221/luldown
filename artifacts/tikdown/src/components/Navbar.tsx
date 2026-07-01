import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LANG_META, ALL_LANGS, Lang, getLangFromPath, getPageKeyFromSlug, buildPageUrl } from "@/i18n/langMeta";

const NAV_LINKS = [
  { href: "/faq",     label: "FAQ"     },
  { href: "/history", label: "History" },
  { href: "/mp3",     label: "MP3"     },
  { href: "/story",   label: "Story"   },
  { href: "/thumbnail", label: "Thumbnail" },
];

export default function Navbar() {
  const [loc, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { lang, pageSlug } = getLangFromPath(loc);
  const pageKey = getPageKeyFromSlug(pageSlug);

  const switchLang = (targetLang: Lang) => {
    const url = buildPageUrl(targetLang, pageKey) || "/";
    navigate(url);
    setOpen(false);
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#F8F8FC",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
    }}>
      <div style={{
        width: "100%", paddingLeft: 0, paddingRight: 16, height: 48,
        display: "flex", alignItems: "center", justifyContent: "space-between",
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
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "#111827" }}>
              Lul<span style={{
                background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>Down</span>
            </span>
          </div>
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)",
            color: "#4b5563", cursor: "pointer",
          }}
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          borderTop: "1px solid rgba(0,0,0,0.08)",
          padding: "12px 16px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          background: "#ffffff",
        }}>
          {/* Nav links */}
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              <div onClick={() => setOpen(false)} style={{
                padding: "11px 14px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: "pointer",
                color: loc === href ? "#4f6ef7" : "#4b5563",
                background: loc === href ? "rgba(79,110,247,0.1)" : "transparent",
              }}>
                {label}
              </div>
            </Link>
          ))}

          {/* Language switcher */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 8, paddingLeft: 14, letterSpacing: "0.06em", textTransform: "uppercase" }}>Language</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4 }}>
              {ALL_LANGS.map(l => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  style={{
                    padding: "5px 12px", borderRadius: 18, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", border: "1px solid",
                    background: l === lang ? "#4f6ef7" : "transparent",
                    color: l === lang ? "#ffffff" : "#6b7280",
                    borderColor: l === lang ? "#4f6ef7" : "rgba(0,0,0,0.15)",
                    transition: "all 0.15s",
                  }}
                >
                  {LANG_META[l].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
