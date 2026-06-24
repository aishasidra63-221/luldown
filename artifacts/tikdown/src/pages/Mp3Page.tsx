import { useSEO } from "@/hooks/use-seo";
import DownloaderBox from "@/components/DownloaderBox";
import { ChevronRight, Music, Headphones, Smartphone, Lock } from "lucide-react";

const FEATURES = [
  { icon: Music,       label: "192kbps Audio",  desc: "High-quality MP3",      color: "text-green-500"  },
  { icon: Headphones,  label: "Original Sound", desc: "Full audio track",       color: "text-yellow-500" },
  { icon: Lock,        label: "100% Private",   desc: "No data stored",         color: "text-blue-500"   },
  { icon: Smartphone,  label: "All Devices",    desc: "iPhone, Android & more", color: "text-purple-500" },
];

const FAQS = [
  { q: "How do I convert TikTok to MP3?", a: "Copy the TikTok video link, paste it into the box above, click Fetch, then click the 'MP3 Audio' button. Your audio will download instantly." },
  { q: "What is the audio quality?", a: "Luldown downloads audio at up to 192kbps — clear, high-quality sound suitable for ringtones, listening offline, or repurposing content." },
  { q: "Can I download the background music from a TikTok?", a: "Yes. If a TikTok uses a song, you can extract the audio and save it as an MP3 file directly to your device." },
  { q: "Is TikTok MP3 download free?", a: "Yes, completely free. No subscription, no account, no limits. Download as many TikTok audios as you need." },
  { q: "Does this work on iPhone?", a: "Yes. Luldown is a web tool that works on any browser — iPhone Safari, Android Chrome, or any desktop browser." },
];

export default function Mp3Page() {
  useSEO({
    title: "TikTok MP3 Downloader — Extract TikTok Audio Free",
    description: "Convert TikTok videos to MP3 audio in 192kbps quality. Free TikTok audio downloader — no watermark, no login, works on any device.",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <header className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          TikTok MP3 Downloader<br />
          <span className="text-primary">Extract Audio Free</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Convert any TikTok video to MP3 audio in seconds — 192kbps quality, no login required.
        </p>
      </header>

      <DownloaderBox highlightFormat="mp3" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FEATURES.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <article className="space-y-6 text-sm text-muted-foreground border-t border-border pt-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Download TikTok Audio as MP3</h2>
          <p className="leading-relaxed">
            Luldown's TikTok MP3 downloader lets you extract the audio from any public TikTok video and
            save it directly to your device. Perfect for saving songs you discovered on TikTok, creating
            ringtones, making podcast clips, or just listening offline without needing the app.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> High Quality 192kbps MP3
            </h3>
            <p>Every audio download is at 192kbps — crisp and clear. Great for music discovery, ringtones, sound clips, and offline listening.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Save TikTok Songs & Sounds
            </h3>
            <p>Found a song on TikTok you love? Extract the full audio track and save it as an MP3 file directly to your phone or computer.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> No Conversion Needed
            </h3>
            <p>No extra steps, no waiting — Luldown instantly gives you the MP3 file. Just paste, click MP3, and your audio downloads.</p>
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground mb-2 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-primary" /> Works on iPhone & Android
            </h3>
            <p>Our MP3 extractor is a mobile-friendly web tool — no app installation needed. Works directly in Safari, Chrome, and all major browsers.</p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-foreground text-sm mb-1">{q}</h3>
                <p className="text-xs leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
