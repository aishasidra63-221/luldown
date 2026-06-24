import { useSEO } from "@/hooks/use-seo";
import { Heart, Shield, Zap, Globe } from "lucide-react";

export default function AboutPage() {
  useSEO({
    title: "About Luldown — Free TikTok Downloader",
    description: "Luldown is a free, private TikTok downloader. No ads, no tracking, no login. Built for creators and viewers who want to save content easily.",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">About Luldown</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A fast, private, and completely free TikTok downloader — built for everyone.
        </p>
      </header>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 text-sm text-muted-foreground">
        <div>
          <h2 className="font-bold text-foreground text-base mb-2">What is Luldown?</h2>
          <p className="leading-relaxed">
            Luldown is a free online tool that lets you download TikTok videos, extract audio as MP3, and
            save photo slideshows — all without a watermark, without creating an account, and without spending
            a single cent. It works directly in your browser on any device.
          </p>
        </div>

        <div className="border-t border-border" />

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Why We Built It</h2>
          <p className="leading-relaxed">
            Saving a TikTok video should be simple. But most tools are cluttered with ads, require sign-ups,
            add their own watermarks, or bury the download button under pop-ups. Luldown is different —
            it's straightforward, fast, and respects your privacy. No data is collected, no history is stored
            on our servers, and you never need to log in.
          </p>
        </div>

        <div className="border-t border-border" />

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Shield, label: "Privacy First",   desc: "Your download history lives only in your browser. We collect no personal data.",       color: "text-blue-500"   },
            { icon: Zap,    label: "Always Fast",      desc: "Downloads go directly from TikTok's servers to your device — zero extra delay.",       color: "text-yellow-500" },
            { icon: Globe,  label: "Works Everywhere", desc: "iPhone, Android, Mac, Windows, tablet — any browser, any device, no app needed.",      color: "text-green-500"  },
            { icon: Heart,  label: "Free Forever",     desc: "No subscription, no premium tier, no hidden fees. Luldown is and will always be free.", color: "text-primary"    },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border" />

        <div>
          <h2 className="font-bold text-foreground text-base mb-2">Responsible Use</h2>
          <p className="leading-relaxed">
            Luldown is intended for personal use only. We encourage all users to respect the original creators
            whose content they download. Do not redistribute, resell, or claim ownership of content that
            belongs to others. Always credit creators when sharing their work.
          </p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm font-semibold text-foreground">Questions or feedback?</p>
        <p className="text-xs text-muted-foreground">
          Reach us at <a href="mailto:hello@luldown.com" className="text-primary hover:underline">hello@luldown.com</a>
        </p>
      </div>
    </div>
  );
}
