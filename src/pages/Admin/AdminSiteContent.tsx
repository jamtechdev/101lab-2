// @ts-nocheck
import { useState } from "react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import {
  Plus, Trash2, Pencil, Save, Loader2, ChevronDown, ChevronUp,
  FileText, Eye, EyeOff, Layers, Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import {
  useGetAdminSiteContentGroupsQuery,
  useCreateContentGroupMutation,
  useUpdateContentGroupMutation,
  useDeleteContentGroupMutation,
  useCreateContentItemMutation,
  useUpdateContentItemMutation,
  useDeleteContentItemMutation,
  useSeedSiteContentMutation,
  useTranslateBlogContentMutation,
  type ContentGroup,
  type ContentItem,
} from "@/rtk/slices/adminApiSlice";

const slugify = (str: string) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type LangTab = "en" | "zh" | "ja" | "th";

const EDITOR_OPTIONS = {
  height: "260",
  buttonList: [
    ["undo", "redo"],
    ["bold", "italic", "underline", "strike"],
    ["fontColor", "hiliteColor"],
    ["align", "list"],
    ["link"],
    ["removeFormat"],
    ["fullScreen", "codeView"],
  ],
};

// ── Group Dialog ──────────────────────────────────────────────────────────────
function GroupDialog({
  open, mode, item,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  item?: ContentGroup;
  onClose: () => void;
}) {
  const [langTab, setLangTab] = useState<LangTab>("en");
  const [name, setName]       = useState(item?.name ?? "");
  const [slug, setSlug]       = useState(item?.slug ?? "");
  const [desc, setDesc]       = useState(item?.description ?? "");
  const [nameZh, setNameZh]   = useState(item?.name_zh ?? "");
  const [nameJa, setNameJa]   = useState(item?.name_ja ?? "");
  const [nameTh, setNameTh]   = useState(item?.name_th ?? "");
  const [transLang, setTransLang] = useState<LangTab | null>(null);

  const [createGroup, { isLoading: creating }] = useCreateContentGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateContentGroupMutation();
  const [translateBlog, { isLoading: translating }] = useTranslateBlogContentMutation();

  const saving = creating || updating;

  const handleTranslateLang = async (lang: LangTab) => {
    if (!name.trim()) { toastError("Enter English name first"); return; }
    setTransLang(lang);
    try {
      const res = await translateBlog({ title: name, content: "" }).unwrap();
      const d = res.data;
      if (lang === "zh") setNameZh(d.title_zh ?? "");
      if (lang === "ja") setNameJa(d.title_ja ?? "");
      if (lang === "th") setNameTh(d.title_th ?? "");
      toastSuccess(`Translated to ${lang.toUpperCase()}`);
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    } finally {
      setTransLang(null);
    }
  };

  const handleTranslateAll = async () => {
    if (!name.trim()) { toastError("Enter English name first"); return; }
    try {
      const res = await translateBlog({ title: name, content: "" }).unwrap();
      const d = res.data;
      setNameZh(d.title_zh ?? "");
      setNameJa(d.title_ja ?? "");
      setNameTh(d.title_th ?? "");
      toastSuccess("Translated to ZH, JA, TH");
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toastError("Name is required"); return; }
    const finalSlug = slug.trim() || slugify(name);
    const payload = {
      name, slug: finalSlug, description: desc || undefined,
      name_zh: nameZh || undefined,
      name_ja: nameJa || undefined,
      name_th: nameTh || undefined,
    };
    try {
      if (mode === "create") {
        await createGroup(payload).unwrap();
        toastSuccess("Group created");
      } else {
        await updateGroup({ id: item!.id, ...payload }).unwrap();
        toastSuccess("Group updated");
      }
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-base font-bold">
            {mode === "create" ? "New Content Group" : "Edit Group"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Groups appear as section headings on the listing detail page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          {/* Slug + description — always visible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Slug (URL key)</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. sale-terms" className="h-9 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Internal note" className="h-9" />
            </div>
          </div>

          {/* Language tabs for name */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <p className="text-xs text-gray-400">Group heading in each language.</p>
              <Button type="button" variant="outline" size="sm" onClick={handleTranslateAll} disabled={translating || !name.trim()}
                className="gap-1.5 h-7 text-xs shrink-0 ml-3 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                {translating && !transLang
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Translating…</>
                  : <><Languages className="w-3 h-3" /> Translate All</>}
              </Button>
            </div>
            <Tabs value={langTab} onValueChange={(v) => setLangTab(v as LangTab)}>
              <TabsList className="w-full rounded-none border-b bg-muted/20 h-9">
                <TabsTrigger value="en" className="flex-1 text-xs h-8">🇺🇸 EN</TabsTrigger>
                <TabsTrigger value="zh" className="flex-1 text-xs h-8">🇹🇼 ZH {nameZh && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
                <TabsTrigger value="ja" className="flex-1 text-xs h-8">🇯🇵 JA {nameJa && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
                <TabsTrigger value="th" className="flex-1 text-xs h-8">🇹🇭 TH {nameTh && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
              </TabsList>
              <div className="p-4">
                {langTab === "en" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Group Name (English) <span className="text-red-500">*</span></label>
                    <Input value={name} onChange={(e) => { setName(e.target.value); if (mode === "create") setSlug(slugify(e.target.value)); }} placeholder="e.g. Sale Terms & Conditions" className="h-10" />
                  </div>
                )}
                {langTab !== "en" && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">Edit directly or generate from English.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleTranslateLang(langTab)} disabled={translating || !name.trim()}
                        className="gap-1.5 h-7 text-xs shrink-0 ml-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                        {transLang === langTab ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</> : <><Languages className="w-3 h-3" /> Generate from English</>}
                      </Button>
                    </div>
                    {langTab === "zh" && <Input value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder="中文群組名稱…" className="h-10" />}
                    {langTab === "ja" && <Input value={nameJa} onChange={(e) => setNameJa(e.target.value)} placeholder="日本語グループ名…" className="h-10" />}
                    {langTab === "th" && <Input value={nameTh} onChange={(e) => setNameTh(e.target.value)} placeholder="ชื่อกลุ่มภาษาไทย…" className="h-10" />}
                  </>
                )}
              </div>
            </Tabs>
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {mode === "create" ? "Create Group" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Item Dialog ───────────────────────────────────────────────────────────────
function ItemDialog({
  open, mode, groupId, item,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  groupId?: number;
  item?: ContentItem;
  onClose: () => void;
}) {
  const [langTab, setLangTab]     = useState<LangTab>("en");
  const [label, setLabel]         = useState(item?.label ?? "");
  const [content, setContent]     = useState(item?.content ?? "");
  const [labelZh, setLabelZh]     = useState(item?.label_zh ?? "");
  const [contentZh, setContentZh] = useState(item?.content_zh ?? "");
  const [labelJa, setLabelJa]     = useState(item?.label_ja ?? "");
  const [contentJa, setContentJa] = useState(item?.content_ja ?? "");
  const [labelTh, setLabelTh]     = useState(item?.label_th ?? "");
  const [contentTh, setContentTh] = useState(item?.content_th ?? "");
  const [transLang, setTransLang] = useState<LangTab | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const [createItem, { isLoading: creating }] = useCreateContentItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateContentItemMutation();
  const [translateBlog, { isLoading: translating }] = useTranslateBlogContentMutation();

  const saving = creating || updating;

  const extractParts = (rawTitle: string, rawContent: string, hasLabel: boolean) => {
    if (!hasLabel) return { lbl: rawTitle, cnt: rawContent };
    const lines = rawTitle.split("\n");
    return { lbl: lines[0] ?? rawTitle, cnt: rawContent };
  };

  const handleTranslateLang = async (lang: LangTab) => {
    if (!label.trim()) { toastError("Enter English label first"); return; }
    setTransLang(lang);
    try {
      const res = await translateBlog({ title: label, content: content }).unwrap();
      const d = res.data;
      if (lang === "zh") { setLabelZh(d.title_zh ?? ""); setContentZh(d.content_zh ?? ""); }
      if (lang === "ja") { setLabelJa(d.title_ja ?? ""); setContentJa(d.content_ja ?? ""); }
      if (lang === "th") { setLabelTh(d.title_th ?? ""); setContentTh(d.content_th ?? ""); }
      setEditorKey((k) => k + 1);
      toastSuccess(`Translated to ${lang.toUpperCase()}`);
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    } finally {
      setTransLang(null);
    }
  };

  const handleTranslateAll = async () => {
    if (!label.trim()) { toastError("Enter English label first"); return; }
    try {
      const res = await translateBlog({ title: label, content: content }).unwrap();
      const d = res.data;
      setLabelZh(d.title_zh ?? ""); setContentZh(d.content_zh ?? "");
      setLabelJa(d.title_ja ?? ""); setContentJa(d.content_ja ?? "");
      setLabelTh(d.title_th ?? ""); setContentTh(d.content_th ?? "");
      setEditorKey((k) => k + 1);
      toastSuccess("Translated to ZH, JA, TH");
    } catch (err: any) {
      toastError(err?.data?.message ?? "Translation failed");
    }
  };

  const resetForm = () => {
    setLangTab("en");
    setLabel(""); setContent("");
    setLabelZh(""); setContentZh("");
    setLabelJa(""); setContentJa("");
    setLabelTh(""); setContentTh("");
    setEditorKey((k) => k + 1);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { toastError("Label is required"); return; }
    const payload = {
      label, content: content || undefined,
      label_zh: labelZh || undefined, content_zh: contentZh || undefined,
      label_ja: labelJa || undefined, content_ja: contentJa || undefined,
      label_th: labelTh || undefined, content_th: contentTh || undefined,
    };
    try {
      if (mode === "create") {
        await createItem({ groupId: groupId!, ...payload }).unwrap();
        toastSuccess("Item added");
        resetForm();
      } else {
        await updateItem({ id: item!.id, ...payload }).unwrap();
        toastSuccess("Item updated");
      }
      onClose();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed");
    }
  };

  const LangContent = ({ lang }: { lang: LangTab }) => {
    const isEn   = lang === "en";
    const lbl    = isEn ? label    : lang === "zh" ? labelZh   : lang === "ja" ? labelJa   : labelTh;
    const cnt    = isEn ? content  : lang === "zh" ? contentZh : lang === "ja" ? contentJa : contentTh;
    const setLbl = isEn ? setLabel : lang === "zh" ? setLabelZh  : lang === "ja" ? setLabelJa  : setLabelTh;
    const setCnt = isEn ? setContent : lang === "zh" ? setContentZh : lang === "ja" ? setContentJa : setContentTh;
    const lblPh  = isEn ? "e.g. Inspection Terms" : lang === "zh" ? "中文標籤…" : lang === "ja" ? "日本語ラベル…" : "ป้ายกำกับภาษาไทย…";
    const cntPh  = isEn ? "Full paragraph text (leave blank for bullet-only)…" : lang === "zh" ? "中文內容…" : lang === "ja" ? "日本語の内容…" : "เนื้อหาภาษาไทย…";

    return (
      <>
        {!isEn && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Edit directly or generate from English.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => handleTranslateLang(lang)} disabled={translating || !label.trim()}
              className="gap-1.5 h-7 text-xs shrink-0 ml-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
              {transLang === lang ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</> : <><Languages className="w-3 h-3" /> Generate from English</>}
            </Button>
          </div>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Label / Point {isEn && <span className="text-red-500">*</span>}
            </label>
            <Input value={lbl} onChange={(e) => setLbl(e.target.value)} placeholder={lblPh} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Content (optional)</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ colorScheme: "light" }}>
              <SunEditor
                key={`${lang}-${item?.id ?? "new"}-${editorKey}`}
                setContents={cnt}
                onChange={(val) => setCnt(val)}
                setOptions={{ ...EDITOR_OPTIONS, placeholder: cntPh }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-base font-bold">
            {mode === "create" ? "Add Item" : "Edit Item"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            One expandable point or bullet within a group. Add translations in all 4 languages.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <p className="text-xs text-gray-400">Write in English, then translate.</p>
              <Button type="button" variant="outline" size="sm" onClick={handleTranslateAll} disabled={translating || !label.trim()}
                className="gap-1.5 h-7 text-xs shrink-0 ml-3 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                {translating && !transLang
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Translating…</>
                  : <><Languages className="w-3 h-3" /> Translate All with AI</>}
              </Button>
            </div>
            <Tabs value={langTab} onValueChange={(v) => setLangTab(v as LangTab)}>
              <TabsList className="w-full rounded-none border-b bg-muted/20 h-9">
                <TabsTrigger value="en" className="flex-1 text-xs h-8">🇺🇸 English</TabsTrigger>
                <TabsTrigger value="zh" className="flex-1 text-xs h-8">🇹🇼 中文 {labelZh && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
                <TabsTrigger value="ja" className="flex-1 text-xs h-8">🇯🇵 日本語 {labelJa && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
                <TabsTrigger value="th" className="flex-1 text-xs h-8">🇹🇭 ไทย {labelTh && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}</TabsTrigger>
              </TabsList>
              <div className="p-4">
                <LangContent lang={langTab} />
              </div>
            </Tabs>
          </div>

          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <Button type="button" variant="outline" className="flex-1 h-10" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {mode === "create" ? "Add Item" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSiteContent() {
  const { sidebarCollapsed } = useAdminSidebar();
  const { data, isLoading, isFetching } = useGetAdminSiteContentGroupsQuery();
  const groups: ContentGroup[] = data?.data ?? [];
  const loading = isLoading || isFetching;

  const [deleteGroup] = useDeleteContentGroupMutation();
  const [updateGroup] = useUpdateContentGroupMutation();
  const [updateItem]  = useUpdateContentItemMutation();
  const [deleteItem]  = useDeleteContentItemMutation();
  const [seedContent, { isLoading: seeding }] = useSeedSiteContentMutation();

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Group dialog state
  const [groupDlg, setGroupDlg] = useState<{ open: boolean; mode: "create" | "edit"; item?: ContentGroup }>({ open: false, mode: "create" });
  // Item dialog state
  const [itemDlg, setItemDlg]   = useState<{ open: boolean; mode: "create" | "edit"; groupId?: number; item?: ContentItem }>({ open: false, mode: "create" });

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm("Delete this group and all its items?")) return;
    try { await deleteGroup(id).unwrap(); toastSuccess("Deleted"); }
    catch (err: any) { toastError(err?.data?.message || "Failed"); }
  };
  const handleToggleGroupActive = async (g: ContentGroup) => {
    try { await updateGroup({ id: g.id, is_active: !g.is_active }).unwrap(); }
    catch (err: any) { toastError(err?.data?.message || "Failed"); }
  };
  const handleToggleItemActive = async (item: ContentItem) => {
    try { await updateItem({ id: item.id, is_active: !item.is_active }).unwrap(); }
    catch (err: any) { toastError(err?.data?.message || "Failed"); }
  };
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Delete this item?")) return;
    try { await deleteItem(id).unwrap(); toastSuccess("Deleted"); }
    catch (err: any) { toastError(err?.data?.message || "Failed"); }
  };
  const handleSeed = async () => {
    if (!window.confirm("Seed the 3 default content groups? Existing groups won't be overwritten.")) return;
    try { await seedContent().unwrap(); toastSuccess("Default content seeded"); }
    catch (err: any) { toastError(err?.data?.message || "Failed"); }
  };

  const langCount = (item: ContentItem) =>
    [item.label_zh, item.label_ja, item.label_th].filter(Boolean).length;

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <AdminSidebar activePath="/admin/site-content" />

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Site Content
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage Terms & Conditions, policies, and trust points shown on listing pages — in all 4 languages.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding} className="gap-2 text-xs">
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                Seed Defaults
              </Button>
              <Button onClick={() => setGroupDlg({ open: true, mode: "create" })} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4" /> Add Group
              </Button>
            </div>
          </div>

          {/* Groups */}
          {loading && [1,2,3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}

          {!loading && groups.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No content groups yet</p>
              <p className="text-xs text-gray-300 mt-1">Click "Seed Defaults" to load the standard terms, or create a group manually.</p>
            </div>
          )}

          {!loading && groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Group row */}
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{group.name}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">{group.slug}</span>
                    {/* Lang indicators */}
                    {group.name_zh && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">ZH</span>}
                    {group.name_ja && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">JA</span>}
                    {group.name_th && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-500 border border-amber-100">TH</span>}
                    {!group.is_active && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-400 border-gray-200">Hidden</span>}
                  </div>
                  {group.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{group.description}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-500 font-medium mr-2">{(group.items ?? []).length} item{(group.items ?? []).length !== 1 ? "s" : ""}</span>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setGroupDlg({ open: true, mode: "edit", item: group })} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className={cn("h-8 w-8 p-0", group.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-500 hover:bg-gray-100")}
                    onClick={() => handleToggleGroupActive(group)} title={group.is_active ? "Hide" : "Show"}>
                    {group.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteGroup(group.id)} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}>
                    {expanded[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Items */}
              {expanded[group.id] && (
                <div className="border-t border-gray-100">
                  {(group.items ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 px-5 py-3">No items yet.</p>
                  )}
                  {(group.items ?? []).map((item, idx) => (
                    <div key={item.id} className={cn("px-5 py-3 flex items-start gap-3", idx !== 0 && "border-t border-gray-50")}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn("text-sm font-medium", !item.is_active && "text-gray-400 line-through")}>{item.label}</p>
                          {/* Translation badges */}
                          {item.label_zh && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100">ZH</span>}
                          {item.label_ja && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-500 border border-rose-100">JA</span>}
                          {item.label_th && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-500 border border-amber-100">TH</span>}
                        </div>
                        {item.content && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.content}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setItemDlg({ open: true, mode: "edit", item })}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className={cn("h-7 w-7 p-0", item.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-500 hover:bg-gray-100")}
                          onClick={() => handleToggleItemActive(item)}>
                          {item.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-3 border-t border-gray-50">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-dashed text-gray-600 hover:text-primary hover:border-primary"
                      onClick={() => setItemDlg({ open: true, mode: "create", groupId: group.id })}>
                      <Plus className="w-3 h-3" /> Add Item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>

      {/* Dialogs */}
      <GroupDialog
        key={groupDlg.open ? `g-${groupDlg.item?.id ?? "new"}` : "g-closed"}
        open={groupDlg.open}
        mode={groupDlg.mode}
        item={groupDlg.item}
        onClose={() => setGroupDlg({ open: false, mode: "create" })}
      />
      <ItemDialog
        key={itemDlg.open ? `i-${itemDlg.item?.id ?? "new"}-${itemDlg.groupId ?? 0}` : "i-closed"}
        open={itemDlg.open}
        mode={itemDlg.mode}
        groupId={itemDlg.groupId}
        item={itemDlg.item}
        onClose={() => setItemDlg({ open: false, mode: "create" })}
      />
    </div>
  );
}
