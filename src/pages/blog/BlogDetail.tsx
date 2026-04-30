import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { cn } from "@/lib/utils";
import { useGetPublicBlogBySlugQuery, BlogItem } from "@/rtk/slices/adminApiSlice";
import { useTranslation } from "react-i18next";
import { normalizeStoredLanguage } from "@/utils/languageUtils";

const pickBlogField = (blog: BlogItem, field: "title" | "excerpt" | "content", lang: string): string => {
  if (lang !== "en") {
    const localised = blog[`${field}_${lang}` as keyof BlogItem] as string | undefined;
    if (localised?.trim()) return localised;
  }
  return (blog[`${field}_en` as keyof BlogItem] as string | undefined) || (blog[field] as string) || "";
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

const fmtTime = (d: string) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

function RelatedCard({ blog, lang }: { blog: BlogItem; lang: string }) {
  const localTitle = pickBlogField(blog, "title", lang);
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group flex gap-3 py-3 border-b border-gray-100 last:border-0"
    >
      <div className="h-16 w-20 rounded overflow-hidden shrink-0 bg-gray-100">
        {blog.cover_image ? (
          <img src={blog.cover_image} alt={localTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-xl">📝</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {localTitle}
        </p>
        <p className="text-xs text-gray-400 mt-1">{fmtDate(blog.createdAt)}</p>
      </div>
    </Link>
  );
}

export default function BlogDetail() {
  const { slug }   = useParams<{ slug: string }>();
  const navigate   = useNavigate();
  const { i18n, t } = useTranslation();
  const lang        = normalizeStoredLanguage(i18n.language);

  const { data, isLoading, isError } = useGetPublicBlogBySlugQuery(slug ?? "", { skip: !slug });

  const blog    = data?.data;
  const related = data?.related ?? [];

  const localTitle   = blog ? pickBlogField(blog, "title",   lang) : "";
  const localExcerpt = blog ? pickBlogField(blog, "excerpt", lang) : "";
  const localContent = blog ? pickBlogField(blog, "content", lang) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="h-72 bg-gray-200 animate-pulse" />
        <div className="max-w-5xl mx-auto w-full px-4 py-10 animate-pulse space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={cn("h-4 bg-gray-100 rounded", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="min-h-screen flex flex-col">
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ minHeight: 320 }}>
        {/* Background: cover image with dark overlay, or solid dark if no image */}
        {blog.cover_image ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${blog.cover_image})` }}
          >
            <div className="absolute inset-0 bg-black/55" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-800" />
        )}

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 py-14 flex flex-col items-center text-center gap-4">
          {/* Date + time */}
          <div className="flex items-center gap-5 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              {fmtDate(blog.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {fmtTime(blog.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-2xl">
            {localTitle}
          </h1>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-white/70">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-white transition-colors text-primary">{t("footer.blogs")}</Link>
            <span>/</span>
            <span className="text-white/90 truncate max-w-[220px]">{localTitle}</span>
          </nav>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Article */}
          <article className="lg:col-span-2">
            {localExcerpt && (
              <p className="text-gray-500 text-base leading-relaxed mb-6 pb-6 border-b border-gray-100">
                {localExcerpt}
              </p>
            )}

            <div
              className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary prose-img:rounded-lg prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: localContent }}
            />

            {/* Tags */}
            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Back */}
            <button
              onClick={() => navigate("/blog")}
              className="mt-8 flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all posts
            </button>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {related.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-2">Related Posts</h3>
                <div>
                  {related.map((r) => <RelatedCard key={r.id} blog={r} lang={lang} />)}
                </div>
              </div>
            )}
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
