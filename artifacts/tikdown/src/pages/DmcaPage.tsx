import { useSEO } from "@/hooks/use-seo";
import { ShieldAlert, ChevronRight } from "lucide-react";

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

export default function DmcaPage() {
  useSEO({
    title: "DMCA Policy — Luldown",
    description: "Luldown DMCA policy. We respect copyright and respond promptly to valid takedown requests. Contact legal@luldown.com for DMCA notices.",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">DMCA Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2026</p>
      </header>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-sm text-red-600 dark:text-red-400">
        <strong>Important:</strong> Luldown does not host, store, or cache any videos or media files. We only
        resolve publicly accessible links. Content is served directly from TikTok's own servers.
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <Section title="Our Position on Copyright">
          <p>Luldown respects the intellectual property rights of content creators and complies with the Digital
          Millennium Copyright Act (DMCA). We are committed to responding to valid copyright infringement notices
          in a timely manner.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="We Do Not Host Content">
          <p>Luldown is a URL-resolution service. We do not host, store, transcode, or serve any video, audio,
          or image files. All content is served directly from TikTok's content delivery network (CDN).
          For content removal from TikTok's servers, please contact TikTok directly at{" "}
          <a href="https://www.tiktok.com/legal/copyright-policy" target="_blank" rel="noopener noreferrer"
            className="text-primary hover:underline">tiktok.com/legal/copyright-policy</a>.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Filing a DMCA Notice">
          <p className="mb-3">If you believe that Luldown's service is being used in a way that infringes your copyright, you may submit a DMCA takedown request to:</p>
          <div className="bg-secondary rounded-lg p-3 font-mono text-xs text-foreground">
            legal@luldown.com
          </div>
          <p className="mt-3">Your notice must include:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
            <li>Your full legal name and contact information</li>
            <li>Identification of the copyrighted work claimed to be infringed</li>
            <li>The specific URL(s) on Luldown where the alleged infringement occurs</li>
            <li>A statement that you have a good-faith belief the use is not authorized</li>
            <li>A statement that the information in your notice is accurate, under penalty of perjury</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </Section>

        <div className="border-t border-border" />

        <Section title="Counter-Notice">
          <p>If you believe your content was removed in error, you may file a counter-notice at the same address.
          Your counter-notice must comply with DMCA Section 512(g)(3) requirements.</p>
        </Section>

        <div className="border-t border-border" />

        <Section title="Repeat Infringers">
          <p>Luldown reserves the right to terminate access for users who are found to be repeat infringers
          of third-party intellectual property rights.</p>
        </Section>
      </div>
    </div>
  );
}
