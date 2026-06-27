import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { BLOGS } from "@/data/blogs";
import { Clock, Calendar, ChevronRight, Rss } from "lucide-react";

export default function BlogIndexPage() {
  useSEO({
    title: "TikTok Downloader Blog — Tips, Guides & How-Tos",
    description: "Learn how to download TikTok videos without watermark, save TikTok as MP3, download on iPhone, Android, PC and more. Free guides updated for 2025.",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 hero-badge text-xs font-bold px-4 py-1.5 rounded-full mb-5">
          <Rss className="w-3 h-3" />
          Blog & Guides
        </div>
        <h1 className="text-2xl sm:text-3xl font-black hero-title mb-3">
          TikTok Downloader Guides
        </h1>
        <p className="text-sm seo-text max-w-xl mx-auto">
          Step-by-step tutorials on how to download TikTok videos without watermark, save audio as MP3, download on any device, and more.
        </p>
      </div>

      {/* Blog grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {BLOGS.map((post) => {
          const dateFormatted = new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          });

          return (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article
                className="rounded-2xl p-5 h-full cursor-pointer transition-all duration-200 how-it-works-card hover:scale-[1.02]"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex flex-wrap items-center gap-3 text-[10px] seo-text mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {dateFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime} min read
                  </span>
                </div>

                <h2 className="font-black text-sm leading-snug mb-2 seo-heading line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-xs leading-relaxed seo-text line-clamp-3 mb-4">
                  {post.intro}
                </p>

                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#00e5e5" }}>
                  Read Guide <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </article>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
