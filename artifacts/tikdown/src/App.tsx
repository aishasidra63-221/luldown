import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
const SsstikAltPage  = lazy(() => import("@/pages/SsstikAltPage"));
const LangHomePage   = lazy(() => import("@/pages/LangHomePage"));
const ApkPage        = lazy(() => import("@/pages/ApkPage"));
const HowToPage      = lazy(() => import("@/pages/HowToPage"));

declare const __RECAPTCHA_SITE_KEY__: string;

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#13112b" }}>
      <div className="text-center">
        <h1 style={{ fontSize: 64, fontWeight: 800, color: "#4f6ef7" }}>404</h1>
        <p style={{ marginTop: 16, color: "rgba(255,255,255,0.6)" }}>Page not found</p>
        <a href="/" style={{ marginTop: 24, display: "inline-block", color: "#4f6ef7" }}>Go Home</a>
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
      <Route path="/ssstik-alternative" component={SsstikAltPage} />

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

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("luldown-theme", "dark");
  }, []);

  const siteKey = __RECAPTCHA_SITE_KEY__;

  const inner = (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Suspense fallback={null}>
              <Router />
            </Suspense>
          </main>
          <Footer />
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );

  if (siteKey) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true }}>
        {inner}
      </GoogleReCaptchaProvider>
    );
  }

  return inner;
}

export default App;
