import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";

// Lazy load non-critical pages for faster initial load
const HistoryPage    = lazy(() => import("@/pages/HistoryPage"));
const PrivacyPage    = lazy(() => import("@/pages/PrivacyPage"));
const FAQPage        = lazy(() => import("@/pages/FAQPage"));
const TermsPage      = lazy(() => import("@/pages/TermsPage"));
const DisclaimerPage = lazy(() => import("@/pages/DisclaimerPage"));
const BlogIndexPage  = lazy(() => import("@/pages/BlogIndexPage"));
const BlogPostPage   = lazy(() => import("@/pages/BlogPostPage"));
const ContactPage    = lazy(() => import("@/pages/ContactPage"));

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
      <Route path="/" component={HomePage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/disclaimer" component={DisclaimerPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/blog" component={BlogIndexPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Fixed dark theme — no toggle
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
