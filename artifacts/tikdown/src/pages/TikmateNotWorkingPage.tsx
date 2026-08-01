import NotWorkingPage, { NotWorkingConfig } from "./NotWorkingPage";

const cfg: NotWorkingConfig = {
  competitor: "TikMate",
  domain: "tikmate.online",
  slug: "tikmate-not-working",
  reasons: [
    "TikMate's web version gets rate-limited by TikTok frequently, resulting in failed or slow downloads.",
    "TikMate requires app installation on Android — if the APK is outdated, it stops working with newer TikTok versions.",
    "TikMate's servers are not globally distributed, causing high latency and timeouts for users outside their server region.",
    "TikTok regularly pushes updates that break TikMate's API calls until TikMate releases a patch.",
    "The tikmate.online domain has faced takedown attempts, causing DNS issues and intermittent downtime.",
  ],
  faqs: [
    { q: "Why is TikMate not working?", a: "TikMate often breaks when TikTok updates its app or API. Since TikMate's APK needs to be manually updated, outdated versions stop working until users download the new version." },
    { q: "TikMate app is not downloading — what should I do?", a: "Switch to LulDown — it works entirely in your browser with no app to install or update. Paste any TikTok link and download instantly." },
    { q: "Is LulDown better than TikMate?", a: "Yes for web use. LulDown requires no APK install, no storage, and works on all devices including iPhone. TikMate's web version is slower and more ad-heavy than LulDown." },
    { q: "Can I use LulDown on iPhone instead of TikMate?", a: "Yes. TikMate's app is Android-only. LulDown works perfectly on Safari on iPhone and can be installed as a PWA on your home screen." },
    { q: "Is LulDown free like TikMate?", a: "Yes — completely free, no ads, no watermark, no login needed. LulDown has no premium tier." },
  ],
};

export default function TikmateNotWorkingPage() {
  return <NotWorkingPage cfg={cfg} />;
}
