import { Shield, ChevronRight } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
        <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
        {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed pl-6">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025 · Effective immediately</p>
      </header>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Section title="What We Collect">
          <p>Luldown collects <strong className="text-foreground">no personal information</strong>. We do not require registration, login, or email. The only data processed is the TikTok URL you submit — it is used solely to resolve the video download link and is never stored permanently.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Cookies & Local Storage">
          <p>We use browser <strong className="text-foreground">localStorage</strong> only to store your download history locally on your device. This data never leaves your browser and can be cleared anytime from Settings. We do not use tracking cookies or advertising cookies.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Google reCAPTCHA">
          <p>We use Google reCAPTCHA v3 (invisible) to protect against automated bots. reCAPTCHA may collect device and behavioral data as per <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Privacy Policy</a>. No score or data is stored by Luldown.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Third-Party CDN">
          <p>Videos and media are served directly from TikTok's CDN to your browser. Luldown does not host, store, or cache any media files. We act only as a URL resolver — your browser downloads content directly from TikTok's servers.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Analytics">
          <p>We do not use Google Analytics, Facebook Pixel, or any third-party analytics platform. No behavioral data is sold or shared with advertisers.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Contact">
          <p>For privacy concerns, contact us at <span className="text-primary">legal@luldown.com</span></p>
        </Section>
      </div>
    </div>
  );
}
