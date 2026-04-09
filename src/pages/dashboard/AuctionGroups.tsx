// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,  
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Gavel,
  Globe,
  Languages,
  Pencil,
  X,
  Package,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  Eye,
  MoreVertical
} from "lucide-react";
import { toastSuccess, toastError } from "@/helper/toasterNotification";
import { SITE_TYPE } from "@/config/site";
import {
  useGetAuctionGroupsQuery,
  useCreateAuctionGroupMutation,
  useUpdateAuctionGroupMutation,
  useDeleteAuctionGroupMutation,
  useGetAuctionsInGroupQuery,
  useAddAuctionToGroupMutation,
  useReplaceGroupBatchesMutation,
} from "@/rtk/slices/auctionGroupApiSlice";
import { useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";

// ─── Helper Functions ────────────────────────────────────────────────────────

// Generate URL-friendly slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  "China",
  "Indonesia", 
  "India",
  "Malaysia",
  "Taiwan", 
  "Thailand", 
  "Japan",
  "Vietnam",
];

// Updated language options to match the image
const LANGUAGE_OPTIONS = [
  "GB English",
  "TW 繁简体中文",
  "JP 日本語",
  "TH ไทย",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchOption = { batchId: number; title: string | null; category: string };

// ─── Enhanced Language Selector ────────────────────────────────────────────────

const LanguageSelector = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(lang => 
      lang.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const toggle = (lang: string) =>
    onChange(
      selected.includes(lang)
        ? selected.filter((l) => l !== lang)
        : [...selected, lang]
    );

  const selectAll = () => {
    onChange(LANGUAGE_OPTIONS);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded-lg bg-muted/30">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm self-center">
            No languages selected
          </span>
        ) : (
          selected.map((lang) => (
            <Badge key={lang} variant="secondary" className="gap-1 pr-1 h-6">
              {lang}
              <button type="button" onClick={() => toggle(lang)}>
                <X className="h-3 w-3 hover:text-destructive" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Language picker toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Languages className="h-3 w-3" />
          {isExpanded ? "Hide language options" : "Show language options"}
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Language grid picker */}
      {isExpanded && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-8">
              Clear
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2 grid grid-cols-2 gap-1">
            {filteredLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggle(lang)}
                className={`text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  selected.includes(lang)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {selected.includes(lang) && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Enhanced Batch Selector with Search ───────────────────────────────────────

const BatchSelector = ({
  batches,
  selected,
  onChange,
  loading,
}: {
  batches: BatchOption[];
  selected: number[];
  onChange: (ids: number[]) => void;
  loading?: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredBatches = useMemo(() => {
    if (!searchTerm.trim()) return batches;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return batches.filter(batch => {
      const idMatch = batch.batchId.toString().includes(searchLower);
      const titleMatch = batch.title?.toLowerCase().includes(searchLower);
      const categoryMatch = batch.category?.toLowerCase().includes(searchLower);
      return idMatch || titleMatch || categoryMatch;
    });
  }, [batches, searchTerm]);

  const toggle = (id: number) =>
    onChange(
      selected.includes(id)
        ? selected.filter((b) => b !== id)
        : [...selected, id]
    );

  const selectAll = () => {
    const allIds = filteredBatches.map(b => b.batchId);
    onChange(allIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  const getSelectedCount = () => selected.length;
  const getTotalCount = () => batches.length;

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded-lg bg-muted/30">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm self-center">
            Select batches from the list below…
          </span>
        ) : (
          selected.map((id) => {
            const b = batches.find((x) => x.batchId === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1 h-6">
                <span className="font-mono text-xs">#{id}</span>
                {(b?.title || b?.category) && (
                  <span className="max-w-[120px] truncate">
                    {b.title || b.category}
                  </span>
                )}
                <button type="button" onClick={() => toggle(id)}>
                  <X className="h-3 w-3 hover:text-destructive" />
                </button>
              </Badge>
            );
          })
        )}
      </div>

      {/* Search and controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by ID, title, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {filteredBatches.length > 0 && !loading && (
          <div className="flex gap-2 justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing {filteredBatches.length} of {getTotalCount()} batches
              {searchTerm && ` (filtered)`}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7 px-2">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 px-2">
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Batch list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
          {loading ? (
            <p className="text-sm text-muted-foreground p-3 text-center">
              Loading batches…
            </p>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No matching batches found" : "No machine batches found for your account"}
              </p>
              {searchTerm && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-xs mt-1"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredBatches.map((b) => {
              const isSelected = selected.includes(b.batchId);
              return (
                <button
                  key={b.batchId}
                  type="button"
                  onClick={() => toggle(b.batchId)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all duration-150 ${
                    isSelected 
                      ? "bg-primary/10 border-l-2 border-primary" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {b.title || b.category || "Untitled Batch"}
                      </p>
                      <Badge variant="outline" className="text-xs font-mono">
                        #{b.batchId}
                      </Badge>
                    </div>
                    {b.category && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Category: {b.category}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
      
      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {selected.length} batch(es) selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="text-xs h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Enhanced Group Card with Better UX ───────────────────────────────────────

const GroupCard = ({
  group,
  sellerBatches,
  onEdit,
  onDelete,
}: {
  group: any;
  sellerBatches: BatchOption[];
  onEdit: (group: any, currentBatchIds: number[]) => void;
  onDelete: (id: number) => void;
}) => {
  const { data: auctionData, isLoading: loadingAuctions } =
    useGetAuctionsInGroupQuery(group.group_id);

  // Flatten all batch_ids from all auction items
  const allBatchIds: number[] = (auctionData?.data ?? []).flatMap(
    (a: any) => a.batch_ids ?? []
  );

  const handleEditClick = () => onEdit(group, allBatchIds);

  // Get status based on batches
  const getGroupStatus = () => {
    if (loadingAuctions) return { status: 'loading', color: 'bg-gray-100 text-gray-600' };
    if (allBatchIds.length === 0) return { status: 'empty', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'active', color: 'bg-green-100 text-green-700' };
  };

  const statusInfo = getGroupStatus();

  return (
    <Card className="border shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      {/* Status indicator */}
      <div className={`absolute top-0 right-0 w-2 h-full ${statusInfo.status === 'active' ? 'bg-green-500' : statusInfo.status === 'empty' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {group.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="h-3 w-3" />
                {group.country}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Languages className="h-3 w-3" />
                {(group.languages ?? []).length} lang(s)
              </Badge>
              <Badge className={`text-xs ${statusInfo.color}`}>
                {statusInfo.status === 'loading' ? 'Loading...' : 
                 statusInfo.status === 'empty' ? 'No Batches' : 
                 `${allBatchIds.length} Batches`}
              </Badge>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10"
              onClick={handleEditClick}
              title="Edit Group"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(group.group_id)}
              title="Delete Group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Languages detail */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Languages className="h-4 w-4" />
            <span>Languages:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(group.languages ?? []).map((lang: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* Batches section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Batches ({allBatchIds.length})</span>
            </div>
            {allBatchIds.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View All
              </Button>
            )}
          </div>
          
          {loadingAuctions ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : allBatchIds.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                No batches added yet
              </p>
              <Button size="sm" variant="outline" onClick={handleEditClick}>
                <Plus className="h-3 w-3 mr-1" />
                Add Batches
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {allBatchIds.slice(0, 6).map((bId: number) => {
                  const b = sellerBatches.find((x) => x.batchId === bId);
                  return (
                    <Badge key={bId} variant="outline" className="text-xs gap-1">
                      <span className="font-mono">#{bId}</span>
                      {(b?.title || b?.category) && (
                        <span className="max-w-[80px] truncate">
                          {b.title || b.category}
                        </span>
                      )}
                    </Badge>
                  );
                })}
                {allBatchIds.length > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{allBatchIds.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with creation date */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {new Date(group.created_at).toLocaleDateString()}
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Auction Group Form Dialog ────────────────────────────────────────────────

const AuctionGroupDialog = ({
  open,
  onClose,
  title,
  form,
  setForm,
  sellerBatches,
  batchesLoading,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  form: { 
    title: string; 
    country: string; 
    languages: string[]; 
    batchIds: number[];
    description: string;
  };
  setForm: (v: any) => void;
  sellerBatches: BatchOption[];
  batchesLoading: boolean;
  onSave: () => void;
  saving: boolean;
}) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="w-[95vw] max-w-5xl h-[95vh] max-h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-0">
      <DialogHeader className="px-4 sm:px-6 py-4 border-b flex-shrink-0">
        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Gavel className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">{title}</span>
        </DialogTitle>
        <div className="mt-2 text-sm text-muted-foreground space-y-1">
          <p>Create organized auction groups by country and language to better manage your machine batches.</p>
          <p>Select batches to include in this group for targeted auctions.</p>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="space-y-4 sm:space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ag-title" className="text-sm font-medium">
              Group Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ag-title"
              placeholder="e.g. Heavy Machinery – Europe Q3"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full text-sm sm:text-base"
            />
          </div>

          {/* Country & Languages - Side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.country}
                onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}
              >
                <SelectTrigger className="w-full text-sm sm:text-base">
                  <SelectValue placeholder="Select a country…" />
                </SelectTrigger>
                <SelectContent className="max-h-48 sm:max-h-60">
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Languages */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Languages <span className="text-destructive">*</span>
              </Label>
              <LanguageSelector
                selected={form.languages}
                onChange={(langs) => setForm((f) => ({ ...f, languages: langs }))}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ag-description" className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              id="ag-description"
              placeholder="Enter a description for this auction group..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              rows={4}
            />
          </div>

          {/* Batches */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Add Batches{" "}
              <span className="text-muted-foreground font-normal text-xs sm:text-sm">(machines)</span>
            </Label>
            <div className="min-h-[120px] sm:min-h-[150px]">
              <BatchSelector
                batches={sellerBatches}
                selected={form.batchIds}
                onChange={(ids) => setForm((f) => ({ ...f, batchIds: ids }))}
                loading={batchesLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="px-4 sm:px-6 py-4 border-t flex-shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
        <Button 
          variant="outline" 
          onClick={onClose} 
          disabled={saving}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          disabled={saving} 
          className="w-full sm:w-auto min-w-[100px] order-1 sm:order-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="hidden sm:inline">Saving...</span>
              <span className="sm:hidden">Save</span>
            </>
          ) : (
            title
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

// Updated EMPTY_FORM to include English by default and description field
const EMPTY_FORM = { 
  title: "", 
  country: "", 
  languages: ["GB English"] as string[], 
  batchIds: [] as number[],
  description: ""
};

const AuctionGroups = () => {
  const sellerId = Number(
    localStorage.getItem("companySellerId") || localStorage.getItem("userId") || 0
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } =
    useGetAuctionGroupsQuery({ seller_id: sellerId, site_id: SITE_TYPE });

  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesBySellerQuery(
    { sellerId: String(sellerId), page: 1, type: SITE_TYPE, limit: 1000 },
    { skip: !sellerId }
  );
  const sellerBatches: BatchOption[] = (batchesData?.data?.data ?? []).map((b: any) => ({
    batchId: b.batchId,
    title: b.title ?? null,
    category: b.category ?? "",
  }));

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [createGroup] = useCreateAuctionGroupMutation();
  const [updateGroup] = useUpdateAuctionGroupMutation();
  const [deleteGroup] = useDeleteAuctionGroupMutation();
  const [addAuction] = useAddAuctionToGroupMutation();
  const [replaceBatches] = useReplaceGroupBatchesMutation();

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<null | "create" | "edit">(null);
  const [editGroup, setEditGroup] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setDialog("create");
  };

  const openEdit = (group: any, currentBatchIds: number[]) => {
    setEditGroup(group);
    setForm({
      title: group.title,
      country: group.country,
      languages: group.languages ?? ["GB English"],
      batchIds: currentBatchIds,
      description: group.description || ""
    });
    setDialog("edit");
  };

  const closeDialog = () => {
    setDialog(null);
    setEditGroup(null);
    setForm({ ...EMPTY_FORM });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.title.trim()) { toastError("Title is required."); return false; }
    if (!form.country) { toastError("Country is required."); return false; }
    if (!form.languages.length) { toastError("At least one language is required."); return false; }
    return true;
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await createGroup({
        title: form.title.trim(),
        slug: generateSlug(form.title),
        country: form.country,
        languages: form.languages,
        description: form.description.trim(),
        seller_id: sellerId,
        site_id: SITE_TYPE,
      }).unwrap();

      // Add selected batches as a single auction item
      if (form.batchIds.length > 0) {
        await addAuction({ group_id: res.data.group_id, batch_ids: form.batchIds }).unwrap();
      }

      toastSuccess("Auction group created successfully!");
      closeDialog();
      refetchGroups();
    } catch (error) {
      console.error('Create group error:', error);
      toastError("Failed to create group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateGroup({
        group_id: editGroup.group_id,
        title: form.title.trim(),
        slug: generateSlug(form.title),
        country: form.country,
        languages: form.languages,
        description: form.description.trim(),
      }).unwrap();

      // Replace all batches in one call
      await replaceBatches({
        group_id: editGroup.group_id,
        batch_ids: form.batchIds,
      }).unwrap();

      toastSuccess("Group updated successfully!");
      closeDialog();
      refetchGroups();
    } catch (error) {
      console.error('Update group error:', error);
      toastError("Failed to update group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (group_id: number) => {
    if (!window.confirm("Delete this auction group?")) return;
    try {
      await deleteGroup(group_id).unwrap();
      toastSuccess("Group deleted successfully!");
      refetchGroups();
    } catch (error) {
      console.error('Delete group error:', error);
      toastError("Failed to delete group. Please try again.");
    }
  };

  const groups = groupsData?.data ?? [];

  console.log("groups is ",groups);
  

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6" />
              Auction Groups
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create groups with title, country &amp; languages, then assign machine batches.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Group
          </Button>
        </div>

        {/* ── Stats Cards ── */}
        {!groupsLoading && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{groups.length}</p>
                    <p className="text-xs text-muted-foreground">Total Groups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {groups.reduce((acc: number, group: any) => {
                        // This is a simplified count - in real app you'd get this from API
                        return acc + (group.auction_count || 0);
                      }, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(groups.map((g: any) => g.country)).size}
                    </p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {groups.filter((g: any) => {
                        const createdDate = new Date(g.created_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return createdDate > weekAgo;
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Groups Grid ── */}
        {groupsLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed rounded-xl gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Gavel className="h-12 w-12 opacity-50" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">No auction groups yet</h3>
              <p className="text-sm max-w-md">
                Create your first auction group to organize your machine batches by country and language.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openCreate} size="lg">
                <Plus className="h-4 w-4 mr-2" /> Create First Group
              </Button>
              <Button variant="outline" size="lg">
                <Eye className="h-4 w-4 mr-2" /> View Guide
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <GroupCard
                key={group.group_id}
                group={group}
                sellerBatches={sellerBatches}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Dialog ── */}
      <AuctionGroupDialog
        open={dialog === "create"}
        onClose={closeDialog}
        title="Create Auction Group"
        form={form}
        setForm={setForm}
        sellerBatches={sellerBatches}
        batchesLoading={batchesLoading}
        onSave={handleCreate}
        saving={saving}
      />

      {/* ── Edit Dialog ── */}
      <AuctionGroupDialog
        open={dialog === "edit"}
        onClose={closeDialog}
        title="Edit Auction Group"
        form={form}
        setForm={setForm}
        sellerBatches={sellerBatches}
        batchesLoading={batchesLoading}
        onSave={handleEdit}
        saving={saving}
      />
    </DashboardLayout>
  );
};

export default AuctionGroups;