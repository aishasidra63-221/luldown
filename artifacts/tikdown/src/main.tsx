import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "nprogress/nprogress.css";

// Disable browser scroll restoration — Chrome otherwise restores the last
// scroll position when the user closes and reopens the tab, landing them
// mid-page even though there is nothing there. We always start at the top.
if (typeof window !== "undefined") {
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

// Register the image-download service worker.
// It intercepts /sw-download requests so individual photo saves use the
// browser's own IP (no Render proxy needed) while still triggering the
// native browser download bar via window.location.href.
// Falls back to the Render proxy automatically if SW is not yet active.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-image.js", { scope: "/" }).catch(() => {
    // SW unavailable (non-HTTPS dev context, browser policy, etc.) —
    // downloadPhoto falls back to Render proxy silently.
  });
}

createRoot(document.getElementById("root")!).render(<App />);
