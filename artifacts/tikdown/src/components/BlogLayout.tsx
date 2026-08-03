import { Link } from "wouter";
import { Clock, Calendar, ChevronRight, ArrowLeft, Download, FileText, Music, Image, Video, Smartphone } from "lucide-react";
import type { BlogPost } from "@/data/blogs";

const ALL_TOOLS = [
  { href: "/",           label: "Video Downloader",  desc: "No watermark · HD quality",  icon: <Download size={16} color="#4f6ef7" /> },
  { href: "/mp3",        label: "MP3 Extractor",      desc: "Extract audio only · 192kbps", icon: <Music    size={16} color="#7c3aed" /> },
  { href: "/thumbnail",  label: "Thumbnail Saver",    desc: "Download cover image · JPG",   icon: <Image    size={16} color="#06b6d4" /> },
  { href: "/tiktok-for-whatsapp-status", label: "WhatsApp Status", desc: "Perfect 720p size",  icon: <Smartphone size={16} color="#10b981" /> },
  { href: "/viewer",     label: "Video Viewer",       desc: "Watch without the app",         icon: <Video    size={16} color="#f59e0b" /> },
];

function getRelatedTools(slug: string) {
  if (slug.includes("mp3") || slug.includes("audio") || slug.includes("sound"))
    return [ALL_TOOLS[1], ALL_TOOLS[0], ALL_TOOLS[2]];
  if (slug.includes("thumbnail") || slug.includes("photo") || slug.includes("slideshow") || slug.includes("image"))
    return [ALL_TOOLS[2], ALL_TOOLS[0], ALL_TOOLS[1]];
  if (slug.includes("whatsapp") || slug.includes("status"))
    return [ALL_TOOLS[3], ALL_TOOLS[0], ALL_TOOLS[1]];
  if (slug.includes("iphone") || slug.includes("android") || slug.includes("mobile"))
    return [ALL_TOOLS[0], ALL_TOOLS[1], ALL_TOOLS[4]];
  return [ALL_TOOLS[0], ALL_TOOLS[1], ALL_TOOLS[2]];
}

interface Props {
  post: BlogPost;
}

export default function BlogLayout({ post }: Props) {
  const dateFormatted = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
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
          <FileText size={24} color="#4f6ef7" />
        </div>
        <h1 style={{
          fontSize: "clamp(1.3rem, 4vw, 2rem)", fontWeight: 800,
          color: "#ffffff", marginBottom: 12, letterSpacing: "-0.02em",
          position: "relative", maxWidth: 680, margin: "0 auto 12px",
        }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, fontSize: 13, color: "rgba(255,255,255,0.45)", position: "relative" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={13} /> {dateFormatted}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={13} /> {post.readTime} min read
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 60px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", marginBottom: 24 }}>
          <Link href="/"><span style={{ cursor: "pointer", color: "#4f6ef7" }}>Home</span></Link>
          <ChevronRight size={12} />
          <Link href="/blog"><span style={{ cursor: "pointer", color: "#4f6ef7" }}>Blog</span></Link>
          <ChevronRight size={12} />
          <span style={{ color: "#9ca3af", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
        </nav>

        {/* Intro */}
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.75, marginBottom: 24, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
          {post.intro}
        </p>

        {/* CTA Banner */}
        <div style={{
          background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 100%)",
          border: "1px solid rgba(79,110,247,0.25)",
          borderRadius: 16, padding: "18px 22px", marginBottom: 28,
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14,
        }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: "#ffffff", marginBottom: 3 }}>Try it now — 100% Free</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>No login, no app, no watermark</p>
          </div>
          <Link href="/">
            <button style={{
              background: "linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)",
              border: "none", borderRadius: 12, padding: "10px 20px",
              color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Download size={15} />
              Download TikTok
            </button>
          </Link>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {post.sections.map((section, i) => (
            <div key={i} style={{
              background: "#ffffff",
              borderRadius: i === 0 ? "16px 16px 0 0" : i === post.sections.length - 1 && (!post.faq || post.faq.length === 0) ? "0 0 16px 16px" : 0,
              borderTop: i === 0 ? "1px solid rgba(0,0,0,0.09)" : "none",
              borderLeft: "1px solid rgba(0,0,0,0.09)",
              borderRight: "1px solid rgba(0,0,0,0.09)",
              borderBottom: "1px solid rgba(0,0,0,0.09)",
              padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <ChevronRight size={16} color="#4f6ef7" style={{ marginTop: 3, flexShrink: 0 }} />
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 8 }}>{section.heading}</h2>
                  <div style={{ fontSize: 13.5, color: "#4b5563", lineHeight: 1.7 }}>
                    {section.content.split("\n\n").map((para, j) => (
                      <p key={j} style={{ marginBottom: j < section.content.split("\n\n").length - 1 ? 10 : 0, whiteSpace: "pre-line" }}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 14, paddingLeft: 4 }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {post.faq.map((item, i) => (
                <div key={i} style={{
                  background: "#ffffff",
                  borderRadius: i === 0 ? "16px 16px 0 0" : i === post.faq!.length - 1 ? "0 0 16px 16px" : 0,
                  borderTop: i === 0 ? "1px solid rgba(0,0,0,0.09)" : "none",
                  borderLeft: "1px solid rgba(0,0,0,0.09)",
                  borderRight: "1px solid rgba(0,0,0,0.09)",
                  borderBottom: "1px solid rgba(0,0,0,0.09)",
                  padding: "18px 22px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <ChevronRight size={16} color="#4f6ef7" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 6 }}>{item.q}</h3>
                      <p style={{ fontSize: 13.5, color: "#4b5563", lineHeight: 1.7 }}>{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tools */}
        <div style={{ marginTop: 32, marginBottom: 28 }}>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 14 }}>
            Free Tools You Can Use Right Now
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: 10 }}>
            {getRelatedTools(post.slug).map(({ href, label, desc, icon }) => (
              <Link key={href} href={href}>
                <div style={{
                  background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 14,
                  padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start",
                  gap: 12, transition: "box-shadow 0.15s, transform 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(79,110,247,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(79,110,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#111827", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 32,
          background: "linear-gradient(160deg, #0d0b1f 0%, #13103a 100%)",
          border: "1px solid rgba(79,110,247,0.25)",
          borderRadius: 16, padding: "28px 22px",
          textAlign: "center",
        }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: "#ffffff", marginBottom: 6 }}>Ready to download?</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
            Paste your TikTok link and get a watermark-free video in seconds.
          </p>
          <Link href="/">
            <button style={{
              background: "linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)",
              border: "none", borderRadius: 14, padding: "13px 32px",
              color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 10,
            }}>
              <Download size={17} />
              Go to Luldown — Free Download
            </button>
          </Link>
        </div>

        {/* Back link */}
        <div style={{ marginTop: 24 }}>
          <Link href="/blog">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4f6ef7", cursor: "pointer", fontWeight: 600 }}>
              <ArrowLeft size={15} />
              Back to Blog
            </span>
          </Link>
        </div>

      </div>
    </div>
  );
}
