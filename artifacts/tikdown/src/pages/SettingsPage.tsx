import { useState, useEffect } from "react";
import { useTheme } from "@/App";
import { checkHealth } from "@/lib/api";
import { Sun, Moon, Video, Music, Image, Film, Shield, Server, Gauge, Zap, RefreshCw } from "lucide-react";

function StatusDot({ status }: { status: "checking" | "online" | "offline" }) {
  return (
    <span className={`w-2.5 h-2.5 rounded-full inline-block ${
      status === "online" ? "bg-green-500" :
      status === "offline" ? "bg-destructive" :
      "bg-muted-foreground animate-pulse"
    }`} />
  );
}

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [checking, setChecking] = useState(false);

  const checkApi = async () => {
    setChecking(true);
    setApiStatus("checking");
    const ok = await checkHealth();
    setApiStatus(ok ? "online" : "offline");
    setChecking(false);
  };

  useEffect(() => { checkApi(); }, []);

  const INFO_ROWS = [
    { Icon: Server, label: "Version",    value: "2.0.0" },
    { Icon: Zap,    label: "Engine",     value: "yt-dlp + FastAPI" },
    { Icon: Gauge,  label: "Cache TTL",  value: "30 minutes" },
    { Icon: Shield, label: "Rate Limit", value: "10 req / minute" },
  ];

  const FORMATS = [
    { Icon: Video, label: "MP4 No Watermark", desc: "HD, no logo", color: "text-blue-500" },
    { Icon: Film,  label: "MP4 Original",     desc: "With watermark",  color: "text-purple-500" },
    { Icon: Music, label: "MP3 Audio",        desc: "192kbps",     color: "text-green-500" },
    { Icon: Image, label: "Photo / Slideshow",desc: "TikTok images", color: "text-orange-500" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your Luldown experience</p>
      </div>

      {/* Appearance */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base text-foreground">Appearance</h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark"
                ? <Moon className="w-5 h-5 text-primary" />
                : <Sun className="w-5 h-5 text-primary" />}
              <div>
                <p className="font-medium text-sm text-foreground">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Easy on the eyes" : "Bright and clean"}
                </p>
              </div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                theme === "dark" ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          {/* Theme picker */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: "light", label: "Light", Icon: Sun,
                preview: (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2">
                    <div className="h-2 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-red-400 rounded w-1/2" />
                  </div>
                )
              },
              {
                id: "dark", label: "Dark", Icon: Moon,
                preview: (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 mb-2">
                    <div className="h-2 bg-gray-700 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-red-500 rounded w-1/2" />
                  </div>
                )
              },
            ].map(({ id, label, Icon, preview }) => (
              <button
                key={id}
                onClick={() => { if (theme !== id) toggle(); }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  theme === id ? "border-primary bg-primary/5" : "border-border hover:border-border/80 bg-secondary"
                }`}
              >
                {preview}
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* API Status */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-base text-foreground">System Status</h2>
          <button
            onClick={checkApi}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="divide-y divide-border">
          {INFO_ROWS.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon className="w-4 h-4" />
                {label}
              </div>
              <span className="text-sm font-medium text-foreground">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Server className="w-4 h-4" />
              API Server
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <StatusDot status={apiStatus} />
              <span className={
                apiStatus === "online" ? "text-green-500" :
                apiStatus === "offline" ? "text-destructive" :
                "text-muted-foreground"
              }>
                {apiStatus === "checking" ? "Checking…" : apiStatus === "online" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base text-foreground">Supported Formats</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          {FORMATS.map(({ Icon, label, desc, color }) => (
            <div key={label} className="bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base text-foreground">Privacy & Security</h2>
        </div>
        <div className="p-5 space-y-3">
          {[
            "No account required — fully anonymous",
            "Downloaded files auto-deleted after 2 minutes",
            "History stored in your session only",
            "Rate limiting protects against abuse",
            "4-layer TikTok bypass for reliability",
            "yt-dlp auto-updates every night for best compatibility",
          ].map((text) => (
            <div key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
