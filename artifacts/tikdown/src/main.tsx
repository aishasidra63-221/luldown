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
// Download All ZIP can use /sw-download when the worker controls the page.
// Individual photo saves intentionally use the Render proxy path in api.ts.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-image.js", { scope: "/" }).catch(() => {
    // SW unavailable (non-HTTPS dev context, browser policy, etc.) —
    // Download All ZIP falls back to the Worker/Render proxy in api.ts.
  });
}

createRoot(document.getElementById("root")!).render(<App />);
