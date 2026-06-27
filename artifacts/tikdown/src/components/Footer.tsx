import { Download, Shield, Zap, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[rgba(255,45,120,0.15)]"
      style={{ background: "rgba(6,4,16,0.96)" }}>

      {/* Neon top line */}
      <div className="neon-divider" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center shadow-md">
                <Download className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-white">Lul<span className="gradient-text">down</span></span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              The fastest free TikTok downloader. No watermark. No login. No limits.
            </p>
            <div className="flex gap-2 mt-4">
              <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/40">
                <Shield className="w-3 h-3 text-emerald-400" /> Secure
              </span>
              <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/8 px-2.5 py-1 rounded-full text-white/40">
                <Zap className="w-3 h-3 text-[#ffe94b]" /> Fast
              </span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-semibold text-[10px] text-[#ff6aaa] uppercase tracking-widest mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",        label: "TikTok Downloader" },
                { href: "/",        label: "MP3 Extractor"     },
                { href: "/",        label: "Photo Downloader"  },
                { href: "/history", label: "Download History"  },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-white/35 hover:text-[#ff6aaa] transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-[10px] text-[#00f2ea]/70 uppercase tracking-widest mb-4">Info</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/blog",    label: "Blog"    },
                { href: "/faq",     label: "FAQ"     },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-white/35 hover:text-[#00f2ea] transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[10px] text-white/30 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/privacy",    label: "Privacy Policy" },
                { href: "/dmca",       label: "DMCA"           },
                { href: "/disclaimer", label: "Disclaimer"     },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href}>
                    <span className="text-xs text-white/35 hover:text-white/70 transition-colors cursor-pointer">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="neon-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">© {year} Luldown. All rights reserved.</p>
          <p className="text-xs text-white/25 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-[#ff2d78] fill-[#ff2d78]" /> for creators worldwide
          </p>
          <p className="text-xs text-white/25">Not affiliated with TikTok or ByteDance.</p>
          <p className="text-xs text-white/25">
            Protected by reCAPTCHA —{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Privacy</a>
            {" & "}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">Terms</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
