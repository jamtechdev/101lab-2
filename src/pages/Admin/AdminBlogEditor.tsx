import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { ArrowLeft, Save, Star, Globe, Tag, X, Upload, ImageIcon, Languages, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useGetAdminBlogQuery,
  useTranslateBlogContentMutation,
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

const EDITOR_OPTIONS = {
  height: "400",
  buttonList: EDITOR_BUTTONS,
  imageUploadSizeLimit: 5 * 1024 * 1024,
};

const CATEGORIES = [
  "Sustainability", "Recycling", "Industry News", "Tech", "Tips & Guides",
  "Company News", "Events", "Case Studies",
];

const LANG_LABELS: Record<string, string> = {
  zh: "Chinese",
  ja: "Japanese",
  th: "Thai",
};

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAdminSidebar();

  // ── English (primary) fields ──────────────────────────────────────────────
  const [title, setTitle]     = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // ── Chinese fields ────────────────────────────────────────────────────────
  const [titleZh, setTitleZh]     = useState("");
  const [excerptZh, setExcerptZh] = useState("");
  const [contentZh, setContentZh] = useState("");

  // ── Japanese fields ───────────────────────────────────────────────────────
  const [titleJa, setTitleJa]     = useState("");
  const [excerptJa, setExcerptJa] = useState("");
  const [contentJa, setContentJa] = useState("");

  // ── Thai fields ───────────────────────────────────────────────────────────
  const [titleTh, setTitleTh]     = useState("");
  const [excerptTh, setExcerptTh] = useState("");
  const [contentTh, setContentTh] = useState("");

  // ── Sidebar meta fields ───────────────────────────────────────────────────
  const [coverImage, setCoverImage]         = useState("");   // existing URL (from DB)
  const [coverImageBase64, setCoverImageBase64] = useState(""); // new pending file (base64)
  const [author, setAuthor]           = useState("GreenBidz Team");
  const [category, setCategory]       = useState("");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [seoTitle, setSeoTitle]       = useState("");
  const [seoDesc, setSeoDesc]         = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [isFeatured, setIsFeatured]   = useState(false);
  const [status, setStatus]           = useState<"draft" | "published">("draft");

  // ── Language tab + SunEditor re-mount keys ────────────────────────────────
  const [langTab, setLangTab]               = useState<"en" | "zh" | "ja" | "th">("en");
  const [translatingLang, setTranslatingLang] = useState<"zh" | "ja" | "th" | null>(null);
  const [zhKey, setZhKey] = useState(0);
  const [jaKey, setJaKey] = useState(0);
  const [thKey, setThKey] = useState(0);
  const [dataLoadKey, setDataLoadKey] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── RTK mutations ─────────────────────────────────────────────────────────
  const [translateBlog, { isLoading: translating }]         = useTranslateBlogContentMutation();
  const [createBlog, { isLoading: creating }]               = useCreateBlogMutation();
  const [updateBlog, { isLoading: updating }]               = useUpdateBlogMutation();
  const saving = creating || updating;

  const { data: editData, isLoading: loadingEdit } = useGetAdminBlogQuery(
    Number(id), { skip: !isEdit }
  );

  // Populate form when editing
  useEffect(() => {
    if (!isEdit || !editData?.data) return;
    const b = editData.data;
    setTitle(b.title_en ?? b.title);
    setExcerpt(b.excerpt_en ?? b.excerpt ?? "");
    setContent(b.content_en ?? b.content ?? "");
    setTitleZh(b.title_zh ?? "");
    setExcerptZh(b.excerpt_zh ?? "");
    setContentZh(b.content_zh ?? "");
    setTitleJa(b.title_ja ?? "");
    setExcerptJa(b.excerpt_ja ?? "");
    setContentJa(b.content_ja ?? "");
    setTitleTh(b.title_th ?? "");
    setExcerptTh(b.excerpt_th ?? "");
    setContentTh(b.content_th ?? "");
    setCoverImage(b.cover_image ?? "");
    setAuthor(b.author);
    setCategory(b.category ?? "");
    setTags(b.tags ?? []);
    setSeoTitle(b.seo_title ?? "");
    setSeoDesc(b.seo_description ?? "");
    setSeoKeywords(b.seo_keywords ?? "");
    setIsFeatured(b.is_featured);
    setStatus(b.status);
    setDataLoadKey((k) => k + 1);
  }, [editData, isEdit]);

  // ── Translation helpers ───────────────────────────────────────────────────
  const handleTranslateAll = async () => {
    if (!title.trim()) { toastError("Please enter a title before translating"); return; }
    try {
      const res = await translateBlog({ title, excerpt, content }).unwrap();
      const d = res.data;
      setTitleZh(d.title_zh); setExcerptZh(d.excerpt_zh); setContentZh(d.content_zh);
      setTitleJa(d.title_ja); setExcerptJa(d.excerpt_ja); setContentJa(d.content_ja);
      setTitleTh(d.title_th); setExcerptTh(d.excerpt_th); setContentTh(d.content_th);
      setZhKey((k) => k + 1); setJaKey((k) => k + 1); setThKey((k) => k + 1);
      toastSuccess("Translated into Chinese, Japanese and Thai");
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    }
  };

  const handleTranslateLang = async (lang: "zh" | "ja" | "th") => {
    if (!title.trim()) { toastError("Please enter a title before translating"); return; }
    setTranslatingLang(lang);
    try {
      const res = await translateBlog({ title, excerpt, content }).unwrap();
      const d = res.data;
      if (lang === "zh") { setTitleZh(d.title_zh); setExcerptZh(d.excerpt_zh); setContentZh(d.content_zh); setZhKey((k) => k + 1); }
      if (lang === "ja") { setTitleJa(d.title_ja); setExcerptJa(d.excerpt_ja); setContentJa(d.content_ja); setJaKey((k) => k + 1); }
      if (lang === "th") { setTitleTh(d.title_th); setExcerptTh(d.excerpt_th); setContentTh(d.content_th); setThKey((k) => k + 1); }
      toastSuccess(`Generated ${LANG_LABELS[lang]} content`);
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    } finally {
      setTranslatingLang(null);
    }
  };

  // ── Image selection (preview locally; actual file sent on save) ─────────
  const pendingFileRef = useRef<File | null>(null);

  const handleImageSelect = (file: File) => {
    pendingFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImageBase64(e.target?.result as string);
      setCoverImage("");
    };
    reader.readAsDataURL(file);
  };

  // ── Tags ──────────────────────────────────────────────────────────────────
  const addTag = (raw: string) => {
    const t = raw.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (saveStatus: "draft" | "published") => {
    if (!title.trim()) { toastError("Title is required"); return; }

    // Auto-translate missing languages before saving
    let tZh = titleZh, eZh = excerptZh, cZh = contentZh;
    let tJa = titleJa, eJa = excerptJa, cJa = contentJa;
    let tTh = titleTh, eTh = excerptTh, cTh = contentTh;

    const needsTranslation = !titleZh.trim() || !titleJa.trim() || !titleTh.trim();
    if (needsTranslation) {
      try {
        const res = await translateBlog({ title, excerpt, content }).unwrap();
        const d = res.data;
        if (!titleZh.trim()) { tZh = d.title_zh; eZh = d.excerpt_zh; cZh = d.content_zh; }
        if (!titleJa.trim()) { tJa = d.title_ja; eJa = d.excerpt_ja; cJa = d.content_ja; }
        if (!titleTh.trim()) { tTh = d.title_th; eTh = d.excerpt_th; cTh = d.content_th; }
      } catch {
        // Continue saving with whatever is available if translation fails
      }
    }

    const fd = new FormData();
    const append = (k: string, v: any) => fd.append(k, v == null ? "" : String(v));

    append("title",          title);
    append("excerpt",        excerpt);
    append("content",        content);
    append("title_en",       title);
    append("excerpt_en",     excerpt);
    append("content_en",     content);
    append("title_zh",       tZh);
    append("excerpt_zh",     eZh);
    append("content_zh",     cZh);
    append("title_ja",       tJa);
    append("excerpt_ja",     eJa);
    append("content_ja",     cJa);
    append("title_th",       tTh);
    append("excerpt_th",     eTh);
    append("content_th",     cTh);
    append("author",         author);
    append("category",       category || "");
    append("seo_title",      seoTitle);
    append("seo_description", seoDesc);
    append("seo_keywords",   seoKeywords);
    append("is_featured",    String(isFeatured));
    append("status",         saveStatus);
    fd.append("tags", JSON.stringify(tags));

    // Attach the pending image file if one was selected
    if (pendingFileRef.current) {
      fd.append("cover_image", pendingFileRef.current);
    }

    try {
      if (isEdit) {
        await updateBlog({ id: Number(id), formData: fd }).unwrap();
        toastSuccess("Blog updated");
      } else {
        await createBlog(fd).unwrap();
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
                  disabled={saving || translating}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave("published")}
                  disabled={saving || translating}
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

                {/* Title + Content with language tabs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Translate All button */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <p className="text-xs text-gray-400">
                      Write in English, then translate to all languages with AI — or edit each language manually.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTranslateAll}
                      disabled={translating || !title.trim()}
                      className="gap-1.5 h-7 text-xs shrink-0 ml-3"
                    >
                      {translating && !translatingLang
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Languages className="h-3 w-3" />}
                      {translating && !translatingLang ? "Translating…" : "Translate All with AI"}
                    </Button>
                  </div>

                  <Tabs value={langTab} onValueChange={(v) => setLangTab(v as typeof langTab)}>
                    <TabsList className="w-full rounded-none border-b bg-muted/20 h-9">
                      <TabsTrigger value="en" className="flex-1 text-xs h-8">🇺🇸 English</TabsTrigger>
                      <TabsTrigger value="zh" className="flex-1 text-xs h-8">🇹🇼 中文</TabsTrigger>
                      <TabsTrigger value="ja" className="flex-1 text-xs h-8">🇯🇵 日本語</TabsTrigger>
                      <TabsTrigger value="th" className="flex-1 text-xs h-8">🇹🇭 ไทย</TabsTrigger>
                    </TabsList>

                    {/* English */}
                    <TabsContent value="en" className="p-5 space-y-4 mt-0">
                      <div className="space-y-1.5">
                        <Label>Title *</Label>
                        <Input
                          placeholder="Enter blog post title in English..."
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
                      <div className="space-y-1.5">
                        <Label>Content</Label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <SunEditor
                            key={`en-${dataLoadKey}`}
                            setContents={content}
                            onChange={setContent}
                            setOptions={{ ...EDITOR_OPTIONS, placeholder: "Write your blog post content here..." }}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Chinese */}
                    <TabsContent value="zh" className="p-5 space-y-4 mt-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Edit Chinese content directly, or generate from English using AI.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranslateLang("zh")}
                          disabled={translating || !title.trim()}
                          className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                        >
                          {translatingLang === "zh"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Languages className="h-3 w-3" />}
                          {translatingLang === "zh" ? "Generating…" : "Generate from English"}
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Title (Chinese)</Label>
                        <Input placeholder="Chinese title…" value={titleZh} onChange={(e) => setTitleZh(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Excerpt (Chinese)</Label>
                        <Textarea placeholder="Chinese excerpt…" value={excerptZh} onChange={(e) => setExcerptZh(e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Content (Chinese)</Label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <SunEditor
                            key={`zh-${dataLoadKey}-${zhKey}`}
                            setContents={contentZh}
                            onChange={setContentZh}
                            setOptions={{ ...EDITOR_OPTIONS, placeholder: "Chinese rich content…" }}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Japanese */}
                    <TabsContent value="ja" className="p-5 space-y-4 mt-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Edit Japanese content directly, or generate from English using AI.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranslateLang("ja")}
                          disabled={translating || !title.trim()}
                          className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                        >
                          {translatingLang === "ja"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Languages className="h-3 w-3" />}
                          {translatingLang === "ja" ? "Generating…" : "Generate from English"}
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Title (Japanese)</Label>
                        <Input placeholder="Japanese title…" value={titleJa} onChange={(e) => setTitleJa(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Excerpt (Japanese)</Label>
                        <Textarea placeholder="Japanese excerpt…" value={excerptJa} onChange={(e) => setExcerptJa(e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Content (Japanese)</Label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <SunEditor
                            key={`ja-${dataLoadKey}-${jaKey}`}
                            setContents={contentJa}
                            onChange={setContentJa}
                            setOptions={{ ...EDITOR_OPTIONS, placeholder: "Japanese rich content…" }}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Thai */}
                    <TabsContent value="th" className="p-5 space-y-4 mt-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Edit Thai content directly, or generate from English using AI.</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranslateLang("th")}
                          disabled={translating || !title.trim()}
                          className="gap-1.5 h-7 text-xs shrink-0 ml-2"
                        >
                          {translatingLang === "th"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Languages className="h-3 w-3" />}
                          {translatingLang === "th" ? "Generating…" : "Generate from English"}
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Title (Thai)</Label>
                        <Input placeholder="Thai title…" value={titleTh} onChange={(e) => setTitleTh(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Excerpt (Thai)</Label>
                        <Textarea placeholder="Thai excerpt…" value={excerptTh} onChange={(e) => setExcerptTh(e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Content (Thai)</Label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <SunEditor
                            key={`th-${dataLoadKey}-${thKey}`}
                            setContents={contentTh}
                            onChange={setContentTh}
                            setOptions={{ ...EDITOR_OPTIONS, placeholder: "Thai rich content…" }}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageSelect(file);
                      e.target.value = "";
                    }}
                  />
                  {(coverImageBase64 || coverImage) ? (
                    <div className="relative group">
                      <img
                        src={coverImageBase64 || coverImage}
                        alt="Cover preview"
                        className="w-full h-40 object-cover rounded-xl border border-gray-100"
                      />
                      {coverImageBase64 && (
                        <span className="absolute top-2 left-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                          Pending save
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-1.5 text-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setCoverImage(""); setCoverImageBase64(""); }}
                          className="gap-1.5 text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary"
                    >
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm font-medium">Click to select cover image</span>
                      <span className="text-xs">Saved when you publish / save draft</span>
                    </button>
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
