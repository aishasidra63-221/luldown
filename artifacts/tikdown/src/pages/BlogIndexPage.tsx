import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { BLOGS } from "@/data/blogs";
import { Clock, Calendar, ChevronRight, BookOpen } from "lucide-react";
import BackHomeButton from "@/components/BackHomeButton";

export default function BlogIndexPage() {
  useSEO({
    title: "TikTok Downloader Blog — Tips, Guides & How-Tos",
    description: "Learn how to download TikTok videos without watermark, save TikTok as MP3, download on iPhone, Android, PC and more. Free guides updated for 2025.",
  });

  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh" }}>

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 60%, #0f0d28 100%)",
        padding: "48px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 16, left: 20, zIndex: 10 }}>
          <BackHomeButton />
        </div>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(120,40,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
          background: "rgba(79,110,247,0.15)",
          border: "1px solid rgba(79,110,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <BookOpen size={24} color="#4f6ef7" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 10, letterSpacing: "-0.02em",
          position: "relative",
        }}>
          Blog & Guides
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", position: "relative", maxWidth: 500, margin: "0 auto" }}>
          Step-by-step tutorials on how to download TikTok videos, save audio, and more.
        </p>
      </div>

      {/* Tools Strip */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>Free Tools:</span>
          {[
            { href: "/",          label: "Video Downloader" },
            { href: "/mp3",       label: "MP3 Extractor" },
            { href: "/thumbnail", label: "Thumbnail Saver" },
            { href: "/tiktok-for-whatsapp-status", label: "WhatsApp Status" },
            { href: "/viewer",    label: "Video Viewer" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: "#4f6ef7",
                background: "rgba(79,110,247,0.07)", borderRadius: 20,
                padding: "5px 13px", cursor: "pointer", border: "1px solid rgba(79,110,247,0.15)",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,110,247,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(79,110,247,0.07)")}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px 72px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: 20,
        }}>
          {BLOGS.map((post) => {
            const dateFormatted = new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            });

            return (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: "0",
                  cursor: "pointer",
                  transition: "box-shadow 0.18s, transform 0.18s",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(79,110,247,0.13)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Accent top bar */}
                  <div style={{
                    height: 4,
                    background: "linear-gradient(90deg, #7c3aed 0%, #4f6ef7 60%, #06b6d4 100%)",
                  }} />

                  <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={13} /> {dateFormatted}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={13} /> {post.readTime} min read
                      </span>
                    </div>

                    <h2 style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 10, lineHeight: 1.45 }}>
                      {post.title}
                    </h2>

                    <p style={{
                      fontSize: 13.5, color: "#6b7280", lineHeight: 1.75, marginBottom: 20, flexGrow: 1,
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {post.intro}
                    </p>

                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: 700, color: "#4f6ef7",
                    }}>
                      Read Guide <ChevronRight size={14} />
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
