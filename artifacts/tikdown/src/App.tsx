import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DownloadBar from "@/components/DownloadBar";
import HomePage from "@/pages/HomePage";

const HistoryPage    = lazy(() => import("@/pages/HistoryPage"));
const PrivacyPage    = lazy(() => import("@/pages/PrivacyPage"));
const FAQPage        = lazy(() => import("@/pages/FAQPage"));
const TermsPage      = lazy(() => import("@/pages/TermsPage"));
const DisclaimerPage = lazy(() => import("@/pages/DisclaimerPage"));
const BlogIndexPage  = lazy(() => import("@/pages/BlogIndexPage"));
const BlogPostPage   = lazy(() => import("@/pages/BlogPostPage"));
const Mp3Page        = lazy(() => import("@/pages/Mp3Page"));
const StoryPage      = lazy(() => import("@/pages/StoryPage"));
const ThumbnailPage  = lazy(() => import("@/pages/ThumbnailPage"));
const ViewerPage     = lazy(() => import("@/pages/ViewerPage"));
const SsstikAltPage     = lazy(() => import("@/pages/SsstikAltPage"));
const SnaptikAltPage    = lazy(() => import("@/pages/SnaptikAltPage"));
const MusicalDownAltPage = lazy(() => import("@/pages/MusicalDownAltPage"));
const SavetikAltPage    = lazy(() => import("@/pages/SavetikAltPage"));
const TikmateAltPage    = lazy(() => import("@/pages/TikmateAltPage"));
// Not Working pages
const SsstikNotWorkingPage     = lazy(() => import("@/pages/SsstikNotWorkingPage"));
const SnaptikNotWorkingPage    = lazy(() => import("@/pages/SnaptikNotWorkingPage"));
const TikmateNotWorkingPage    = lazy(() => import("@/pages/TikmateNotWorkingPage"));
const MusicalDownNotWorkingPage = lazy(() => import("@/pages/MusicalDownNotWorkingPage"));
const SavettNotWorkingPage     = lazy(() => import("@/pages/SavettNotWorkingPage"));
// Vs pages
const SsstikVsPage       = lazy(() => import("@/pages/SsstikVsPage"));
const SnaptikVsPage      = lazy(() => import("@/pages/SnaptikVsPage"));
const TikmateVsPage      = lazy(() => import("@/pages/TikmateVsPage"));
const MusicalDownVsPage  = lazy(() => import("@/pages/MusicalDownVsPage"));
const SavettVsPage       = lazy(() => import("@/pages/SavettVsPage"));
const LangHomePage      = lazy(() => import("@/pages/LangHomePage"));
const ApkPage               = lazy(() => import("@/pages/ApkPage"));
const HowToPage             = lazy(() => import("@/pages/HowToPage"));
const WhatsAppStatusPage    = lazy(() => import("@/pages/WhatsAppStatusPage"));

const queryClient = new QueryClient();

