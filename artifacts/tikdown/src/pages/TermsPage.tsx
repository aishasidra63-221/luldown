import { FileText, ChevronRight } from "lucide-react";

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

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025 · Please read carefully before use</p>
      </header>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Section title="Acceptance of Terms">
          <p>By accessing or using Luldown (<strong className="text-foreground">luldown.com</strong>), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this service.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Permitted Use">
          <ul className="space-y-1 list-disc list-inside">
            <li>Luldown is provided for <strong className="text-foreground">personal, non-commercial use only</strong>.</li>
            <li>You may download content solely for private viewing and personal archiving.</li>
            <li>Automated scraping, bulk downloading, or using the service via bots is strictly prohibited.</li>
            <li>You must not use Luldown to infringe upon the intellectual property rights of others.</li>
          </ul>
        </Section>

        <div className="border-t border-border" />

        <Section title="Content & Copyright">
          <p>All videos, audio, and images downloaded through Luldown remain the property of their respective creators and rights holders. Luldown does not host any media — it only resolves publicly available CDN URLs provided by TikTok's platform. You are solely responsible for how you use any downloaded content. Redistribution, resale, or public republishing of downloaded content without the creator's permission is prohibited.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="No Affiliation with TikTok">
          <p>Luldown is an independent service and is <strong className="text-foreground">not affiliated with, endorsed by, or connected to TikTok or ByteDance Ltd.</strong> in any way. TikTok™ is a trademark of ByteDance Ltd.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Limitation of Liability">
          <p>Luldown is provided "as is" without warranties of any kind. We are not responsible for any damages arising from the use or inability to use this service, including but not limited to data loss, service interruptions, or content unavailability. We reserve the right to modify or discontinue the service at any time without notice.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Changes to Terms">
          <p>We reserve the right to update these Terms at any time. Continued use of Luldown after changes are posted constitutes your acceptance of the revised Terms.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Contact">
          <p>For legal inquiries: <span className="text-primary">legal@luldown.com</span></p>
        </Section>
      </div>
    </div>
  );
}
