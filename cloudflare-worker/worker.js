/**
 * Luldown — TikTok Downloader Cloudflare Worker
 *
 * Smart fingerprinting:
 *   - Cloudflare tells us the visitor's country (cf.country)
 *   - We pick a browser + language that matches that country
 *   - No proxy pool — Cloudflare's global IPs handle geo-routing
 *   - Rate limiting — Cloudflare built-in (wrangler.toml)
 */

const TIKWM_API = "https://www.tikwm.com/api/";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Country fingerprint database ───────────────────────────────────────────────
// Each country has multiple browser profiles (Chrome desktop, Chrome mobile,
// Firefox, Safari, Samsung Browser, Edge) to randomize and avoid patterns.
// Language headers always match the country — never mix US language with Brazil IP.

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
    { ua: "Mozilla/5.0 (Linux; Android 14; Redmi 12C) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/121.0.0.0 Mobile Safari/537.36",               lang: "pt-BR,pt;q=0.9,en;q=0.8" },
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
    { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0",                             lang: "tr-TR,tr;q=0.9,en-US;q=0.8" },
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

// Fallback for unknown countries — generic English desktop
const FALLBACK = [
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",   lang: "en-US,en;q=0.9" },
  { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", lang: "en-US,en;q=0.9" },
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",                                   lang: "en-US,en;q=0.9" },
];

// ── Fingerprint picker ─────────────────────────────────────────────────────────

function getFingerprint(countryCode) {
  const profiles = FINGERPRINTS[countryCode] || FALLBACK;
  return profiles[Math.floor(Math.random() * profiles.length)];
}

// ── tikwm helpers ──────────────────────────────────────────────────────────────

async function callTikwm(tiktokUrl, countryCode) {
  const { ua, lang } = getFingerprint(countryCode);

  const form = new FormData();
  form.append("url", tiktokUrl);
  form.append("hd", "1");

  const res = await fetch(TIKWM_API, {
    method: "POST",
    headers: {
      "User-Agent":      ua,
      "Referer":         "https://www.tiktok.com/",
      "Accept-Language": lang,
    },
    body: form,
  });

  if (!res.ok) throw new Error(`tikwm HTTP ${res.status}`);
  return res.json();
}

function parseTikwm(data) {
  const author = data.author || {};
  const images = data.images || [];
  return {
    title:      data.title || "TikTok Video",
    author:     typeof author === "object" ? (author.nickname || "") : String(author),
    duration:   data.duration || 0,
    thumbnail:  data.cover || data.origin_cover || "",
    view_count: data.play_count || 0,
    like_count: data.digg_count || 0,
    is_photo:   images.length > 0,
    images,
    _play_nowm: data.play   || "",
    _hd_play:   data.hdplay || data.play || "",
    _music:     data.music  || "",
  };
}

// ── Response helpers ───────────────────────────────────────────────────────────

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
  return u.includes("tiktok.com") ? u : null;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Country from Cloudflare — used to pick matching browser + language
    const country = (request.cf && request.cf.country) || "US";

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET /health
    if (pathname === "/health" && method === "GET") {
      return json({ status: "ok", version: "3.1.0", engine: "cloudflare-worker", country });
    }

    // GET /api/token — compatibility stub (rate limiting is CF built-in now)
    if (pathname === "/api/token" && method === "GET") {
      return json({ token: "", ttl_seconds: 300 });
    }

    // POST /api/info
    if (pathname === "/api/info" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL. Please copy the link from TikTok app.", 400);

      let tikwmRes;
      try {
        tikwmRes = await callTikwm(tiktokUrl, country);
      } catch (e) {
        return err(`Download service unreachable: ${e.message}`);
      }

      if (tikwmRes.code !== 0 || !tikwmRes.data) {
        return err(tikwmRes.msg || "Could not fetch video info");
      }

      const p = parseTikwm(tikwmRes.data);
      return json({
        success:    true,
        title:      p.title,
        author:     p.author,
        duration:   p.duration,
        thumbnail:  p.thumbnail,
        view_count: p.view_count,
        like_count: p.like_count,
        is_photo:   p.is_photo,
        images:     p.images,
      });
    }

    // POST /api/download
    if (pathname === "/api/download" && method === "POST") {
      let body;
      try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

      const tiktokUrl = validateTikTokUrl(body.url);
      if (!tiktokUrl) return err("Invalid TikTok URL", 400);

      const format = body.format || "mp4_1080";
      if (!["mp4_720", "mp4_1080", "mp3"].includes(format)) {
        return err(`Unknown format: ${format}`, 400);
      }

      let tikwmRes;
      try {
        tikwmRes = await callTikwm(tiktokUrl, country);
      } catch (e) {
        return err(`Download service unreachable: ${e.message}`);
      }

      if (tikwmRes.code !== 0 || !tikwmRes.data) {
        return err(tikwmRes.msg || "Could not fetch video");
      }

      const p = parseTikwm(tikwmRes.data);

      let cdnUrl = "", filename = "luldown", ext = "mp4", mediaType = "video/mp4";

      if (format === "mp4_720") {
        cdnUrl   = p._play_nowm || p._hd_play;
        filename = "luldown_720p";
      } else if (format === "mp4_1080") {
        cdnUrl   = p._hd_play || p._play_nowm;
        filename = "luldown_1080p";
      } else if (format === "mp3") {
        cdnUrl    = p._music;
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
