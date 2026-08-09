import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "nprogress/nprogress.css";

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
