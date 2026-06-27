import { Link } from "wouter";
import { Clock, Calendar, ChevronRight, ArrowLeft, Download } from "lucide-react";
import type { BlogPost } from "@/data/blogs";

interface Props {
  post: BlogPost;
}

export default function BlogLayout({ post }: Props) {
  const dateFormatted = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs mb-8 opacity-50">
        <Link href="/"><span className="hover:opacity-80 cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/blog"><span className="hover:opacity-80 cursor-pointer">Blog</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-4 hero-title">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs seo-text">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {dateFormatted}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime} min read
          </span>
        </div>
      </header>

      {/* Intro */}
      <p className="text-base leading-relaxed mb-8 seo-subheading">{post.intro}</p>

      {/* CTA Banner */}
      <div className="rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center gap-4 justify-between"
        style={{ background: "linear-gradient(135deg, rgba(0,200,200,0.12) 0%, rgba(233,30,140,0.12) 100%)", border: "1px solid rgba(0,229,229,0.25)" }}>
        <div>
          <p className="font-black text-sm" style={{ color: "#00e5e5" }}>Try it now — 100% Free</p>
          <p className="text-xs opacity-60 mt-0.5">No login, no app, no watermark</p>
        </div>
        <Link href="/">
          <button className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap">
            <Download className="w-4 h-4" />
            Download TikTok
          </button>
        </Link>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {post.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-lg font-black mb-3 seo-heading">{section.heading}</h2>
            <div className="text-sm leading-relaxed seo-text space-y-3">
              {section.content.split("\n\n").map((para, j) => (
                <p key={j} style={{ whiteSpace: "pre-line" }}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* FAQ */}
      {post.faq && post.faq.length > 0 && (
        <div className="mt-10 pt-8">
          <div className="neon-divider mb-8" />
          <h2 className="text-xl font-black mb-6 seo-heading">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {post.faq.map((item, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "rgba(0,229,229,0.05)", border: "1px solid rgba(0,229,229,0.15)" }}>
                <h3 className="font-bold text-sm mb-2" style={{ color: "#00e5e5" }}>{item.q}</h3>
                <p className="text-sm leading-relaxed seo-text">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 pt-8">
        <div className="neon-divider mb-8" />
        <div className="text-center space-y-4">
          <p className="font-black text-lg seo-heading">Ready to download?</p>
          <p className="text-sm seo-text">Paste your TikTok link and get a watermark-free video in seconds.</p>
          <Link href="/">
            <button className="gradient-btn flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-black mx-auto">
              <Download className="w-5 h-5" />
              Go to Luldown — Free Download
            </button>
          </Link>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link href="/blog">
          <span className="flex items-center gap-2 text-sm seo-text hover:opacity-80 cursor-pointer transition-opacity w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </span>
        </Link>
      </div>

    </article>
  );
}
