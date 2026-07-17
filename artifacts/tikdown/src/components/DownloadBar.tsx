import { useEffect, useState } from "react";

export default function DownloadBar() {
  const [progress, setProgress] = useState<number | null>(null); // null = hidden, -1 = indeterminate, 0-100 = percent

  useEffect(() => {
    const handler = (e: Event) => {
      setProgress((e as CustomEvent).detail.progress);
    };
    window.addEventListener("luldown:progress", handler);
    return () => window.removeEventListener("luldown:progress", handler);
  }, []);

  if (progress === null) return null;

  const indeterminate = progress === -1;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      background: "rgba(255,255,255,0.08)",
      zIndex: 99999,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        background: "linear-gradient(90deg, #6366f1, #818cf8)",
        width: indeterminate ? "40%" : `${progress}%`,
        transition: indeterminate ? "none" : "width 0.18s ease",
        animation: indeterminate ? "luldown-indeterminate 1.4s ease-in-out infinite" : "none",
        borderRadius: "0 2px 2px 0",
        boxShadow: "0 0 8px rgba(99,102,241,0.7)",
      }} />
      <style>{`
        @keyframes luldown-indeterminate {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { width: 60%; }
          100% { transform: translateX(280%); width: 40%; }
        }
      `}</style>
    </div>
  );
}
