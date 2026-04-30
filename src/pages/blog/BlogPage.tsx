import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useGetPublicBlogsQuery, BlogItem } from "@/rtk/slices/adminApiSlice";
import { useTranslation } from "react-i18next";
import { normalizeStoredLanguage } from "@/utils/languageUtils";

const useBlogLocale = () => {
  const { i18n } = useTranslation();
  const lang = normalizeStoredLanguage(i18n.language) as "en" | "zh" | "ja" | "th";
  const pick = (blog: BlogItem, field: "title" | "excerpt") => {
    if (lang !== "en") {
      const localised = blog[`${field}_${lang}` as keyof BlogItem] as string | undefined;
      if (localised?.trim()) return localised;
    }
    return (blog[`${field}_en` as keyof BlogItem] as string | undefined) || blog[field] || "";
  };
  return pick;
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

const fmtTime = (d: string) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

function BlogCard({ blog }: { blog: BlogItem }) {
  const pick = useBlogLocale();
  const { t } = useTranslation();
  const localTitle   = pick(blog, "title");
  const localExcerpt = pick(blog, "excerpt");

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* Cover image */}
      <Link to={`/blog/${blog.slug}`} className="block overflow-hidden">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {blog.cover_image ? (
            <img
              src={blog.cover_image}
              alt={localTitle}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-5xl text-gray-300">📝</span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Date + time row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {fmtDate(blog.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {fmtTime(blog.createdAt)}
          </span>
        </div>

        <Link to={`/blog/${blog.slug}`}>
          <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 hover:text-primary transition-colors mb-2">
            {localTitle}
          </h2>
        </Link>

        {localExcerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{localExcerpt}</p>
        )}

        <Link
          to={`/blog/${blog.slug}`}
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-primary transition-colors mt-auto"
        >
          {t("footer.readMore")} →
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
        <div className="h-5 bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/4 bg-gray-100 rounded mt-3" />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const { t } = useTranslation();

  const { data, isLoading, isFetching } = useGetPublicBlogsQuery({ page, limit: 9 });

  const loading    = isLoading || isFetching;
  const blogs      = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{t("footer.blogs")}</span>
        </nav>

        {/* Blog grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !blogs.length ? (
          <div className="text-center py-24 text-gray-400 space-y-2">
            <p className="text-4xl">📭</p>
            <p className="font-medium">No posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="h-8 w-8 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded border text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
