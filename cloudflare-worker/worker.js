/**
 * Luldown — TikTok Downloader Cloudflare Worker (v4.0)
 *
 * ssstik-style two-API architecture — NO third parties:
 *   Phase 1 — TikTok Public oembed API  →  title, author, thumbnail
 *   Phase 2 — TikTok Mobile API (aweme/v1/feed)  →  CDN video URL (no watermark)
 *
 * IP diversity:
 *   Cloudflare's 300+ global PoPs provide automatic IP rotation per request.
 *   cf.country picks matching web browser + Android device fingerprints.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── TikTok Mobile API hosts ──────────────────────────────────────────────────
// Multiple hosts — picked randomly per request for distribution
const MOBILE_API_HOSTS = [
  "api22-normal-c-useast2a.tiktokv.com",
  "api16-normal-c-useast1a.tiktokv.com",
  "api19-normal-c-useast1a.tiktokv.com",
  "api21-normal-c-alisg.tiktokv.com",
  "api26-normal-c-useast2a.tiktokv.com",
];

// ── Android device profiles for mobile API fingerprinting ───────────────────
// Randomized per request — mimics real TikTok Android app traffic
const ANDROID_DEVICES = [
  { model: "Pixel 6",           build: "SD1A.210817.015.A4",  android: "12", dpi: "411" },
  { model: "Pixel 7",           build: "TD1A.220804.009.A2",  android: "13", dpi: "411" },
  { model: "Pixel 8",           build: "UP1A.231005.007",     android: "14", dpi: "428" },
  { model: "Pixel 7a",          build: "UP1A.231005.007",     android: "14", dpi: "429" },
  { model: "SM-S921B",          build: "UP1A.231005.007",     android: "14", dpi: "393" },
  { model: "SM-S918B",          build: "UP1A.231005.007",     android: "14", dpi: "393" },
  { model: "SM-A546E",          build: "TP1A.220624.014",     android: "13", dpi: "397" },
  { model: "SM-A135F",          build: "TP1A.220624.014",     android: "13", dpi: "401" },
  { model: "Redmi Note 12",     build: "TKQ1.220829.002",     android: "13", dpi: "395" },
  { model: "Redmi Note 12 Pro", build: "TKQ1.220829.002",     android: "13", dpi: "395" },
  { model: "POCO X5 Pro",       build: "TKQ1.220829.002",     android: "13", dpi: "395" },
  { model: "vivo V29e",         build: "TP1A.220624.014",     android: "13", dpi: "393" },
  { model: "OPPO A77 5G",       build: "TP1A.220624.014",     android: "13", dpi: "401" },
  { model: "Infinix X6739",     build: "TP1A.220624.014",     android: "13", dpi: "395" },
  { model: "motorola moto g84",  build: "T2SNS33.73-11-15",   android: "13", dpi: "400" },
];

// ── Country fingerprint database ─────────────────────────────────────────────
// Each country has multiple browser profiles to randomize web requests.
// Language headers always match the country.
const FINGERPRINTS = {
  US: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-US,en;q=0.9" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "en-US,en;q=0.9" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "en-US,en;q=0.9" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-US,en;q=0.9" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",                             lang: "en-US,en;q=0.9" },
    { ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                  lang: "en-US,en;q=0.9" },
  ],
  GB: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-GB,en;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "en-GB,en;q=0.9" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "en-GB,en;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-GB,en;q=0.9" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "en-GB,en;q=0.9" },
  ],
  CA: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "en-CA,en;q=0.9" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-CA,en;q=0.9,fr-CA;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "en-CA,en;q=0.9" },
  ],
  AU: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-AU,en;q=0.9,en-GB;q=0.8,en-US;q=0.7" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "en-AU,en;q=0.9" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-AU,en;q=0.9" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "en-AU,en;q=0.9" },
  ],
  DE: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "de-DE,de;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "de-DE,de;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",                             lang: "de-DE,de;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                  lang: "de-DE,de;q=0.9,en-US;q=0.8" },
  ],
  FR: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "fr-FR,fr;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "fr-FR,fr;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "fr-FR,fr;q=0.9,en-US;q=0.8" },
  ],
  IT: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "it-IT,it;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "it-IT,it;q=0.9,en-US;q=0.8" },
  ],
  ES: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "es-ES,es;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "es-ES,es;q=0.9,en-US;q=0.8" },
  ],
  PT: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "pt-PT,pt;q=0.9,en-US;q=0.8" },
  ],
  BR: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 13; motorola moto g84 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",                         lang: "pt-BR,pt;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "pt-BR,pt;q=0.9,en-US;q=0.8" },
  ],
  MX: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; motorola moto g84 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",                         lang: "es-MX,es;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "es-MX,es;q=0.9,en-US;q=0.8" },
  ],
  AR: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "es-AR,es;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.5" },
  ],
  CO: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "es-CO,es;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "es-CO,es;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "es-CO,es;q=0.9,en-US;q=0.8,en;q=0.5" },
  ],
  IN: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-M546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",                        lang: "hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; vivo V29e) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",                                    lang: "en-IN,en;q=0.9,hi;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/120.0.0.0 Mobile Safari/537.36",                 lang: "en-IN,en;q=0.9,hi;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 12; Realme C33) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.193 Mobile Safari/537.36",                              lang: "en-IN,en-GB;q=0.9,en-US;q=0.8,hi;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7" },
  ],
  PK: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ur-PK,ur;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",                            lang: "en-PK,en;q=0.9,ur;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/120.0.0.0 Mobile Safari/537.36",                 lang: "ur-PK,ur;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-PK,en;q=0.9,ur;q=0.8" },
  ],
  BD: [
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",                            lang: "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/120.0.0.0 Mobile Safari/537.36",                 lang: "bn-BD,bn;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; TECNO KI7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",                               lang: "bn-BD,bn;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7" },
  ],
  ID: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",                            lang: "id-ID,id;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "id-ID,id;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Infinix X6739) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",                           lang: "id-ID,id;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 12; POCO X4 Pro 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",                              lang: "id-ID,id;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7" },
  ],
  PH: [
    { ua: "Mozilla/5.0 (Linux; Android 13; SM-A236B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "en-PH,en;q=0.9,fil;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; TECNO KJ6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",                                   lang: "fil-PH,fil;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; vivo Y16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",                                lang: "en-PH,en;q=0.9,fil;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/120.0.0.0 Mobile Safari/537.36",                 lang: "en-PH,en;q=0.9,fil;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-PH,en;q=0.9" },
  ],
  VN: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36",                           lang: "vi-VN,vi;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",                             lang: "vi-VN,vi;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; OPPO A77 5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",                                  lang: "vi-VN,vi;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; vivo Y36) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",                                     lang: "vi-VN,vi;q=0.9,en;q=0.8" },
  ],
  TH: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; OPPO Find X6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",                             lang: "th-TH,th;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "th-TH,th;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "th-TH,th;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "th-TH,th;q=0.9,en;q=0.8" },
  ],
  MY: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",                            lang: "en-MY,en;q=0.9,ms;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ms-MY,ms;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-MY,en;q=0.9,ms;q=0.8" },
  ],
  SG: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-SG,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-SG,en;q=0.9,zh-CN;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "en-SG,en;q=0.9" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "en-SG,en;q=0.9,zh-SG;q=0.8" },
  ],
  JP: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "ja-JP,ja;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "ja-JP,ja;q=0.9" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SO-51D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                   lang: "ja-JP,ja;q=0.9,en-US;q=0.8" },
  ],
  KR: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "ko-KR,ko;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ko-KR,ko;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "ko-KR,ko;q=0.9,en;q=0.8" },
  ],
  CN: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; Xiaomi 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                lang: "zh-CN,zh;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; HUAWEI Pura 70) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",                               lang: "zh-CN,zh;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "zh-CN,zh;q=0.9,en;q=0.8" },
  ],
  TW: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "zh-TW,zh;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "zh-TW,zh;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "zh-TW,zh;q=0.9,en-US;q=0.8" },
  ],
  HK: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "zh-HK,zh;q=0.9,en-HK;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "zh-HK,zh;q=0.9,en-HK;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "zh-HK,zh;q=0.9,en;q=0.8" },
  ],
  RU: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 YaBrowser/24.6 Safari/537.36",                             lang: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ru-RU,ru;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ru-RU,ru;q=0.9,en-US;q=0.8" },
  ],
  UA: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "uk-UA,uk;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "uk-UA,uk;q=0.9,en-US;q=0.8" },
  ],
  PL: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "pl-PL,pl;q=0.9,en-US;q=0.8" },
  ],
  TR: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                                                            lang: "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.5" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A235F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "tr-TR,tr;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",                                          lang: "tr-TR,tr;q=0.9,en;q=0.8" },
  ],
  SA: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "ar-SA,ar;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "ar-SA,ar;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ar-SA,ar;q=0.9,en-US;q=0.8" },
  ],
  AE: [
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",                 lang: "ar-AE,ar;q=0.9,en;q=0.8" },
  ],
  EG: [
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 13; TECNO KI7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",                               lang: "ar-EG,ar;q=0.9,en;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "ar-EG,ar;q=0.9,en-US;q=0.8" },
  ],
  NG: [
    { ua: "Mozilla/5.0 (Linux; Android 13; TECNO KI7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36",                               lang: "en-NG,en;q=0.9,yo;q=0.8,ha;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; Infinix X6739) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36",                           lang: "en-NG,en;q=0.9,ig;q=0.8" },
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-NG,en;q=0.9,en-US;q=0.8" },
    { ua: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/120.0.0.0 Mobile Safari/537.36",                 lang: "en-NG,en;q=0.9" },
  ],
  ZA: [
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",                                            lang: "en-ZA,en;q=0.9,af;q=0.8,zu;q=0.7" },
    { ua: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",                                 lang: "en-ZA,en;q=0.9,af;q=0.8" },
    { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",                    lang: "en-ZA,en;q=0.9" },
  ],
};

const FALLBACK = [
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",   lang: "en-US,en;q=0.9" },
  { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", lang: "en-US,en;q=0.9" },
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                   lang: "en-US,en;q=0.9" },
];

// ── Pickers ──────────────────────────────────────────────────────────────────

function getFingerprint(countryCode) {
  const profiles = FINGERPRINTS[countryCode] || FALLBACK;
  return profiles[Math.floor(Math.random() * profiles.length)];
}

function getRandomDevice() {
  return ANDROID_DEVICES[Math.floor(Math.random() * ANDROID_DEVICES.length)];
}

function getRandomHost() {
  return MOBILE_API_HOSTS[Math.floor(Math.random() * MOBILE_API_HOSTS.length)];
}

function randomDeviceId() {
  return Math.floor(1e17 + Math.random() * 9e17).toString();
}

// ── Phase 1: Public oembed API — metadata ────────────────────────────────────
// TikTok's official public endpoint. No auth, no signing required.
// Returns: title, author_name, thumbnail_url

async function fetchOembed(tiktokUrl, webFingerprint) {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`;
  const res = await fetch(endpoint, {
    headers: {
      "User-Agent":      webFingerprint.ua,
      "Accept":          "application/json",
      "Accept-Language": webFingerprint.lang,
      "Referer":         "https://www.tiktok.com/",
    },
  });
  if (!res.ok) throw new Error(`oembed HTTP ${res.status}`);
  return res.json();
}

// ── Phase 2: TikTok Mobile API — CDN URLs ────────────────────────────────────
// Mimics TikTok's Android app. aweme/v1/feed returns full video metadata
// including multiple CDN URLs. play_addr URLs don't have the watermark
// baked into the file (watermark is added client-side by the app).
// Retries up to 2 different hosts before giving up.

async function _fetchMobileAPIOnce(videoId, device, host) {
  const devId   = randomDeviceId();
  const version = "300904";
  const appVer  = "30.9.4";

  const params = new URLSearchParams({
    aweme_id:              videoId,
    version_code:          version,
    version_name:          appVer,
    app_name:              "musical_ly",
    app_version:           appVer,
    channel:               "App",
    device_id:             devId,
    os_version:            device.android,
    device_platform:       "android",
    device_type:           device.model,
    resolution:            `${device.dpi}*${device.dpi}`,
    dpi:                   device.dpi,
    app_type:              "normal",
    manifest_version_code: "2022600030",
    ts:                    Math.floor(Date.now() / 1000).toString(),
  });

  const ua = `com.ss.android.ugc.trill/${version} (Linux; U; Android ${device.android}; en_US; ${device.model}; Build/${device.build}; Cronet/TTNetVersion:c5b2a578 3d6d7cd7 MultiProcessNotSupport)`;
  const url = `https://${host}/aweme/v1/feed/?${params}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":  ua,
      "Accept":      "application/json",
      "sdk-version": "2",
      "X-SS-DP":     "1233",
    },
  });

  if (!res.ok) throw new Error(`Mobile API HTTP ${res.status} from ${host}`);
  const data = await res.json();

  if (!data.aweme_list || data.aweme_list.length === 0) {
    throw new Error("Video not found or private");
  }
  return data.aweme_list[0];
}

async function fetchMobileAPI(videoId, device) {
  // Shuffle hosts — pick 2 different ones to try
  const shuffled = [...MOBILE_API_HOSTS].sort(() => Math.random() - 0.5);
  let lastError;
  for (const host of shuffled.slice(0, 2)) {
    try {
      return await _fetchMobileAPIOnce(videoId, device, host);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

// ── Resolve short URLs (vm.tiktok.com, vt.tiktok.com, tiktok.com/t/) ────────
async function resolveUrl(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":      "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.82 Mobile Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer":         "https://www.tiktok.com/",
    },
  });
  return { finalUrl: res.url, html: await res.text() };
}

// ── Extract video ID from TikTok URL ────────────────────────────────────────
function extractIdFromString(s) {
  const m = s.match(/\/video\/(\d{10,20})/);
  return m ? m[1] : null;
}

function extractIdFromHtml(html) {
  const patterns = [
    /["']\/video\/(\d{15,20})["']/,
    /"aweme_id"\s*:\s*"(\d{15,20})"/,
    /"video_id"\s*:\s*"(\d{15,20})"/,
    /\/video\/(\d{15,20})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

async function extractVideoId(rawUrl) {
  const url = rawUrl.trim();

  // Fast path — full URL already has the video ID
  const direct = extractIdFromString(url);
  if (direct) return direct;

  // Short link (/t/, vm., vt.) — follow redirects with browser UA
  let finalUrl, html;
  try {
    ({ finalUrl, html } = await resolveUrl(url));
  } catch (e) {
    throw new Error(`Could not resolve URL: ${e.message}`);
  }

  // Check resolved URL
  const fromUrl = extractIdFromString(finalUrl);
  if (fromUrl) return fromUrl;

  // Scrape HTML for video ID
  const fromHtml = extractIdFromHtml(html);
  if (fromHtml) return fromHtml;

  throw new Error("Could not extract video ID. Make sure the link is a valid public TikTok video.");
}

// ── Parse aweme response into our format ─────────────────────────────────────
// Prefer download_addr over play_addr — download_addr is the watermark-free
// download link; play_addr is the streaming URL (may have client-side watermark).
function getBestAddrUrl(bitRateEntry) {
  return (
    bitRateEntry?.download_addr?.url_list?.[0] ||
    bitRateEntry?.play_addr?.url_list?.[0] ||
    ""
  );
}

function parseMobileAPI(aweme) {
  const video  = aweme.video  || {};
  const music  = aweme.music  || {};
  const author = aweme.author || {};
  const stats  = aweme.statistics || {};
  const imgPost = aweme.image_post_info || null;

  const images = imgPost
    ? (imgPost.images || []).map(img => {
        const urls = img.display_image?.url_list || img.owner_watermark_image?.url_list || [];
        return urls[0] || "";
      }).filter(Boolean)
    : [];

  const isPhoto = images.length > 0;

  // Sort by bitrate descending; entries must have at least one of play_addr / download_addr
  const bitRates = (video.bit_rate || [])
    .filter(b => b.play_addr?.url_list?.length > 0 || b.download_addr?.url_list?.length > 0)
    .sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0));

  // HD = highest bitrate, SD = second highest (fallback to same as HD)
  const hdFallback = video.download_addr?.url_list?.[0] || video.play_addr?.url_list?.[0] || "";
  const hdUrl    = bitRates[0] ? getBestAddrUrl(bitRates[0]) : hdFallback;
  const sdUrl    = bitRates[1] ? getBestAddrUrl(bitRates[1]) : (hdFallback || hdUrl);
  const audioUrl = music.play_url?.url_list?.[0] || "";

  const thumbnail = video.cover?.url_list?.[0]
    || video.origin_cover?.url_list?.[0]
    || video.animated_cover?.url_list?.[0]
    || "";

  return {
    title:      aweme.desc || "TikTok Video",
    author:     author.nickname || author.unique_id || "",
    duration:   Math.floor((aweme.duration || video.duration || 0) / 1000),
    thumbnail,
    view_count: stats.play_count  || 0,
    like_count: stats.digg_count  || 0,
    comment_count: stats.comment_count || 0,
    share_count:   stats.share_count   || 0,
    is_photo:   isPhoto,
    images,
    _hd_url:    hdUrl,
    _sd_url:    sdUrl,
    _audio_url: audioUrl,
  };
}

// ── Response helpers ──────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(detail, status = 422) {
  return json({ detail }, status);
}

function validateTikTokUrl(raw) {
  const u = (raw || "").trim();
  if (!u.startsWith("http")) return null;
  if (u.includes("tiktok.com") || u.includes("douyin.com")) return u;
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method  = request.method;
    const country = (request.cf && request.cf.country) || "US";

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({
        status:  "ok",
        version: "4.0.0",
        engine:  "tiktok-direct",
        country,
      });
    }

    // GET /api/token — compatibility stub
    if (pathname === "/api/token" && method === "GET") {
      return json({ token: "", ttl_seconds: 300 });
    }

    // POST /api/info — Phase 1 + Phase 2 combined for metadata
    if (pathname === "/api/info" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400);

      let videoId;
      try {
        videoId = await extractVideoId(tiktokUrl);
      } catch (e) {
        return err(`Could not resolve video ID: ${e.message}`);
      }

      const device = getRandomDevice();

      let aweme;
      try {
        aweme = await fetchMobileAPI(videoId, device);
      } catch (e) {
        return err(`Failed to fetch video info: ${e.message}`);
      }

      const p = parseMobileAPI(aweme);

      // Enrich thumbnail via oembed if mobile API didn't return one
      if (!p.thumbnail) {
        try {
          const fp     = getFingerprint(country);
          const oembed = await fetchOembed(tiktokUrl, fp);
          p.thumbnail  = oembed.thumbnail_url || "";
          if (!p.title || p.title === "TikTok Video") p.title = oembed.title || p.title;
          if (!p.author) p.author = oembed.author_name || "";
        } catch (_) {}
      }

      return json({
        success:       true,
        title:         p.title,
        author:        p.author,
        duration:      p.duration,
        thumbnail:     p.thumbnail,
        view_count:    p.view_count,
        like_count:    p.like_count,
        comment_count: p.comment_count,
        share_count:   p.share_count,
        is_photo:      p.is_photo,
        images:        p.images,
        download_urls: {
          mp4_1080: p._hd_url,
          mp4_720:  p._sd_url,
          mp3:      p._audio_url,
        },
      });
    }

    // POST /api/download — returns CDN URL, zero server bandwidth
    if (pathname === "/api/download" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400);

      const format = body.format || "mp4_1080";
      if (!["mp4_720", "mp4_1080", "mp3"].includes(format)) {
        return err(`Unknown format: ${format}`, 400);
      }

      let videoId;
      try {
        videoId = await extractVideoId(tiktokUrl);
      } catch (e) {
        return err(`Could not resolve video ID: ${e.message}`);
      }

      const device = getRandomDevice();

      let aweme;
      try {
        aweme = await fetchMobileAPI(videoId, device);
      } catch (e) {
        return err(`Failed to fetch video: ${e.message}`);
      }

      const p = parseMobileAPI(aweme);

      let cdnUrl = "", filename = "luldown", ext = "mp4", mediaType = "video/mp4";

      if (format === "mp4_1080") {
        cdnUrl   = p._hd_url;
        filename = "luldown_1080p";
      } else if (format === "mp4_720") {
        cdnUrl   = p._sd_url;
        filename = "luldown_720p";
      } else if (format === "mp3") {
        cdnUrl    = p._audio_url;
        filename  = "luldown_audio";
        ext       = "mp3";
        mediaType = "audio/mpeg";
      }

      if (!cdnUrl) {
        return err("Download URL not available. The video may be private or region-restricted.");
      }

      return json({
        success:    true,
        cdn_url:    cdnUrl,
        all_images: p.images,
        filename:   `${filename}.${ext}`,
        media_type: mediaType,
        title:      p.title,
        author:     p.author,
        format,
      });
    }

    return json({ error: "Not found" }, 404);
  },
};
