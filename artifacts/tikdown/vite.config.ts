import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT ?? "5000";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  define: {
    __RECAPTCHA_SITE_KEY__: JSON.stringify(process.env.RECAPTCHA_SITE_KEY ?? ""),
    __WORKER_URL__: JSON.stringify(process.env.WORKER_URL ?? ""),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "LulDown — TikTok Downloader",
        short_name: "LulDown",
        description: "Download TikTok videos without watermark. Free, fast, no login.",
        start_url: "/",
        display: "standalone",
        background_color: "#16133a",
        theme_color: "#7c3aed",
        orientation: "portrait-primary",
        icons: [
          { src: "/pwa-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/pwa-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Never let the SW's SPA navigation fallback swallow full-page navigations
        // to our own API (e.g. window.location.href = "/api/proxy?..." used for the
        // native download loading bar). Without this, the service worker intercepts
        // that navigation and serves cached index.html instead of hitting the API,
        // making downloads look like they redirect to the home page.
        navigateFallbackDenylist: [/^\/api\//, /^\/tikapi\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
    proxy: {
      "/tikapi": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tikapi/, ""),
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
