import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight, Star, Eye, Calendar, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { cn } from "@/lib/utils";
import { useGetPublicBlogsQuery, useGetPublicBlogCategoriesQuery, BlogItem } from "@/rtk/slices/adminApiSlice";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

function BlogCard({ blog }: { blog: BlogItem }) {
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Cover image */}
      <div className="aspect-[16/9] bg-gray-50 overflow-hidden relative">
        {blog.cover_image ? (
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl">📝</span>
          </div>
        )}
        {blog.is_featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-current" />
            Featured
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {blog.category && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{blog.category}</span>
        )}
        <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {blog.title}
        </h2>
        {blog.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">{blog.excerpt}</p>
        )}

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fmt(blog.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {blog.view_count.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-1/4 bg-gray-100 rounded" />
        <div className="h-5 bg-gray-100 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded mt-4" />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory]       = useState("");

  const { data, isLoading, isFetching } = useGetPublicBlogsQuery({
    page,
    limit: 12,
    ...(category && { category }),
    ...(search   && { search }),
  });

  const { data: catData } = useGetPublicBlogCategoriesQuery();

  const loading    = isLoading || isFetching;
  const blogs      = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3 py-4">
          <h1 className="text-4xl font-bold text-gray-900">GreenBidz Blog</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Insights on recycling, sustainability, and the circular economy.
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              className="pl-9 pr-8 bg-white"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Category chips */}
        {catData?.data && catData.data.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => { setCategory(""); setPage(1); }}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                !category
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              )}
            >
              All
            </button>
            {catData.data.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                  category === cat
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Blog grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !blogs.length ? (
          <div className="text-center py-24 text-gray-400 space-y-2">
            <p className="text-4xl">📭</p>
            <p className="font-medium">No posts found</p>
            {(search || category) && (
              <button
                onClick={() => { clearSearch(); setCategory(""); }}
                className="text-sm text-primary hover:underline mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
