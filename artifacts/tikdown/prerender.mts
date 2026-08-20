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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectRouteHead(
  template: string,
  seo: {
    title: string;
    description: string;
    canonical: string;
    language: string;
    direction: "ltr" | "rtl";
    hreflang: Array<{ hreflang: string; href: string }>;
    schema: Record<string, unknown>;
  },
): string {
  const escapedTitle = escapeHtml(seo.title);
  const escapedDescription = escapeHtml(seo.description);
  const escapedCanonical = escapeHtml(seo.canonical);
  const hreflang = seo.hreflang.map(({ hreflang, href }) =>
    `<link rel="alternate" href="${escapeHtml(href)}" hreflang="${escapeHtml(hreflang)}" />`
  ).join("\n    ");
  const schema = JSON.stringify(seo.schema).replace(/</g, "\\u003c");

  let html = template
    .replace(/<html\b[^>]*>/i, `<html lang="${escapeHtml(seo.language)}" dir="${seo.direction}">`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapedDescription}" />`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapedTitle}" />`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapedDescription}" />`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapedCanonical}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapedTitle}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapedDescription}" />`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapedCanonical}" />`);

  html = html.replace(
    /<!-- Hreflang[\s\S]*?<!-- JSON-LD Schema[\s\S]*?<!-- PWA -->/i,
    `<!-- Route hreflang -->\n    ${hreflang}\n\n    <!-- Route JSON-LD -->\n    <script id="route-jsonld" type="application/ld+json">${schema}</script>\n\n    <!-- PWA -->`,
  );

  return html;
}

// This release changed the generated HTML for every public route (route-level
// SEO heads, SSR content, and heading structure). Keep this date tied to that
// real content revision; do not bump it for a build that only changes assets.
const SITEMAP_CONTENT_REVISION = "2026-08-20";

function syncSitemapLastmod(): void {
  const sitemapPaths = [
    path.join(__dirname, "public/sitemap.xml"),
    path.join(__dirname, "dist/public/sitemap.xml"),
  ];

  for (const sitemapPath of sitemapPaths) {
    if (!fs.existsSync(sitemapPath)) continue;

    const source = fs.readFileSync(sitemapPath, "utf-8");
    const updated = source.replace(/<url>([\s\S]*?)<\/url>/gi, (full, contents: string) => {
      const withLastmod = contents.match(/<lastmod>[\s\S]*?<\/lastmod>/i)
        ? contents.replace(/<lastmod>[\s\S]*?<\/lastmod>/i, `\n    <lastmod>${SITEMAP_CONTENT_REVISION}</lastmod>`)
        : `${contents}\n    <lastmod>${SITEMAP_CONTENT_REVISION}</lastmod>\n  `;
      return `<url>${withLastmod}</url>`;
    });

    fs.writeFileSync(sitemapPath, updated);
  }
}

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
    render: (url: string) => Promise<string>;
  };
  const { getRouteSeo } = (await vite.ssrLoadModule("/src/lib/route-seo.ts")) as {
    getRouteSeo: (url: string) => Parameters<typeof injectRouteHead>[1];
  };

  console.log(`📄 Prerendering ${ROUTES.length} routes…\n`);

  let ok = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const route of ROUTES) {
    try {
        const appHtml = await render(route);
        const htmlWithBody = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );
        const html = injectRouteHead(htmlWithBody, getRouteSeo(route));

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

  if (fail === 0) {
    syncSitemapLastmod();
    console.log(`🗺️ Sitemap lastmod synced to ${SITEMAP_CONTENT_REVISION} for ${ok} updated routes.`);
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