function NotFound() {
  const TOOLS = [
    { href: "/",          label: "Video Downloader", desc: "No watermark · HD" },
    { href: "/mp3",       label: "MP3 Extractor",    desc: "Audio only · 192kbps" },
    { href: "/thumbnail", label: "Thumbnail Saver",  desc: "Cover image · JPG" },
    { href: "/tiktok-for-whatsapp-status", label: "WhatsApp Status", desc: "720p · perfect size" },
  ];
  const GUIDES = [
    { href: "/blog/how-to-download-tiktok-without-watermark", label: "Remove Watermark Guide" },
    { href: "/blog/download-tiktok-as-mp3",                   label: "TikTok to MP3 Guide" },
    { href: "/faq",                                            label: "FAQ" },
  ];
  return (
    <div style={{ background: "#13112b", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      {/* 404 hero */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</div>
        <h1 style={{ marginTop: 12, fontSize: 22, fontWeight: 800, color: "#fff" }}>Page not found</h1>
        <p style={{ marginTop: 8, color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
          The link you followed may be broken or the page may have been removed.
        </p>
        <a href="/" style={{
          marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg,#4f6ef7,#7c3aed)", color: "#fff",
          fontWeight: 700, fontSize: 14, padding: "12px 28px", borderRadius: 12,
          textDecoration: "none",
        }}>
          ← Go to Homepage
        </a>
      </div>

      {/* Popular tools */}
      <div style={{ width: "100%", maxWidth: 560 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
          Popular Tools
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,240px),1fr))", gap: 10, marginBottom: 28 }}>
          {TOOLS.map(({ href, label, desc }) => (
            <a key={href} href={href} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "12px 16px", textDecoration: "none",
              display: "flex", flexDirection: "column", gap: 3,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,110,247,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{label}</span>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{desc}</span>
            </a>
          ))}
        </div>

        {/* Guides */}
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
          Helpful Guides
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GUIDES.map(({ href, label }) => (
            <a key={href} href={href} style={{
              fontSize: 13, fontWeight: 600, color: "#4f6ef7",
              background: "rgba(79,110,247,0.08)", border: "1px solid rgba(79,110,247,0.2)",
              borderRadius: 20, padding: "6px 14px", textDecoration: "none",
            }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* ── English pages ── */}
      <Route path="/"                   component={HomePage} />
      <Route path="/mp3"                component={Mp3Page} />
      <Route path="/story"              component={StoryPage} />
      <Route path="/thumbnail"          component={ThumbnailPage} />
      <Route path="/viewer"             component={ViewerPage} />
      <Route path="/ssstik-alternative"      component={SsstikAltPage} />
      <Route path="/snaptik-alternative"     component={SnaptikAltPage} />
      <Route path="/musicaldown-alternative" component={MusicalDownAltPage} />
      <Route path="/savetik-alternative"     component={SavetikAltPage} />
      <Route path="/tikmate-alternative"     component={TikmateAltPage} />
      {/* ── Not Working pages ── */}
      <Route path="/ssstik-not-working"       component={SsstikNotWorkingPage} />
      <Route path="/snaptik-not-working"      component={SnaptikNotWorkingPage} />
      <Route path="/tikmate-not-working"      component={TikmateNotWorkingPage} />
      <Route path="/musicaldown-not-working"  component={MusicalDownNotWorkingPage} />
      <Route path="/savett-not-working"       component={SavettNotWorkingPage} />
      {/* ── Vs pages ── */}
      <Route path="/ssstik-vs-luldown"        component={SsstikVsPage} />
      <Route path="/snaptik-vs-luldown"       component={SnaptikVsPage} />
      <Route path="/tikmate-vs-luldown"       component={TikmateVsPage} />
      <Route path="/musicaldown-vs-luldown"   component={MusicalDownVsPage} />
      <Route path="/savett-vs-luldown"        component={SavettVsPage} />

      {/* ── Utility pages ── */}
      <Route path="/history"    component={HistoryPage} />
      <Route path="/privacy"    component={PrivacyPage} />
      <Route path="/faq"        component={FAQPage} />
      <Route path="/terms"      component={TermsPage} />
      <Route path="/disclaimer" component={DisclaimerPage} />
      <Route path="/blog"       component={BlogIndexPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />

      {/* ── English tool pages ── */}
      <Route path="/apk"                             component={ApkPage} />
      <Route path="/how-to-download-tiktok-video"    component={HowToPage} />
      <Route path="/tiktok-for-whatsapp-status"      component={WhatsAppStatusPage} />

      {/* ── Language-prefixed tool pages ── */}
      <Route path="/:lang/mp3"                            component={Mp3Page} />
      <Route path="/:lang/story"                          component={StoryPage} />
      <Route path="/:lang/thumbnail"                      component={ThumbnailPage} />
      <Route path="/:lang/viewer"                         component={ViewerPage} />
      <Route path="/:lang/apk"                            component={ApkPage} />
      <Route path="/:lang/how-to-download-tiktok-video"   component={HowToPage} />

      {/* ── Language home pages (must be last to avoid swallowing other routes) ── */}
      <Route path="/:lang" component={LangHomePage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App({ ssrHook }: { ssrHook?: () => [string, (to: string) => void] } = {}) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("luldown-theme", "dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")} hook={ssrHook}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <ScrollToTop />
          <Navbar />
          <main style={{ flex: 1 }}>
            <Suspense fallback={null}>
              <Router />
            </Suspense>
          </main>
          <Footer />
          <DownloadBar />
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
