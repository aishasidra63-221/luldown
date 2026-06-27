import { useParams } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { getBlogBySlug } from "@/data/blogs";
import BlogLayout from "@/components/BlogLayout";
import { Link } from "wouter";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const post = getBlogBySlug(params.slug);

  useSEO(
    post
      ? { title: post.metaTitle, description: post.metaDescription }
      : { title: "Blog Post Not Found", description: "" }
  );

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-black hero-title mb-3">404</h1>
        <p className="seo-text mb-6">This blog post doesn't exist.</p>
        <Link href="/blog">
          <button className="gradient-btn px-6 py-3 rounded-xl font-bold text-sm">
            ← Back to Blog
          </button>
        </Link>
      </div>
    );
  }

  return <BlogLayout post={post} />;
}
