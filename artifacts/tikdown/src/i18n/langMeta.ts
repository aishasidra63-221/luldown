export type Lang = "en" | "ur" | "hi" | "bn" | "id" | "ar" | "tr" | "es" | "pt" | "ru" | "vi" | "fr" | "de" | "ja" | "ko" | "th" | "it" | "pl";
export type PageKey = "home" | "mp3" | "story" | "thumbnail" | "viewer" | "apk" | "howto";

export interface LangMeta {
  code: Lang;
  urlPrefix: string;
  label: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  hreflang: string;
}

export const LANG_META: Record<Lang, LangMeta> = {
  en: { code: "en", urlPrefix: "",    label: "EN",    nativeName: "English",    dir: "ltr", hreflang: "en" },
  ur: { code: "ur", urlPrefix: "/ur", label: "UR",    nativeName: "اردو",       dir: "rtl", hreflang: "ur" },
  hi: { code: "hi", urlPrefix: "/hi", label: "HI",    nativeName: "हिंदी",      dir: "ltr", hreflang: "hi" },
  bn: { code: "bn", urlPrefix: "/bn", label: "BN",    nativeName: "বাংলা",      dir: "ltr", hreflang: "bn" },
  id: { code: "id", urlPrefix: "/id", label: "ID",    nativeName: "Indonesia",  dir: "ltr", hreflang: "id" },
  ar: { code: "ar", urlPrefix: "/ar", label: "AR",    nativeName: "العربية",    dir: "rtl", hreflang: "ar" },
  tr: { code: "tr", urlPrefix: "/tr", label: "TR",    nativeName: "Türkçe",     dir: "ltr", hreflang: "tr" },
  es: { code: "es", urlPrefix: "/es", label: "ES",    nativeName: "Español",    dir: "ltr", hreflang: "es" },
  pt: { code: "pt", urlPrefix: "/pt", label: "PT",    nativeName: "Português",  dir: "ltr", hreflang: "pt" },
  ru: { code: "ru", urlPrefix: "/ru", label: "RU",    nativeName: "Русский",    dir: "ltr", hreflang: "ru" },
  vi: { code: "vi", urlPrefix: "/vi", label: "VI",    nativeName: "Tiếng Việt", dir: "ltr", hreflang: "vi" },
  fr: { code: "fr", urlPrefix: "/fr", label: "FR",    nativeName: "Français",   dir: "ltr", hreflang: "fr" },
  de: { code: "de", urlPrefix: "/de", label: "DE",    nativeName: "Deutsch",    dir: "ltr", hreflang: "de" },
  ja: { code: "ja", urlPrefix: "/ja", label: "JA",    nativeName: "日本語",      dir: "ltr", hreflang: "ja" },
  ko: { code: "ko", urlPrefix: "/ko", label: "KO",    nativeName: "한국어",      dir: "ltr", hreflang: "ko" },
  th: { code: "th", urlPrefix: "/th", label: "TH",    nativeName: "ภาษาไทย",    dir: "ltr", hreflang: "th" },
  it: { code: "it", urlPrefix: "/it", label: "IT",    nativeName: "Italiano",   dir: "ltr", hreflang: "it" },
  pl: { code: "pl", urlPrefix: "/pl", label: "PL",    nativeName: "Polski",     dir: "ltr", hreflang: "pl" },
};

export const ALL_LANGS = Object.keys(LANG_META) as Lang[];

export const PAGE_SLUGS: Record<PageKey, string> = {
  home:      "",
  mp3:       "/mp3",
  story:     "/story",
  thumbnail: "/thumbnail",
  viewer:    "/viewer",
  apk:       "/apk",
  howto:     "/how-to-download-tiktok-video",
};

export const SITE_URL = "https://luldown.com";

export function getLangFromPath(path: string): { lang: Lang; pageSlug: string } {
  for (const lang of ALL_LANGS) {
    if (lang === "en") continue;
    const prefix = LANG_META[lang].urlPrefix;
    if (path === prefix || path === prefix + "/") {
      return { lang, pageSlug: "" };
    }
    if (path.startsWith(prefix + "/")) {
      return { lang, pageSlug: path.slice(prefix.length) };
    }
  }
  return { lang: "en", pageSlug: path };
}

export function getPageKeyFromSlug(slug: string): PageKey {
  const clean = slug.replace(/^\//, "").split("?")[0];
  if (clean === "mp3")                           return "mp3";
  if (clean === "story")                         return "story";
  if (clean === "thumbnail")                     return "thumbnail";
  if (clean === "viewer")                        return "viewer";
  if (clean === "apk")                           return "apk";
  if (clean === "how-to-download-tiktok-video")  return "howto";
  return "home";
}

export function buildPageUrl(lang: Lang, pageKey: PageKey): string {
  const prefix = LANG_META[lang].urlPrefix;
  const slug   = PAGE_SLUGS[pageKey];
  return prefix + slug || "/";
}

export function buildHreflangUrls(pageKey: PageKey): Array<{ hreflang: string; href: string }> {
  return ALL_LANGS.map(lang => ({
    hreflang: LANG_META[lang].hreflang,
    href: SITE_URL + (buildPageUrl(lang, pageKey) || "/"),
  })).concat([{
    hreflang: "x-default",
    href: SITE_URL + (PAGE_SLUGS[pageKey] || "/"),
  }]);
}
