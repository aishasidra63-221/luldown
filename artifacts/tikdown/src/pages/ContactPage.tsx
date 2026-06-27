import { useSEO } from "@/hooks/use-seo";
import { Mail, MessageSquare, Shield, Clock } from "lucide-react";

export default function ContactPage() {
  useSEO({
    title: "Contact Luldown — Get in Touch",
    description: "Contact the Luldown team for support or general inquiries. We aim to respond within 48 hours.",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Contact Us</h1>
        <p className="text-sm text-muted-foreground">We're here to help. Reach out for support, feedback, or legal inquiries.</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: MessageSquare, label: "General Support",   email: "support@luldown.com",   desc: "Questions about using Luldown, download issues, or feature requests.",     color: "text-primary"    },
          { icon: Shield,        label: "Legal Inquiry",      email: "legal@luldown.com",     desc: "Legal concerns and inquiries.",         color: "text-yellow-500" },
          { icon: Mail,          label: "General Inquiry",   email: "hello@luldown.com",     desc: "Business inquiries, partnerships, and general correspondence.",              color: "text-green-500"  },
          { icon: Clock,         label: "Response Time",     email: null,                    desc: "We aim to respond to all inquiries within 48 business hours.",               color: "text-blue-500"   },
        ].map(({ icon: Icon, label, email, desc, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="font-semibold text-sm text-foreground">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            {email && (
              <a href={`mailto:${email}`} className="text-xs text-primary hover:underline font-medium">
                {email}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 text-sm text-muted-foreground">
        <h2 className="font-bold text-foreground">Before contacting support</h2>
        <ul className="space-y-1 text-xs leading-relaxed list-disc list-inside">
          <li>Check our <a href="/faq" className="text-primary hover:underline">FAQ page</a> — most common questions are answered there.</li>
          <li>Make sure the TikTok link is from a public (not private) video.</li>
          <li>Try copying the link fresh from TikTok and pasting again.</li>
          <li>If the download opens a new tab, long-press on mobile or right-click → Save As on desktop.</li>
        </ul>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <p>Luldown is not affiliated with TikTok™ or ByteDance Ltd.</p>
      </div>
    </div>
  );
}
