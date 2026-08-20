import { BLOGS } from "@/data/blogs";
import { getLangFromPath, getPageKeyFromSlug, buildHreflangUrls, buildPageUrl, LANG_META, SITE_URL } from "@/i18n/langMeta";
import { T } from "@/i18n/translations";

export interface RouteSeo {
  title: string;
  description: string;
  canonical: string;
  language: string;
  direction: "ltr" | "rtl";
  hreflang: Array<{ hreflang: string; href: string }>;
  schema: Record<string, unknown>;
}

const APP_DESCRIPTION =
  "Download TikTok videos without watermark in HD — free, fast, no app needed. Save TikTok as MP4 or MP3. Works on iPhone, Android and PC.";

const PAGE_DETAILS: Record<string, { title: string; description: string; schemaType?: string }> = {
  "/": {
    title: "TikTok Video Downloader — No Watermark | LulDown",
    description: "Download TikTok videos without watermark in 1080p, 720p or MP3. Free, fast, no login required. Works on all devices.",
    schemaType: "WebApplication",
  },
  "/mp3": {
    title: "TikTok to MP3 Converter — Free Audio Download | LulDown",
    description: "Extract TikTok audio as MP3 for free. Download songs, sounds and voiceovers in high quality on iPhone, Android, PC and Mac.",
    schemaType: "WebApplication",
  },
  "/story": {
    title: "TikTok Story Downloader — Save Stories Free | LulDown",
    description: "Download public TikTok Stories without watermark. Save TikTok Story videos in HD for free with no login or app installation.",
    schemaType: "WebApplication",
  },
  "/thumbnail": {
    title: "TikTok Thumbnail Downloader — Download Cover Images | LulDown",
    description: "Download TikTok video thumbnails and cover images in high quality. Free, fast and works on every device without an app.",
    schemaType: "WebApplication",
  },
  "/viewer": {
    title: "TikTok Viewer — View Public TikTok Videos Online | LulDown",
    description: "View public TikTok videos online and access download options without installing an app. Fast, private and free to use.",
    schemaType: "WebApplication",
  },
  "/apk": {
    title: "LulDown APK — TikTok Downloader for Android",
    description: "Learn about LulDown for Android and download TikTok videos without watermark using your mobile browser. Free and no login required.",
    schemaType: "SoftwareApplication",
  },
  "/how-to-download-tiktok-video": {
    title: "How to Download TikTok Videos Without Watermark | LulDown",
    description: "Learn how to download TikTok videos without watermark in three easy steps. Save HD MP4 or MP3 files on any device.",
    schemaType: "HowTo",
  },
  "/tiktok-for-whatsapp-status": {
    title: "TikTok Video Download for WhatsApp Status — No Watermark | LulDown",
    description: "Download TikTok videos without watermark and use them as WhatsApp Status. Free, fast and works on iPhone and Android.",
    schemaType: "HowTo",
  },
  "/faq": {
    title: "FAQ — LulDown TikTok Downloader",
    description: "Frequently asked questions about LulDown, TikTok video downloads, formats, privacy and supported devices.",
    schemaType: "FAQPage",
  },
  "/privacy": {
    title: "Privacy Policy | LulDown",
    description: "Read LulDown's privacy policy and learn how the TikTok downloader handles data, cookies and user privacy.",
  },
  "/terms": {
    title: "Terms of Service | LulDown",
    description: "Read the LulDown terms of service for using the free TikTok video downloader.",
  },
  "/disclaimer": {
    title: "Disclaimer | LulDown",
    description: "Read the LulDown disclaimer, including independent-service and copyright information.",
  },
  "/blog": {
    title: "TikTok Download Guides & Tips | LulDown Blog",
    description: "Guides for downloading TikTok videos, saving MP3 audio, using iPhone and Android downloads, and more.",
  },
};

const COMPETITORS: Record<string, { name: string; domain: string }> = {
  ssstik: { name: "SSSTik", domain: "ssstik.io" },
  snaptik: { name: "SnapTik", domain: "snaptik.app" },
  musicaldown: { name: "MusicalDown", domain: "musicaldown.com" },
  savetik: { name: "SaveTik", domain: "savetik.co" },
  tikmate: { name: "TikMate", domain: "tikmate.online" },
  savett: { name: "SaveTT", domain: "savett.cc" },
};

