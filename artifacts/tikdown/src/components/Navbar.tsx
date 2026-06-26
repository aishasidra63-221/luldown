import { Link, useLocation } from "wouter";
import { useTheme } from "@/App";
import { Sun, Moon, Download, Home, Clock, Settings, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/history", label: "History", Icon: Clock },
    { href: "/settings", label: "Settings", Icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl"
      style={{ background: "rgba(7,8,18,0.82)" }}>
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center">
              <Download className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lul<span className="gradient-text">down</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                location === href
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/8 transition-all"
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 text-muted-foreground" />
              : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/8"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border/50 px-4 py-3 space-y-1"
          style={{ background: "rgba(7,8,18,0.95)" }}>
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <div
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  location === href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
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
