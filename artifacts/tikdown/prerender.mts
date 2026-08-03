/**
 * Static prerender script.
 *
 * Run after `vite build`:
 *   pnpm --filter @workspace/tikdown run prerender
 *
 * For every route in ROUTES it:
 *   1. Renders the React app to an HTML string via entry-server.tsx
 *   2. Injects that string into the built index.html (keeps fingerprinted assets)
 *   3. Writes dist/public/<route>/index.html
 *
 * Google then gets full HTML on first request — no JS wait needed.
 */
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Route list ──────────────────────────────────────────────────────────────

const NON_EN_LANGS = [
  "ur","hi","bn","id","ar","tr","es","pt","vi","fr","de","ja","ko","th","it","pl","tl","ms","uk",
];

const LANG_TOOLS = [
  "/mp3", "/story", "/thumbnail", "/viewer",
  "/apk", "/how-to-download-tiktok-video",
];

const BLOG_SLUGS = [
  "how-to-download-tiktok-without-watermark",
  "tiktok-video-downloader-online-free",
  "download-tiktok-as-mp3",
  "download-tiktok-on-iphone",
  "tiktok-photo-slideshow-downloader",
  "download-tiktok-on-pc",
  "tiktok-1080p-hd-download",
  "tiktok-downloader-android",
  "save-tiktok-videos-online",
  "tiktok-no-watermark-2025",
  "tiktok-video-for-whatsapp-status",
  "tiktok-video-download-free-no-app",
  "tiktok-iphone-download-guide-2026",
];

const ROUTES: string[] = [
  // ── English tool pages ──
  "/", "/mp3", "/story", "/thumbnail", "/viewer",
  "/apk", "/how-to-download-tiktok-video", "/tiktok-for-whatsapp-status",
  // ── English competitor / SEO pages ──
  "/ssstik-alternative", "/snaptik-alternative", "/musicaldown-alternative",
  "/savetik-alternative", "/tikmate-alternative",
  "/ssstik-not-working", "/snaptik-not-working", "/tikmate-not-working",
  "/musicaldown-not-working", "/savett-not-working",
  "/ssstik-vs-luldown", "/snaptik-vs-luldown", "/tikmate-vs-luldown",
  "/musicaldown-vs-luldown", "/savett-vs-luldown",
  // ── Utility ──
  "/privacy", "/faq", "/terms", "/disclaimer", "/blog",
  // ── Blog posts ──
  ...BLOG_SLUGS.map(s => `/blog/${s}`),
  // ── Language home pages ──
  ...NON_EN_LANGS.map(l => `/${l}`),
  // ── Language tool pages ──
  ...NON_EN_LANGS.flatMap(l => LANG_TOOLS.map(t => `/${l}${t}`)),
];

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const distDir = path.join(__dirname, "dist/public");

  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error(
      "dist/public/index.html not found — run `vite build` first."
    );
  }

  // Use the BUILT template so fingerprinted JS/CSS URLs are preserved.
  const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

  console.log(`🔨 Starting Vite SSR server…`);
  const vite = await createServer({
    root: __dirname,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  const { render } = (await vite.ssrLoadModule("/src/entry-server.tsx")) as {
    render: (url: string) => string;
  };

  console.log(`📄 Prerendering ${ROUTES.length} routes…\n`);

  let ok = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const route of ROUTES) {
    try {
      const appHtml = render(route);
      const html = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      const outPath =
        route === "/"
          ? path.join(distDir, "index.html")
          : path.join(distDir, route.slice(1), "index.html");

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      ok++;
      process.stdout.write(`  ✓ ${route}\n`);
    } catch (e) {
      fail++;
      failures.push(route);
      process.stdout.write(`  ✗ ${route}: ${(e as Error).message}\n`);
    }
  }

  await vite.close();

  console.log(
    `\n✅ Done — ${ok} prerendered, ${fail} failed` +
      (failures.length ? `\n   Failed: ${failures.join(", ")}` : "")
  );

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
