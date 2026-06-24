import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object;
}

const DEFAULT_TITLE = "LUL Downloader — Download TikTok Videos Free";

export function useSEO({ title, description, canonical, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      document.querySelector(selector)?.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]',          "content", description);
    setMeta('meta[property="og:title"]',          "content", title);
    setMeta('meta[property="og:description"]',    "content", description);
    setMeta('meta[name="twitter:title"]',         "content", title);
    setMeta('meta[name="twitter:description"]',   "content", description);

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    let script = document.getElementById("page-jsonld") as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = "page-jsonld";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, canonical]);
}
