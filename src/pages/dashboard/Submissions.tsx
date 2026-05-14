// @ts-nocheck
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  Search,
  Plus,
  Package,
  Calendar,
  FileText,
  TrendingUp,
  MessageCircle,
  Percent,
  Star,
  Trash2,
  X,
  LayoutGrid,
  List,
  Hash,
  Tag,
  ChevronDown,
  ChevronUp,
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";
import { useToggleHighlightMutation } from "@/rtk/slices/batchApiSlice";
import { useGetMachinesCategoriesQuery } from "@/rtk/slices/apiSlice";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";
import Pagination from "@/components/common/Pagination";
import toast from "react-hot-toast";
import axios from "axios";
import { subscribeBuyerEvents } from "@/socket/buyerEvents";
import { SITE_TYPE } from "@/config/site";
import AdminEditListingDialog from "@/pages/Admin/AdminEditListingDialog";
import ProductThumbnail from "@/components/common/ProductThumbnail";

// ─── Status style map ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { dot: string; badge: string }> = {
  publish:             { dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" },
  inspection_schedule: { dot: "bg-purple-500",  badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800" },
  inspection_complete: { dot: "bg-cyan-500",    badge: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800" },
  live_for_bids:       { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  deactive_for_bids:   { dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  sold:                { dot: "bg-green-600",   badge: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" },
  deactive:            { dot: "bg-red-400",     badge: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
  under_review:        { dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
};

const STATUS_I18N: Record<string, string> = {
  publish:             "statusPublish",
  inspection_schedule: "statusInspectionSchedule",
  inspection_complete: "statusInspectionComplete",
  live_for_bids:       "statusLiveForBids",
  deactive_for_bids:   "statusDeactiveForBids",
  sold:                "statusSold",
  deactive:            "statusDeactive",
  under_review:        "statusUnderReview",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status];
  const label = STATUS_I18N[status]
    ? t(`submissions.${STATUS_I18N[status]}`)
    : status?.replace(/_/g, " ");
  if (!style) return <span className="text-xs text-muted-foreground capitalize">{label}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

function getLocalizedTitle(batch, language) {
  if (!batch) return "—";
  if (language === 'zh') return batch.title_zh || batch.title_en || batch.title || "—";
  if (language === 'ja') return batch.title_ja || batch.title_en || batch.title || "—";
  if (language === 'th') return batch.title_th || batch.title_en || batch.title || "—";
  return batch.title_en || batch.title || "—";
}

function getLocalizedCategory(batch, language) {
  if (!batch) return "—";
  if (language === 'zh') return batch.category_zh || batch.category_en || batch.category || "—";
  if (language === 'ja') return batch.category_ja || batch.category_en || batch.category || "—";
  if (language === 'th') return batch.category_th || batch.category_en || batch.category || "—";
  return batch.category_en || batch.category || "—";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-full -mr-12 -mt-12`} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${color.replace("bg-", "text-")}`}>{value}</div>
    </div>
  );
}

// ─── Expanded images strip ────────────────────────────────────────────────────
function ExpandedImages({ images }: { images: string[] }) {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 rounded-lg bg-muted/40 border border-dashed border-border/60">
        <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <div className="flex gap-3 flex-wrap">
      {images.map((src, i) => (
        <ProductThumbnail
          key={i}
          src={src}
          className="w-24 h-24 rounded-lg border border-border/50 flex-shrink-0"
          iconClassName="w-6 h-6"
        />
      ))}
    </div>
  );
}

// ─── Row (list view) ──────────────────────────────────────────────────────────
function BatchRow({ batch, onView, onChat, onHighlight, onDeactivate, onEdit, onToggleExpand, isExpanded, language = 'en' }) {
  const { t } = useTranslation();
  const localizedTitle = getLocalizedTitle(batch, language);
  const localizedCategory = getLocalizedCategory(batch, language);

  return (
    <>
      <div
        className="group flex items-center gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => onView(batch)}
      >
        {/* Thumbnail */}
        <ProductThumbnail
          src={batch?.firstProductImages?.[0]}
          className="flex-shrink-0 w-12 h-12 rounded-lg border border-border/50"
        />

        {/* ID + Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">#{batch.batchId}</span>
            <StatusBadge status={batch.status} />
            {batch.approval_status === "pending" ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                {t("submissions.pendingApproval")}
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                {t("submissions.approved")}
              </span>
            )}
            {batch.commission_percent != null && Number(batch.commission_percent) > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-xs font-medium text-amber-900 dark:text-amber-100">
                <Percent className="w-3 h-3" />
                {Number(batch.commission_percent)}%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground truncate">{localizedTitle}</p>
        </div>

        {/* Category */}
        <div className="hidden md:block w-36 text-sm text-muted-foreground truncate">
          {localizedCategory}
        </div>

        {/* Date */}
        <div className="hidden lg:block w-28 text-sm text-muted-foreground">
          {batch.postDate
            ? new Date(batch.postDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : t("submissions.tbd")}
        </div>

        {/* Items / Bids */}
        <div className="hidden sm:flex items-center gap-4 w-28">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t("submissions.items")}</div>
            <div className="text-sm font-semibold">{batch.itemsCount ?? 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t("submissions.bids")}</div>
            <div className="text-sm font-semibold text-accent">{batch.bids ?? 0}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5 w-[224px] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onChat(batch)}
            title={t("submissions.chat")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onView(batch)}
            title={t("submissions.view")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(batch.batchId)}
            title={t("submissions.edit", "Edit")}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onHighlight(batch.batchId, batch.is_highlighted)}
            title={batch.is_highlighted ? t("submissions.removeHighlight") : t("submissions.highlight")}
            className={`p-2 rounded-md transition-colors ${batch.is_highlighted ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"}`}
          >
            <Star className="w-4 h-4" fill={batch.is_highlighted ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onDeactivate(batch.batchId)}
            title={t("submissions.deactivate")}
            className="p-2 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleExpand(batch.batchId)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="px-4 py-4 border-b border-border/50 bg-muted/20 animate-in slide-in-from-top-1 duration-200">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {t("submissions.images", "Images")}
          </p>
          <ExpandedImages images={batch.firstProductImages || []} />
          {(batch.bids > 0 || batch.itemsCount > 0) && (
            <div className="flex gap-6 mt-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{batch.itemsCount ?? 0}</span> {t("submissions.items")}
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-accent">{batch.bids ?? 0}</span> {t("submissions.bids")}
              </span>
              {batch.commission_percent != null && Number(batch.commission_percent) > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-amber-600">{Number(batch.commission_percent)}%</span> commission
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Card (grid view) ─────────────────────────────────────────────────────────
function BatchCard({ batch, onView, onChat, onHighlight, onDeactivate, onEdit, onToggleExpand, isExpanded, language = 'en' }) {
  const { t } = useTranslation();
  const localizedTitle = getLocalizedTitle(batch, language);
  const localizedCategory = getLocalizedCategory(batch, language);

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all duration-200 overflow-hidden">
      {/* Top image strip */}
      <div
        className="h-36 overflow-hidden relative cursor-pointer"
        onClick={() => onView(batch)}
      >
        <ProductThumbnail
          src={batch?.firstProductImages?.[0]}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          iconClassName="w-10 h-10 text-muted-foreground/40"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onHighlight(batch.batchId, batch.is_highlighted); }}
          title={batch.is_highlighted ? t("submissions.removeHighlight") : t("submissions.highlight")}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors ${batch.is_highlighted ? "bg-amber-400/90 text-white" : "bg-black/30 text-white hover:bg-amber-400/90"}`}
        >
          <Star className="w-3.5 h-3.5" fill={batch.is_highlighted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* ID + Status */}
        <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => onView(batch)}>
          <span className="text-xs font-mono text-muted-foreground">#{batch.batchId}</span>
          <StatusBadge status={batch.status} />
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-foreground line-clamp-1 cursor-pointer" onClick={() => onView(batch)}>{localizedTitle}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {localizedCategory}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {batch.postDate
              ? new Date(batch.postDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : t("submissions.tbd")}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{batch.itemsCount ?? 0} {t("submissions.items")}</span>
            <span className="flex items-center gap-1 text-accent font-medium">
              <TrendingUp className="w-3 h-3" />
              {batch.bids ?? 0} {t("submissions.bids")}
            </span>
          </div>
          {batch.commission_percent != null && Number(batch.commission_percent) > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-xs font-medium text-amber-900 dark:text-amber-100">
              <Percent className="w-3 h-3" />
              {Number(batch.commission_percent)}%
            </span>
          )}
        </div>

        {/* Approval */}
        <div className="flex items-center gap-1.5">
          {batch.approval_status === "pending" ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
              {t("submissions.pendingApproval")}
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              {t("submissions.approved")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onChat(batch)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t("submissions.chat")}
          </button>
          <button
            onClick={() => onView(batch)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            {t("submissions.view")}
          </button>
          <button
            onClick={() => onEdit(batch.batchId)}
            title={t("submissions.edit", "Edit")}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeactivate(batch.batchId)}
            title={t("submissions.deactivate")}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleExpand(batch.batchId)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded images */}
        {isExpanded && (
          <div className="pt-2 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("submissions.images", "Images")}</p>
            <ExpandedImages images={batch.firstProductImages || []} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const Submissions = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editBatchId, setEditBatchId] = useState<number | null>(null);

  const currentLanguage = i18n.language || 'en';

  const companySellerId = localStorage.getItem("companySellerId") || localStorage.getItem("userId");
  const [searchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type") || "all";
  const typeForApi = typeFromUrl === "all" ? SITE_TYPE : typeFromUrl;

  const [toggleHighlight] = useToggleHighlightMutation();

  const { data: response, isLoading, refetch, error } = useGetBatchesBySellerQuery(
    { sellerId: companySellerId, page, type: typeForApi }
  );

  const { data: enCategoriesData } = useGetMachinesCategoriesQuery('en');
  const langForApi = currentLanguage === 'zh' ? 'zh-hant' : currentLanguage;
  const { data: localizedCategoriesData } = useGetMachinesCategoriesQuery(langForApi);

  const categoryMap = new Map();
  const engToLocalizedMap = new Map();

  const enSubcatsMap = new Map();
  if (enCategoriesData?.data) {
    enCategoriesData.data.forEach((parent) => {
      parent.subcategories?.forEach((sub) => {
        const engName = sub.name || "";
        if (engName) enSubcatsMap.set(engName, sub.id);
      });
    });
  }

  if (localizedCategoriesData?.data) {
    localizedCategoriesData.data.forEach((parent) => {
      parent.subcategories?.forEach((sub) => {
        const localizedName = sub.name || "";
        const subId = sub.id;
        if (localizedName) {
          categoryMap.set(localizedName, true);
          const engName = Array.from(enSubcatsMap.entries()).find(([_, id]) => id === subId)?.[0];
          if (engName) {
            engToLocalizedMap.set(engName, localizedName);
          }
        }
      });
    });
  }

  const categories = Array.from(categoryMap.keys()).sort();

  const currentPage = response?.data?.page || 1;
  const totalPages = response?.data?.totalPages || 1;
  const batches = Array.isArray(response?.data?.data) ? response.data.data : [];

  // Stat counts computed from all fetched batches
  const stats = {
    total: batches.length,
    live: batches.filter((b) => b.status === "live_for_bids").length,
    sold: batches.filter((b) => b.status === "sold").length,
    pending: batches.filter((b) => b.approval_status === "pending").length,
  };

  const STATUS_OPTIONS = [
    { value: "all",                label: t("submissions.allStatus") },
    { value: "publish",            label: t("submissions.statusPublish") },
    { value: "inspection_schedule",label: t("submissions.statusInspectionSchedule") },
    { value: "inspection_complete",label: t("submissions.statusInspectionComplete") },
    { value: "live_for_bids",      label: t("submissions.statusLiveForBids") },
    { value: "deactive_for_bids",  label: t("submissions.statusDeactiveForBids") },
    { value: "sold",               label: t("submissions.statusSold") },
    { value: "deactive",           label: t("submissions.statusDeactive") },
    { value: "under_review",       label: t("submissions.statusUnderReview") },
  ];

  useEffect(() => {
    const unsub = subscribeBuyerEvents(() => refetch());
    return unsub;
  }, [refetch]);

  useEffect(() => { setPage(1); }, [searchTerm, statusFilter, categoryFilter]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleView = (batch) => navigate(`/upload?step=${batch.step}&batchId=${batch.batchId}`);
  const handleChat = (batch) => navigate(`/dashboard/submission/message?batchId=${batch.batchId}`);
  const handleEdit = (batchId: number) => setEditBatchId(batchId);
  const handleToggleExpand = (batchId: number) => setExpandedId(expandedId === batchId ? null : batchId);

  const handleHighlight = async (batchId) => {
    try {
      await toggleHighlight(batchId).unwrap();
      refetch();
    } catch {
      toast.error(t("submissions.failedToLoad"));
    }
  };

  const handleDeactivate = async (batchId) => {
    if (!window.confirm(t("common.confirmDeactivate", "Are you sure you want to deactivate this batch?"))) return;
    try {
      await axios.patch(
        `${import.meta.env.VITE_PRODUCTION_URL}batch/deactivate/${batchId}`,
        {},
        { headers: { "x-platform": "LabGreenbidz", "x-system-key": import.meta.env.VITE_X_SYSTEM_KEY || "" } }
      );
      toast.success(t("common.deactivateSuccess", "Batch deactivated!"));
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || t("common.error"));
    }
  };

  // ─── Client-side filtering ───────────────────────────────────────────────────
  const filteredBatches = batches.filter((batch) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || batch.batchId?.toString().toLowerCase().includes(term);

    let matchesCategory = categoryFilter === "all";
    if (!matchesCategory && categoryFilter) {
      let englishCategoryName = null;
      for (const [engName, localizedName] of engToLocalizedMap.entries()) {
        if (localizedName === categoryFilter) {
          englishCategoryName = engName;
          break;
        }
      }
      matchesCategory = englishCategoryName && batch.category === englishCategoryName;
    }

    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const hasActiveFilters = searchTerm || categoryFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-7 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-56 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-14 bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm font-medium text-foreground">{t("submissions.failedToLoad")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>{t("submissions.retryLoad")}</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-in fade-in-50 duration-300">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{t("submissions.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {batches.length} {batches.length === 1 ? t("submissions.listing") : t("submissions.listings")} {t("submissions.total")}
            </p>
          </div>
          <Button
            onClick={() => navigate("/upload?type=surplus")}
            size="sm"
            className="h-9 px-4 bg-accent hover:bg-accent/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("submissions.newSubmission")}
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title={t("submissions.statTotal", "Total Listings")}
            value={batches.length}
            icon={Package}
            color="bg-blue-500"
          />
          <StatCard
            title={t("submissions.statLive", "Live for Bids")}
            value={stats.live}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <StatCard
            title={t("submissions.statSold", "Sold")}
            value={stats.sold}
            icon={CheckCircle2}
            color="bg-green-600"
          />
          <StatCard
            title={t("submissions.statPending", "Pending Approval")}
            value={stats.pending}
            icon={Clock}
            color="bg-amber-500"
          />
        </div>

        {/* ── Filters bar ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Batch ID search */}
          <div className="flex flex-1 min-w-0 rounded-lg border border-border/50 bg-background overflow-hidden focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <div className="flex items-center px-3 border-r border-border/50 bg-muted/40">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("submissions.searchById")}
                className="w-full h-9 bg-transparent pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-52 h-9 border-border/50 focus:border-accent/60 focus:ring-1 focus:ring-accent/20 text-sm">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
              <SelectValue placeholder={t("submissions.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("submissions.allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 border-border/50 focus:border-accent/60 focus:ring-1 focus:ring-accent/20 text-sm">
              <SelectValue placeholder={t("submissions.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {opt.value !== "all" && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_STYLE[opt.value]?.dot}`} />
                    )}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/50 bg-background p-0.5 h-9 flex-shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Active filter pills ── */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-muted-foreground">
              {filteredBatches.length} {filteredBatches.length !== 1 ? t("submissions.results") : t("submissions.result")}
            </span>
            {searchTerm && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {t("submissions.batchId")}: {searchTerm}
                <button onClick={() => setSearchTerm("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {categoryFilter !== "all" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                <Tag className="w-3 h-3" />
                {categoryFilter}
                <button onClick={() => setCategoryFilter("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter}
                <button onClick={() => setStatusFilter("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
              {t("submissions.clearAll")}
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t("submissions.noSubmissionsFound")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasActiveFilters ? t("submissions.adjustFilters") : t("submissions.getStarted")}
              </p>
            </div>
            {!hasActiveFilters && (
              <Button onClick={() => navigate("/upload?step=1")} variant="outline" size="sm" className="gap-2 mt-1">
                <Plus className="w-4 h-4" />
                {t("submissions.newSubmission")}
              </Button>
            )}
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="gap-2 mt-1">
                <X className="w-4 h-4" />
                {t("submissions.clearFilters")}
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          /* ── List view ── */
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border/50 bg-muted/30">
              <div className="w-12 flex-shrink-0" />
              <div className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("submissions.allSubmissions")}</div>
              <div className="hidden md:block w-36 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("submissions.category")}</div>
              <div className="hidden lg:block w-28 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("submissions.posted")}</div>
              <div className="hidden sm:block w-28 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("submissions.stats")}</div>
              <div className="w-[224px] flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right pr-2">{t("submissions.actions")}</div>
            </div>
            {filteredBatches.map((batch) => (
              <BatchRow
                key={batch.batchId}
                batch={batch}
                onView={handleView}
                onChat={handleChat}
                onEdit={handleEdit}
                onHighlight={handleHighlight}
                onDeactivate={handleDeactivate}
                onToggleExpand={handleToggleExpand}
                isExpanded={expandedId === batch.batchId}
                language={currentLanguage}
              />
            ))}
          </div>
        ) : (
          /* ── Grid view ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBatches.map((batch) => (
              <BatchCard
                key={batch.batchId}
                batch={batch}
                onView={handleView}
                onChat={handleChat}
                onEdit={handleEdit}
                onHighlight={handleHighlight}
                onDeactivate={handleDeactivate}
                onToggleExpand={handleToggleExpand}
                isExpanded={expandedId === batch.batchId}
                language={currentLanguage}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        )}

      </div>

      {/* ── Edit Dialog ── */}
      <AdminEditListingDialog
        batchId={editBatchId}
        open={editBatchId !== null}
        onClose={() => { setEditBatchId(null); refetch(); }}
      />
    </DashboardLayout>
  );
};

export default Submissions;
