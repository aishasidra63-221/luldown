import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LANG_META, ALL_LANGS, Lang, getLangFromPath, getPageKeyFromSlug, buildPageUrl } from "@/i18n/langMeta";

const NAV_LINKS = [
  {
    href: "/faq", label: "FAQ",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/history", label: "History",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3 7 7 7"/>
      </svg>
    ),
  },
  {
    href: "/mp3", label: "MP3",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
  },
  {
    href: "/thumbnail", label: "Thumbnail",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
];

function HamburgerIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0"  width="20" height="2.2" rx="1.1" fill="currentColor"/>
      <rect x="4" y="6"  width="12" height="2.2" rx="1.1" fill="currentColor"/>
      <rect x="0" y="12" width="20" height="2.2" rx="1.1" fill="currentColor"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function Navbar() {
  const [loc, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const { lang, pageSlug } = getLangFromPath(loc);
  const pageKey = getPageKeyFromSlug(pageSlug);

  const switchLang = (targetLang: Lang) => {
    const url = buildPageUrl(targetLang, pageKey);
    setLocation(url || "/");
    setOpen(false);
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#F8F8FC",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
    }}>
      <div style={{
        width: "100%", paddingLeft: 8, paddingRight: 16, height: 49,
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
            width: 40, height: 40, borderRadius: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: open ? "rgba(124,58,237,0.1)" : "rgba(0,0,0,0.04)",
            border: open ? "1.5px solid rgba(124,58,237,0.35)" : "1px solid rgba(0,0,0,0.1)",
            color: open ? "#7c3aed" : "#4b5563",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
          aria-label="Menu"
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          borderTop: "1px solid rgba(0,0,0,0.07)",
          background: "#ffffff",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}>
          {/* Nav links */}
          <div style={{ padding: "10px 12px 8px" }}>
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = loc === href;
              return (
                <Link key={href} href={href}>
                  <div
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      fontSize: 14, fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      color: active ? "#7c3aed" : "#374151",
                      background: active ? "rgba(124,58,237,0.08)" : "transparent",
                      transition: "background 0.15s",
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                    <span>{label}</span>
                    {active && (
                      <span style={{
                        marginLeft: "auto", width: 6, height: 6,
                        borderRadius: "50%", background: "#7c3aed",
                      }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Language switcher */}
          <div style={{
            margin: "0 12px 12px",
            background: "rgba(0,0,0,0.025)",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "#9ca3af",
              marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Language
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_LANGS.map(l => {
                const active = l === lang;
                return (
                  <button
                    key={l}
                    onClick={() => switchLang(l)}
                    style={{
                      padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", border: "1.5px solid",
                      background: active ? "linear-gradient(135deg, #7c3aed, #4f6ef7)" : "transparent",
                      color: active ? "#ffffff" : "#6b7280",
                      borderColor: active ? "transparent" : "rgba(0,0,0,0.12)",
                      boxShadow: active ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {LANG_META[l].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
