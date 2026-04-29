import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Eye, Tag, Star, Share2 } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { cn } from "@/lib/utils";
import { useGetPublicBlogBySlugQuery, BlogItem } from "@/rtk/slices/adminApiSlice";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

function RelatedCard({ blog }: { blog: BlogItem }) {
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <div className="h-16 w-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        {blog.cover_image ? (
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-lg">📝</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">
          {blog.title}
        </p>
        <p className="text-xs text-gray-400 mt-1">{fmt(blog.createdAt)}</p>
      </div>
    </Link>
  );
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetPublicBlogBySlugQuery(slug ?? "", { skip: !slug });

  const blog    = data?.data;
  const related = data?.related ?? [];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: blog?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex flex-col">
        <Header />
        <div className="max-w-4xl mx-auto w-full px-4 py-12 animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-gray-100 rounded" />
          <div className="h-4 w-1/3 bg-gray-100 rounded" />
          <div className="aspect-[16/9] bg-gray-100 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn("h-4 bg-gray-100 rounded", i % 3 === 2 ? "w-2/3" : "w-full")} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
          <p className="text-5xl">😕</p>
          <p className="text-lg font-semibold text-gray-600">Blog post not found</p>
          <Link to="/blog" className="text-sm text-primary hover:underline mt-1">← Back to Blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main article (2/3) ── */}
          <article className="lg:col-span-2 space-y-6">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <span>/</span>
              {blog.category && (
                <>
                  <span className="text-primary">{blog.category}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-600 truncate max-w-[200px]">{blog.title}</span>
            </nav>

            {/* Header */}
            <div className="space-y-4">
              {blog.category && (
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{blog.category}</span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{blog.title}</h1>
              {blog.excerpt && (
                <p className="text-lg text-gray-500 leading-relaxed">{blog.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-4 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {blog.author[0]?.toUpperCase()}
                  </div>
                  {blog.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {fmt(blog.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {blog.view_count.toLocaleString()} views
                </span>
                {blog.is_featured && (
                  <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Featured
                  </span>
                )}
                <button
                  onClick={handleShare}
                  className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>

            {/* Cover image */}
            {blog.cover_image && (
              <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
                <img
                  src={blog.cover_image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: blog.content ?? "" }}
            />

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Back link */}
            <div className="pt-2">
              <button
                onClick={() => navigate("/blog")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all posts
              </button>
            </div>
          </article>

          {/* ── Sidebar (1/3) ── */}
          <aside className="space-y-6">

            {/* Related posts */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Related Posts</h3>
                <div className="divide-y divide-gray-50">
                  {related.map((r) => <RelatedCard key={r.id} blog={r} />)}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-primary/90 to-primary rounded-2xl p-5 text-white space-y-3">
              <h3 className="font-bold text-base">Have materials to sell?</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                List your recyclable materials on GreenBidz and connect with buyers worldwide.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white text-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
              >
                Get Started →
              </Link>
            </div>

          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
