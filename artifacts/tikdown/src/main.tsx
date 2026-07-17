import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Unregister any previously installed Service Workers so stale caches
// don't block users from seeing the latest deployed version.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()));
}

createRoot(document.getElementById("root")!).render(<App />);
