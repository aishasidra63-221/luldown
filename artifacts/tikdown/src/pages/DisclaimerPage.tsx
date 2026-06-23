import { AlertTriangle, ChevronRight } from "lucide-react";

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

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Disclaimer</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
      </header>

      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-600 dark:text-yellow-400">
        <strong>Important:</strong> Luldown is an independent tool not affiliated with TikTok or ByteDance. Please use this service responsibly and respect creators' rights.
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Section title="No Affiliation">
          <p>Luldown is an independent, third-party service. We are not associated with, sponsored by, or endorsed by <strong className="text-foreground">TikTok™</strong> or <strong className="text-foreground">ByteDance Ltd.</strong> All trademarks, service marks, and company names are the property of their respective owners.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Personal Use Only">
          <p>This tool is intended strictly for <strong className="text-foreground">personal and educational use</strong>. Downloading TikTok content for commercial purposes, redistribution, or public display without the consent of the original creator may violate copyright law and TikTok's Terms of Service. Users are solely responsible for ensuring their use complies with applicable laws.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Copyright Notice">
          <p>All videos, images, and audio accessed through Luldown are protected by copyright and belong to their original creators. Luldown does not store, reproduce, or redistribute any media — it only provides a technical link to publicly accessible CDN URLs already hosted by TikTok's infrastructure.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Service Accuracy & Availability">
          <p>We do not guarantee that Luldown will be available at all times, error-free, or that all videos can be downloaded. Service availability depends on TikTok's API and CDN infrastructure, which may change without notice. We accept no liability for failed downloads, quality degradation, or service outages.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="User Responsibility">
          <p>By using Luldown, you acknowledge that you are solely responsible for your actions and any content you download. Do not download content you do not have the right to save. Always credit original creators when sharing content you have legally obtained.</p>
        </Section>
      </div>
    </div>
  );
}
