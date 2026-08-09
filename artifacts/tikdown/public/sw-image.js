/* ─── TikTok Image Download Service Worker ───────────────────────────────────
 * Intercepts  /sw-download?url=...&filename=...  navigation requests.
 * Fetches the image using the browser's own IP (residential / mobile) so
 * TikTok CDN never sees a datacenter address → no more intermittent 403s.
 * Returns the bytes with Content-Disposition: attachment so the browser
 * shows its native download bar — identical UX to the old Render-proxy path.
 * ─────────────────────────────────────────────────────────────────────────── */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

const ALLOWED_CDN = [
  "tiktok.com", "tiktokcdn.com", "tiktokcdn-us.com",
  "tiktokv.com", "musical.ly", "douyin.com", "bytecdn.cn", "snssdk.com",
];

function isTikTokCdn(url) {
  try {
    const h = new URL(url).hostname;
    return ALLOWED_CDN.some(d => h === d || h.endsWith("." + d));
  } catch { return false; }
}

self.addEventListener("fetch", event => {
  const reqUrl = new URL(event.request.url);
  if (reqUrl.pathname !== "/sw-download") return; // ignore everything else

  const targetUrl = reqUrl.searchParams.get("url");
  const filename  = (reqUrl.searchParams.get("filename") || "image.jpg")
                      .replace(/[^\w.\-]/g, "_");

  // Safety: only proxy TikTok CDN URLs
  if (!targetUrl || !isTikTokCdn(targetUrl)) return;

  event.respondWith(
    fetch(targetUrl, {
      headers: {
        "Referer": "https://www.tiktok.com/",
        "Accept":  "image/webp,image/jpeg,image/*,*/*;q=0.8",
      },
    })
    .then(resp => {
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ detail: `Image unavailable (${resp.status}).` }),
          { status: resp.status, headers: { "Content-Type": "application/json" } },
        );
      }
      const headers = new Headers();
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      headers.set("Content-Type", resp.headers.get("Content-Type") || "image/jpeg");
      const cl = resp.headers.get("Content-Length");
      if (cl) headers.set("Content-Length", cl);
      return new Response(resp.body, { status: 200, headers });
    })
    .catch(() =>
      new Response(
        JSON.stringify({ detail: "Failed to fetch image." }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    ),
  );
});