function siteSchema(type: string, title: string, description: string, canonical: string): Record<string, unknown> {
  if (type === "WebApplication" || type === "SoftwareApplication") {
    return {
      "@context": "https://schema.org",
      "@type": type,
      name: title,
      url: canonical,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "All",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description,
    };
  }

  if (type === "HowTo") {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: title,
      description,
      totalTime: "PT2M",
      step: [
        { "@type": "HowToStep", position: 1, name: "Copy a TikTok link" },
        { "@type": "HowToStep", position: 2, name: "Paste the link into LulDown" },
        { "@type": "HowToStep", position: 3, name: "Choose a format and download" },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": type || "WebPage",
    name: title,
    description,
    url: canonical,
  };
}

function competitorSeo(path: string): { title: string; description: string; schemaType: string } | null {
  const match = path.match(/^\/(ssstik|snaptik|musicaldown|savetik|tikmate|savett)-(alternative|not-working|vs-luldown)$/);
  if (!match) return null;

  const [, id, variant] = match;
  const competitor = COMPETITORS[id];
  if (!competitor) return null;

  if (variant === "alternative") {
    return {
      title: `Best ${competitor.name} Alternative — LulDown TikTok Downloader`,
      description: `Looking for a ${competitor.name} alternative? LulDown downloads TikTok videos without watermark in HD, with MP3, thumbnail and story tools.`,
      schemaType: "WebPage",
    };
  }

  if (variant === "not-working") {
    return {
      title: `${competitor.name} Not Working? Use LulDown Instead`,
      description: `${competitor.name} (${competitor.domain}) not working? Try LulDown to download TikTok videos without watermark, free and without signup.`,
      schemaType: "FAQPage",
    };
  }

  return {
    title: `LulDown vs ${competitor.name} — TikTok Downloader Comparison`,
    description: `Compare LulDown and ${competitor.name}: TikTok video quality, watermark removal, MP3, supported tools and download experience.`,
    schemaType: "WebPage",
  };
}

function localizedSeo(path: string): RouteSeo | null {
  const { lang, pageSlug } = getLangFromPath(path);
  if (lang === "en" || !pageSlug && !path.match(/^\/(?:ur|hi|bn|id|ar|tr|es|pt|vi|fr|de|ja|ko|th|it|pl|tl|ms|uk)$/)) {
    return null;
  }

  const pageKey = getPageKeyFromSlug(pageSlug);
  const translation = T[lang][pageKey];
  const canonicalPath = buildPageUrl(lang, pageKey) || "/";
  const canonical = SITE_URL + canonicalPath;

  return {
    title: translation.metaTitle,
    description: translation.metaDescription,
    canonical,
    language: LANG_META[lang].hreflang,
    direction: LANG_META[lang].dir,
    hreflang: buildHreflangUrls(pageKey),
    schema: pageKey === "howto"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: translation.howItWorksTitle || translation.metaTitle,
          description: translation.metaDescription,
          totalTime: "PT2M",
          step: translation.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.desc,
            url: `${canonical}#step-${index + 1}`,
          })),
        }
      : siteSchema("WebApplication", translation.metaTitle, translation.metaDescription, canonical),
  };
}

export function getRouteSeo(route: string): RouteSeo {
  const path = route.split("?")[0].replace(/\/+$/, "") || "/";
  const localized = localizedSeo(path);
  if (localized) return localized;

  const canonical = SITE_URL + path;
  const blog = path.startsWith("/blog/") ? BLOGS.find(post => post.slug === path.slice("/blog/".length)) : undefined;
  if (blog) {
    return {
      title: blog.metaTitle,
      description: blog.metaDescription,
      canonical,
      language: "en",
      direction: "ltr",
      hreflang: [],
      schema: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.metaDescription,
        datePublished: blog.date,
        url: canonical,
        mainEntityOfPage: canonical,
        author: { "@type": "Organization", name: "LulDown" },
        publisher: { "@type": "Organization", name: "LulDown", url: SITE_URL },
      },
    };
  }

  const competitor = competitorSeo(path);
  const details = competitor || PAGE_DETAILS[path] || {
    title: "LulDown — TikTok Downloader",
    description: APP_DESCRIPTION,
    schemaType: "WebPage",
  };

  return {
    title: details.title,
    description: details.description,
    canonical,
    language: "en",
    direction: "ltr",
    hreflang: path === "/" ? buildHreflangUrls("home") : [],
    schema: siteSchema(details.schemaType || "WebPage", details.title, details.description, canonical),
  };
}