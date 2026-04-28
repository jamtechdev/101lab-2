// @ts-nocheck
import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle, CheckCircle2, Clock, Globe, Loader2, Search, Gavel,
  Languages, Package, Users, Calendar, ChevronDown, ChevronUp,
  Sparkles, X, Star, Layers, Plus, Trash2, Pencil, MapPin, FileText,
  Car, Phone, CreditCard, Info, HelpCircle, Truck, Eye, Tag as TagIcon,
  Wand2, Save,
} from "lucide-react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/helper/toasterNotification";
import {
  useGetAdminAuctionGroupsQuery,
  useApproveAuctionGroupMutation,
  useSetAuctionGroupFeaturedMutation,
  useGetGroupTagsQuery,
  useCreateGroupTagMutation,
  useUpdateGroupTagMutation,
  useDeleteGroupTagMutation,
  useTranslateTagContentMutation,
  AdminAuctionGroupItem,
  AuctionGroupTag,
} from "@/rtk/slices/adminApiSlice";

/* ── Constants ──────────────────────────────────────────────────────────── */
const PLATFORMS = [
  { value: "greenbidz",    label: "GreenBidz" },
  { value: "recycle",      label: "Recycle" },
  { value: "LabGreenbidz", label: "Lab-GreenBidz" },
  { value: "machines",     label: "Machines" },
];

const LANGS = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "zh", label: "ZH", flag: "🇹🇼" },
  { code: "ja", label: "JA", flag: "🇯🇵" },
  { code: "th", label: "TH", flag: "🇹🇭" },
];

const EDITOR_BUTTONS = [
  ["bold", "italic", "underline", "strike"],
  ["list", "align"],
  ["link"],
  ["removeFormat"],
];

/* ── Icon resolver (matches backend resolveIcon) ────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  "map-pin": MapPin, "file-text": FileText, "car": Car, "phone": Phone,
  "clock": Clock, "credit-card": CreditCard, "info": Info, "help-circle": HelpCircle,
  "truck": Truck, "eye": Eye, "tag": TagIcon,
};
const getTagIcon = (name: string) => ICON_MAP[name] ?? TagIcon;

/* ── Chip color cycle ───────────────────────────────────────────────────── */
const CHIP_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amberald-100",
  "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
];

/* ── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color, trend }: {
  title: string; value: number; icon: React.ElementType; color: string; trend?: string;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-background to-muted/30">
    <div className={`absolute top-0 right-0 w-40 h-40 ${color} opacity-5 rounded-full -mr-20 -mt-20`} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-15`}>
        <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl font-bold ${color.replace("bg-", "text-")}`}>{value}</div>
        {trend && <span className="text-xs text-muted-foreground font-medium">{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

/* ── Tag chip ───────────────────────────────────────────────────────────── */
function TagChip({ tag, index, onClick }: { tag: AuctionGroupTag; index: number; onClick: () => void }) {
  const Icon = getTagIcon(tag.tag_icon);
  const color = CHIP_COLORS[index % CHIP_COLORS.length];
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer", color)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {tag.tag_name}
    </button>
  );
}

