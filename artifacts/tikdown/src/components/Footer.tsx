import { Download, Shield, Zap, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 mt-20"
      style={{ background: "rgba(7,8,18,0.9)" }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl gradient-btn flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-foreground">Lul<span className="gradient-text">down</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The fastest free TikTok downloader. No watermark. No login. No limits.
            </p>
            <div className="flex gap-2 mt-4">
              <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/8 px-2 py-1 rounded-full text-muted-foreground">
                <Shield className="w-3 h-3 text-emerald-400" /> Secure
              </span>
              <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/8 px-2 py-1 rounded-full text-muted-foreground">
                <Zap className="w-3 h-3 text-amber-400" /> Fast
              </span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-xs text-foreground/60 uppercase tracking-widest mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "TikTok Downloader" },
                { href: "/", label: "MP3 Extractor" },
                { href: "/", label: "Photo Downloader" },
                { href: "/history", label: "Download History" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-xs text-foreground/60 uppercase tracking-widest mb-4">Info</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/how-it-works", label: "How it Works" },
                { href: "/faq",          label: "FAQ" },
                { href: "/about",        label: "About Us" },
                { href: "/contact",      label: "Contact" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-xs text-foreground/60 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/privacy",    label: "Privacy Policy" },
                { href: "/terms",      label: "Terms of Service" },
                { href: "/dmca",       label: "DMCA" },
                { href: "/disclaimer", label: "Disclaimer" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Luldown. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary fill-primary" /> for creators worldwide
          </p>
          <p className="text-xs text-muted-foreground">
            Not affiliated with TikTok or ByteDance.
          </p>
          <p className="text-xs text-muted-foreground">
            Protected by reCAPTCHA —{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Privacy</a>
            {" & "}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Terms</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
