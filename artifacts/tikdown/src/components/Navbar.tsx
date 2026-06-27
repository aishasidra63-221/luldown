import { Link, useLocation } from "wouter";
import { Download, Menu, X, Home, Clock, Settings } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/",         label: "Home",     Icon: Home     },
    { href: "/history",  label: "History",  Icon: Clock    },
    { href: "/settings", label: "Settings", Icon: Settings },
  ];

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer select-none group">
            {/* Cyan circle icon */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00c8c8 0%, #007c7c 100%)" }}>
              <Download className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              LulDown
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                location === href
                  ? "text-[#00e5e5]"
                  : "text-white/45 hover:text-white/80"
              }`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            </Link>
          ))}
        </div>

        {/* Hamburger (mobile) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ color: "rgba(200,215,235,0.7)" }}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t px-4 py-3 space-y-1"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(10,13,22,0.97)", backdropFilter: "blur(20px)" }}>
          {navLinks.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <div
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
                style={location === href
                  ? { color: "#00e5e5", background: "rgba(0,229,229,0.08)" }
                  : { color: "rgba(200,215,235,0.55)" }}
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
