import { Link, useLocation } from "wouter";
import { useTheme } from "@/App";
import { Download, Menu, X, Home, Clock, Settings, Sun, Moon } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/",         label: "Home",     Icon: Home     },
    { href: "/history",  label: "History",  Icon: Clock    },
    { href: "/settings", label: "Settings", Icon: Settings },
  ];

  const isLight = theme === "light";

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00c8c8 0%, #007c7c 100%)" }}>
              <Download className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="logo-text text-xl font-black tracking-tight" style={{ color: isLight ? "#1a1a2e" : "#ffffff" }}>
              LulDown
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label, Icon }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150"
                  style={location === href
                    ? { color: "#00e5e5" }
                    : { color: isLight ? "rgba(26,26,46,0.5)" : "rgba(200,215,235,0.5)" }}>
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all ml-1"
            style={{
              background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
              color: isLight ? "#4b5563" : "rgba(200,215,235,0.6)",
              border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)",
            }}
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all ml-1"
            style={{
              background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
              color: isLight ? "#4b5563" : "rgba(200,215,235,0.6)",
              border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)",
            }}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t px-4 py-3 space-y-1"
          style={{
            borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)",
            background: isLight ? "rgba(255,255,255,0.96)" : "rgba(10,13,22,0.97)",
            backdropFilter: "blur(20px)",
          }}>
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <div
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
                style={location === href
                  ? { color: "#00e5e5", background: "rgba(0,229,229,0.08)" }
                  : { color: isLight ? "#4b5563" : "rgba(200,215,235,0.55)" }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
