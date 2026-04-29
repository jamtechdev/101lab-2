import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { ArrowLeft, Save, Star, Globe, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useGetAdminBlogQuery,
} from "@/rtk/slices/adminApiSlice";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

const EDITOR_BUTTONS = [
  ["undo", "redo"],
  ["bold", "italic", "underline", "strike"],
  ["fontColor", "hiliteColor"],
  ["outdent", "indent"],
  ["align", "horizontalRule", "list"],
  ["table", "link", "image"],
  ["fontSize", "formatBlock"],
  ["removeFormat"],
  ["fullScreen", "codeView"],
];

const CATEGORIES = [
  "Sustainability", "Recycling", "Industry News", "Tech", "Tips & Guides",
  "Company News", "Events", "Case Studies",
];

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAdminSidebar();

  // Form state
  const [title, setTitle]             = useState("");
  const [excerpt, setExcerpt]         = useState("");
  const [content, setContent]         = useState("");
  const [coverImage, setCoverImage]   = useState("");
  const [author, setAuthor]           = useState("GreenBidz Team");
  const [category, setCategory]       = useState("");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [seoTitle, setSeoTitle]       = useState("");
  const [seoDesc, setSeoDesc]         = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [isFeatured, setIsFeatured]   = useState(false);
  const [status, setStatus]           = useState<"draft" | "published">("draft");

  const { data: editData, isLoading: loadingEdit } = useGetAdminBlogQuery(
    Number(id), { skip: !isEdit }
  );

  const [createBlog, { isLoading: creating }] = useCreateBlogMutation();
  const [updateBlog, { isLoading: updating }] = useUpdateBlogMutation();
  const saving = creating || updating;

  // Populate form when editing
  useEffect(() => {
    if (!isEdit || !editData?.data) return;
    const b = editData.data;
    setTitle(b.title);
    setExcerpt(b.excerpt ?? "");
    setContent(b.content ?? "");
    setCoverImage(b.cover_image ?? "");
    setAuthor(b.author);
    setCategory(b.category ?? "");
    setTags(b.tags ?? []);
    setSeoTitle(b.seo_title ?? "");
    setSeoDesc(b.seo_description ?? "");
    setSeoKeywords(b.seo_keywords ?? "");
    setIsFeatured(b.is_featured);
    setStatus(b.status);
  }, [editData, isEdit]);

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleSave = async (saveStatus: "draft" | "published") => {
    if (!title.trim()) { toastError("Title is required"); return; }
    const payload = {
      title, excerpt, content, cover_image: coverImage, author,
      tags, category: category || null, seo_title: seoTitle,
      seo_description: seoDesc, seo_keywords: seoKeywords,
      is_featured: isFeatured, status: saveStatus,
    };
    try {
      if (isEdit) {
        await updateBlog({ id: Number(id), ...payload }).unwrap();
        toastSuccess("Blog updated");
      } else {
        await createBlog(payload).unwrap();
        toastSuccess("Blog created");
        navigate("/admin/blogs");
      }
    } catch (err: any) {
      toastError(err?.data?.message ?? "Failed to save blog");
    }
  };

  if (isEdit && loadingEdit) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <AdminSidebar activePath="/admin/blogs" />

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto space-y-5">

            {/* Top bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/admin/blogs")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blogs
              </button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave("published")}
                  disabled={saving}
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  {status === "published" ? "Update" : "Publish"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── Main content (2/3) ── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Title */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Enter blog post title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Excerpt</Label>
                    <Textarea
                      placeholder="Short summary shown in listing cards..."
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Content editor */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                  <Label>Content</Label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <SunEditor
                      setContents={content}
                      onChange={setContent}
                      setOptions={{
                        height: "500",
                        buttonList: EDITOR_BUTTONS,
                        placeholder: "Write your blog post content here...",
                        imageUploadSizeLimit: 5 * 1024 * 1024,
                      }}
                    />
                  </div>
                </div>

                {/* SEO */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm">SEO Settings</h3>
                  <div className="space-y-1.5">
                    <Label>SEO Title</Label>
                    <Input
                      placeholder="Defaults to post title if empty..."
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">{seoTitle.length} / 60 chars</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Description</Label>
                    <Textarea
                      placeholder="Brief description for search engines..."
                      value={seoDesc}
                      onChange={(e) => setSeoDesc(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-gray-400">{seoDesc.length} / 160 chars</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Keywords</Label>
                    <Input
                      placeholder="recycling, sustainability, green..."
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── Sidebar (1/3) ── */}
              <div className="space-y-4">

                {/* Publish settings */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Publish Settings</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <p className="text-xs text-gray-400">{status === "published" ? "Live on website" : "Not visible to public"}</p>
                    </div>
                    <span className={cn(
                      "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border",
                      status === "published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Featured</p>
                      <p className="text-xs text-gray-400">Show in featured section</p>
                    </div>
                    <button
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                        isFeatured
                          ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                          : "bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400"
                      )}
                    >
                      <Star className={cn("h-4 w-4", isFeatured && "fill-current")} />
                    </button>
                  </div>
                </div>

                {/* Cover image */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Cover Image</h3>
                  <Input
                    placeholder="Paste image URL..."
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                  />
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="w-full h-40 object-cover rounded-xl border border-gray-100"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>

                {/* Category */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Category</h3>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 text-sm text-gray-700"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Tags</h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        className="pl-8 text-sm"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTag(tagInput);
                          }
                        }}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addTag(tagInput)}>Add</Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full"
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
