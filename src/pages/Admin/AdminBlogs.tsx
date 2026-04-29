import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, ChevronLeft, ChevronRight, BookOpen, Star, Eye,
  PlusCircle, Pencil, Trash2, Globe, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import {
  useGetAdminBlogsQuery,
  useToggleBlogStatusMutation,
  useToggleBlogFeaturedMutation,
  useDeleteBlogMutation,
  BlogItem,
} from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

const fmt = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color + "/10")}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        {loading
          ? <div className="h-7 w-14 bg-gray-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        }
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-600">{page} / {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AdminBlogs() {
  const { sidebarCollapsed } = useAdminSidebar();
  const navigate = useNavigate();

  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus]           = useState("all");

  const { data, isLoading, isFetching } = useGetAdminBlogsQuery({
    page,
    limit: 20,
    ...(status !== "all" && { status }),
    ...(search && { search }),
  });

  const [toggleStatus]   = useToggleBlogStatusMutation();
  const [toggleFeatured] = useToggleBlogFeaturedMutation();
  const [deleteBlog]     = useDeleteBlogMutation();

  const loading = isLoading || isFetching;

  const blogs: BlogItem[] = data?.data ?? [];
  const total             = data?.pagination?.total ?? 0;
  const totalPages        = data?.pagination?.pages ?? 1;
  const published         = blogs.filter((b) => b.status === "published").length;
  const featured          = blogs.filter((b) => b.is_featured).length;

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await toggleStatus(id).unwrap();
      toastSuccess(`Blog ${res.data.status === "published" ? "published" : "set to draft"}`);
    } catch { toastError("Failed to update status"); }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await toggleFeatured(id).unwrap();
      toastSuccess("Featured status updated");
    } catch { toastError("Failed to update featured"); }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteBlog(id).unwrap();
      toastSuccess("Blog deleted");
    } catch { toastError("Failed to delete blog"); }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <AdminSidebar activePath="/admin/blogs" />

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage blog posts and articles</p>
            </div>
            <Button onClick={() => navigate("/admin/blogs/new")} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Post
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Posts"  value={total}     icon={BookOpen}  color="text-purple-600"  loading={loading} />
            <StatCard label="Published"    value={published} icon={Globe}     color="text-emerald-600" loading={loading} />
            <StatCard label="Featured"     value={featured}  icon={Star}      color="text-amber-500"   loading={loading} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search title, author..."
                  className="pl-9 pr-8"
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
              <Button onClick={handleSearch} className="shrink-0">Search</Button>
            </div>

            <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <TabsList className="h-9">
                <TabsTrigger value="all"       className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="published" className="text-xs px-3">Published</TabsTrigger>
                <TabsTrigger value="draft"     className="text-xs px-3">Draft</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Author</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !blogs.length ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                        No blog posts found
                      </td>
                    </tr>
                  ) : (
                    blogs.map((blog, i) => (
                      <tr key={blog.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                          {blog.excerpt && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{blog.excerpt}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {blog.category ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{blog.author}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(blog.id)}
                            className={cn(
                              "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                              blog.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            {blog.status === "published" ? "Published" : "Draft"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(blog.id)}
                            className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                              blog.is_featured
                                ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                : "bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400"
                            )}
                          >
                            <Star className={cn("h-3.5 w-3.5", blog.is_featured && "fill-current")} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {blog.view_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(blog.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(blog.id, blog.title)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