/* ── Tag view/edit modal ────────────────────────────────────────────────── */
function TagModal({
  tag, groupId, onClose,
}: {
  tag: AuctionGroupTag | null; groupId: number; onClose: () => void;
}) {
  const [activeLang, setActiveLang] = useState("en");
  const [editMode, setEditMode] = useState(false);
  const [contents, setContents] = useState<Record<string, string>>({
    en: tag?.content_en ?? "",
    zh: tag?.content_zh ?? "",
    ja: tag?.content_ja ?? "",
    th: tag?.content_th ?? "",
  });

  const [updateTag, { isLoading: saving }] = useUpdateGroupTagMutation();
  const [translateTag, { isLoading: translating }] = useTranslateTagContentMutation();

  if (!tag) return null;
  const Icon = getTagIcon(tag.tag_icon);

  const handleTranslate = async () => {
    const sourceContent = contents.en || tag.content_en || "";
    if (!sourceContent.trim()) { toastError("Write English content first"); return; }
    try {
      const res = await translateTag({ content: sourceContent, tag_name: tag.tag_name, source_lang: "en" }).unwrap();
      setContents({
        en: res.data.content_en || contents.en,
        zh: res.data.content_zh || "",
        ja: res.data.content_ja || "",
        th: res.data.content_th || "",
      });
      toastSuccess("Translated to all languages");
    } catch { toastError("Translation failed"); }
  };

  const handleSave = async () => {
    try {
      await updateTag({
        groupId, tagId: tag.tag_id,
        content_en: contents.en, content_zh: contents.zh,
        content_ja: contents.ja, content_th: contents.th,
      }).unwrap();
      toastSuccess("Tag saved");
      setEditMode(false);
    } catch { toastError("Save failed"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{tag.tag_name}</h3>
              <p className="text-xs text-gray-400">Group #{groupId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {editMode && (
              <>
                <Button size="sm" variant="outline" onClick={handleTranslate} disabled={translating} className="gap-1.5">
                  {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  AI Translate
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Language tabs */}
        <div className="flex border-b px-6 gap-1 pt-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setActiveLang(l.code)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeLang === l.code
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {LANGS.map((l) => (
            <div key={l.code} className={activeLang === l.code ? "block" : "hidden"}>
              {editMode ? (
                <SunEditor
                  key={`${tag.tag_id}-${l.code}-edit`}
                  setContents={contents[l.code]}
                  onChange={(html) => setContents((p) => ({ ...p, [l.code]: html }))}
                  setOptions={{
                    height: "240",
                    buttonList: EDITOR_BUTTONS,
                    placeholder: `Enter ${LANGS.find((x) => x.code === l.code)?.label} content…`,
                  }}
                />
              ) : (
                <div
                  className="rich-content min-h-[80px] text-gray-700"
                  dangerouslySetInnerHTML={{ __html: contents[l.code] || "<p class='text-gray-400 italic'>No content yet.</p>" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Create tag modal ───────────────────────────────────────────────────── */
function CreateTagModal({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const [tagName, setTagName] = useState("");
  const [activeLang, setActiveLang] = useState("en");
  const [contents, setContents] = useState({ en: "", zh: "", ja: "", th: "" });

  const [createTag, { isLoading: creating }] = useCreateGroupTagMutation();
  const [translateTag, { isLoading: translating }] = useTranslateTagContentMutation();

  const handleTranslate = async () => {
    if (!contents.en.trim()) { toastError("Write English content first to translate"); return; }
    if (!tagName.trim()) { toastError("Enter a tag name first"); return; }
    try {
      const res = await translateTag({ content: contents.en, tag_name: tagName, source_lang: "en" }).unwrap();
      setContents({
        en: res.data.content_en || contents.en,
        zh: res.data.content_zh || "",
        ja: res.data.content_ja || "",
        th: res.data.content_th || "",
      });
      toastSuccess("Translated to ZH, JA, TH");
    } catch { toastError("Translation failed"); }
  };

  const handleCreate = async () => {
    if (!tagName.trim()) { toastError("Tag name is required"); return; }
    try {
      // If user hasn't translated yet, create with server-side AI translation
      await createTag({
        groupId,
        tag_name: tagName.trim(),
        content: contents.en,
        source_lang: "en",
      }).unwrap();
      // If user already filled all langs manually, update after create — but
      // the server-side translation covers the common case cleanly.
      toastSuccess("Tag created with AI translations");
      onClose();
    } catch { toastError("Failed to create tag"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Create New Tag</h3>
              <p className="text-xs text-gray-400">AI will translate to all languages</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Tag name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tag Name</label>
            <Input
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. Location, Terms & Conditions, Parking Info…"
              className="h-10 rounded-xl border-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">Icon is auto-assigned based on the name.</p>
          </div>

          {/* Language tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content</label>
              <Button size="sm" variant="outline" onClick={handleTranslate} disabled={translating} className="gap-1.5 h-7 text-xs">
                {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI Translate from EN
              </Button>
            </div>
            <div className="flex border-b gap-1 mb-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setActiveLang(l.code)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    activeLang === l.code ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  {l.flag} {l.label}
                  {l.code !== "en" && contents[l.code] && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  )}
                </button>
              ))}
            </div>
            {LANGS.map((l) => (
              <div key={l.code} className={activeLang === l.code ? "block" : "hidden"}>
                <SunEditor
                  key={`create-${l.code}`}
                  setContents={contents[l.code]}
                  onChange={(html) => setContents((p) => ({ ...p, [l.code]: html }))}
                  setOptions={{
                    height: "220",
                    buttonList: EDITOR_BUTTONS,
                    placeholder: l.code === "en"
                      ? "Enter content in English. Use 'AI Translate' to fill other languages."
                      : `${LANGS.find((x) => x.code === l.code)?.label} content (auto-filled by AI or edit manually)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Tag
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Tags panel (inside expanded group) ─────────────────────────────────── */
function GroupTagsPanel({ group }: { group: AdminAuctionGroupItem }) {
  const { data, isLoading } = useGetGroupTagsQuery(group.group_id);
  const [deleteTag] = useDeleteGroupTagMutation();

  const [viewTag, setViewTag] = useState<AuctionGroupTag | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const tags: AuctionGroupTag[] = data?.data ?? [];

  const handleDelete = async (tag: AuctionGroupTag, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete tag "${tag.tag_name}"?`)) return;
    try {
      await deleteTag({ groupId: group.group_id, tagId: tag.tag_id }).unwrap();
      toastSuccess("Tag deleted");
    } catch { toastError("Failed to delete tag"); }
  };

  return (
    <>
      <div className="px-6 pb-4 pt-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Content Tags</span>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="gap-1.5 h-7 text-xs rounded-lg">
            <Plus className="h-3 w-3" /> Add Tag
          </Button>
        </div>

        {isLoading ? (
          <div className="flex gap-2">{[1,2].map(i => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}</div>
        ) : tags.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No tags yet. Add your first tag above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <div key={tag.tag_id} className="flex items-center gap-1 group/chip">
                <TagChip tag={tag} index={i} onClick={() => setViewTag(tag)} />
                <button
                  onClick={(e) => handleDelete(tag, e)}
                  className="h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover/chip:opacity-100 transition-opacity hover:bg-red-100 text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewTag && <TagModal tag={viewTag} groupId={group.group_id} onClose={() => setViewTag(null)} />}
      {showCreate && <CreateTagModal groupId={group.group_id} onClose={() => setShowCreate(false)} />}
    </>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
const AdminAuctionGroups = () => {
  const { sidebarCollapsed } = useAdminSidebar();
  const [platformType, setPlatformType] = useState("LabGreenbidz");
  const [approvalFilter, setApprovalFilter] = useState<"all"|"pending"|"approved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest"|"oldest">("newest");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [featuringId, setFeaturingId] = useState<number | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminAuctionGroupsQuery({
    approval_status: approvalFilter,
    site_id: platformType,
  });

  const [approveAuctionGroup] = useApproveAuctionGroupMutation();
  const [setAuctionGroupFeatured] = useSetAuctionGroupFeaturedMutation();

  const groups: AdminAuctionGroupItem[] = data?.data ?? [];

  const stats = useMemo(() => ({
    total:    groups.length,
    pending:  groups.filter((g) => g.approval_status === "pending").length,
    approved: groups.filter((g) => g.approval_status === "approved").length,
    featured: groups.filter((g) => g.featured_type !== "none").length,
  }), [groups]);

  const filtered = useMemo(() => {
    let list = [...groups];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(q) ||
        String(g.group_id).includes(q) ||
        String(g.seller_id).includes(q) ||
        g.country?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const da = new Date(a.createdAt).getTime(), db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return list;
  }, [groups, searchQuery, sortOrder]);

  const handleApprove = async (groupId: number) => {
    setApprovingId(groupId);
    try {
      await approveAuctionGroup(groupId).unwrap();
      toastSuccess("Auction group approved");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to approve");
    } finally { setApprovingId(null); }
  };

  const handleToggleFeatured = async (group: AdminAuctionGroupItem) => {
    const next = group.featured_type === "none" ? "featured" : "none";
    setFeaturingId(group.group_id);
    try {
      await setAuctionGroupFeatured({ groupId: group.group_id, featured_type: next }).unwrap();
      toastSuccess(next === "featured" ? "Marked as featured" : "Removed from featured");
      refetch();
    } catch (err: any) {
      toastError(err?.data?.message || "Failed to update featured");
    } finally { setFeaturingId(null); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <AdminSidebar activePath="/admin/auction-groups" />
      <div className={cn("transition-all duration-300 min-h-screen", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          {[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activePath="/admin/auction-groups" />
      <div className={cn("transition-all duration-300 min-h-screen flex items-center justify-center", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">Failed to load auction groups</CardTitle></CardHeader></Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar activePath="/admin/auction-groups" />
      <div className={cn("transition-all duration-300 min-h-screen", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        <AdminHeader />
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">

          {/* Header + platform */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="h-7 w-7 text-primary" />Auction Groups</h1>
              <p className="text-muted-foreground mt-1 text-sm">Review, approve, and enrich seller auction groups.</p>
            </div>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
              <span className="block text-xs font-semibold text-primary uppercase tracking-wide mb-2">Platform</span>
              <Tabs value={platformType} onValueChange={(v) => { setPlatformType(v); setExpanded(null); }}>
                <TabsList className="h-10 bg-muted/80 border border-border">
                  {PLATFORMS.map((p) => (
                    <TabsTrigger key={p.value} value={p.value}
                      className="px-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Groups"    value={stats.total}    icon={Layers}       color="bg-blue-500" />
            <StatCard title="Pending"          value={stats.pending}  icon={Clock}        color="bg-amber-500" trend={stats.pending > 0 ? "needs review" : undefined} />
            <StatCard title="Approved"         value={stats.approved} icon={CheckCircle2} color="bg-emerald-500" trend={`${stats.total ? Math.round((stats.approved/stats.total)*100) : 0}%`} />
            <StatCard title="Featured"         value={stats.featured} icon={Star}         color="bg-violet-500" />
          </div>

          {/* Filters */}
          <Card className="shadow-sm border-0 bg-gradient-to-r from-background to-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by title, group ID, seller ID, country…" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 border-2 focus:border-primary/50" />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Approval</span>
                  <Tabs value={approvalFilter} onValueChange={(v) => setApprovalFilter(v as any)}>
                    <TabsList className="h-9">
                      <TabsTrigger value="all" className="px-3 text-xs">All</TabsTrigger>
                      <TabsTrigger value="pending" className="px-3 text-xs">Pending</TabsTrigger>
                      <TabsTrigger value="approved" className="px-3 text-xs">Approved</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Sort</span>
                  <Tabs value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                    <TabsList className="h-9">
                      <TabsTrigger value="newest" className="px-3 text-xs">Newest</TabsTrigger>
                      <TabsTrigger value="oldest" className="px-3 text-xs">Oldest</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group list */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-bold">All Auction Groups</CardTitle>
                  <Badge variant="secondary">{filtered.length}</Badge>
                </div>
                {isFetching && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Updating…</div>}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Gavel className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No auction groups found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery || approvalFilter !== "all" ? "Try adjusting your search or filters." : "No groups on this platform yet."}
                  </p>
                </div>
              ) : filtered.map((group) => {
                const isExpanded = expanded === group.group_id;
                const isPending = group.approval_status === "pending";
                return (
                  <Card key={group.group_id}
                    className="border-2 hover:border-primary/40 transition-all duration-200 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-5">
                        {/* Top row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-xl font-bold">Group #{group.group_id}</h3>
                              {isPending
                                ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                                : <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
                              }
                              <Badge variant="secondary" className="capitalize">{group.status}</Badge>
                              {group.featured_type !== "none" && (
                                <Badge className="bg-violet-100 text-violet-700 border-violet-200" variant="outline">
                                  <Star className="h-3 w-3 mr-1" />{group.featured_type}
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold text-foreground line-clamp-1">{group.title}</p>
                            {group.description && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{group.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            {isPending && (
                              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleApprove(group.group_id)} disabled={approvingId === group.group_id}>
                                {approvingId === group.group_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Approve
                              </Button>
                            )}
                            {platformType === "LabGreenbidz" && (
                              <Button size="sm"
                                variant={group.featured_type !== "none" ? "default" : "outline"}
                                className={group.featured_type !== "none" ? "gap-1.5 bg-violet-600 hover:bg-violet-700 text-white border-0" : "gap-1.5 border-violet-300 text-violet-600 hover:bg-violet-50"}
                                onClick={() => handleToggleFeatured(group)} disabled={featuringId === group.group_id}>
                                {featuringId === group.group_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className={`h-4 w-4 ${group.featured_type !== "none" ? "fill-white" : ""}`} />}
                                {group.featured_type !== "none" ? "Remove Featured" : "Mark Featured"}
                              </Button>
                            )}
                            <Button variant="outline" size="icon"
                              onClick={() => setExpanded(isExpanded ? null : group.group_id)}
                              className="hover:bg-primary/10 hover:border-primary/40">
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                          {[
                            { icon: Users,    label: "Seller ID", value: group.seller_id },
                            { icon: Globe,    label: "Country",   value: group.country },
                            { icon: Package,  label: "Auctions",  value: group.auction_count ?? 0 },
                            { icon: Calendar, label: "Created",   value: new Date(group.createdAt).toLocaleDateString() },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                              <div className="p-1.5 rounded-lg bg-background"><Icon className="h-4 w-4 text-primary" /></div>
                              <div><p className="text-[11px] text-muted-foreground font-medium">{label}</p><p className="text-sm font-semibold">{value}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags panel — always visible below meta grid */}
                      <GroupTagsPanel group={group} />

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-5 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">Multi-language Titles</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { label: "🇬🇧 EN", val: group.title_en || group.title },
                              { label: "🇹🇼 ZH", val: group.title_zh },
                              { label: "🇯🇵 JA", val: group.title_ja },
                              { label: "🇹🇭 TH", val: group.title_th },
                            ].filter(x => x.val).map(({ label, val }) => (
                              <div key={label} className="p-3 rounded-xl border bg-background/80">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
                                <p className="text-sm font-semibold line-clamp-2">{val}</p>
                              </div>
                            ))}
                          </div>
                          {group.languages?.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Languages:</span>
                              {group.languages.map((l: string) => (
                                <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAuctionGroups;
