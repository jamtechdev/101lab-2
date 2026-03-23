// @ts-nocheck
import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import toast from "react-hot-toast";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria",
  "Bangladesh","Belgium","Brazil","Canada","Chile","China","Colombia",
  "Croatia","Czech Republic","Denmark","Egypt","Ethiopia","Finland",
  "France","Germany","Ghana","Greece","Hungary","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kenya",
  "Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria",
  "Norway","Pakistan","Philippines","Poland","Portugal","Romania",
  "Russia","Saudi Arabia","Serbia","Singapore","South Africa",
  "South Korea","Spain","Sri Lanka","Sweden","Switzerland","Thailand",
  "Turkey","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Vietnam",
];

const LANGUAGE_OPTIONS = [
  "Arabic","Bengali","Chinese (Simplified)","Chinese (Traditional)",
  "Czech","Danish","Dutch","English","Finnish","French","German",
  "Greek","Hebrew","Hindi","Hungarian","Indonesian","Italian",
  "Japanese","Korean","Malay","Norwegian","Persian","Polish",
  "Portuguese","Romanian","Russian","Serbian","Spanish","Swahili",
  "Swedish","Thai","Turkish","Ukrainian","Urdu","Vietnamese",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchOption = { batchId: number; title: string | null; category: string };

// ─── Language Selector ────────────────────────────────────────────────────────

const LanguageSelector = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) => {
  const toggle = (lang: string) =>
    onChange(
      selected.includes(lang)
        ? selected.filter((l) => l !== lang)
        : [...selected, lang]
    );

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded-lg bg-muted/30">
        {selected.map((lang) => (
          <Badge key={lang} variant="secondary" className="gap-1 pr-1 h-6">
            {lang}
            <button type="button" onClick={() => toggle(lang)}>
              <X className="h-3 w-3 hover:text-destructive" />
            </button>
          </Badge>
        ))}
      </div>
      {/* Language grid picker — commented out; English is set by default
      <div className="max-h-36 overflow-y-auto border rounded-lg p-2 grid grid-cols-2 gap-1">
        {LANGUAGE_OPTIONS.map((lang) => (
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
      */}
    </div>
  );
};

// ─── Batch Selector ───────────────────────────────────────────────────────────

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
  const toggle = (id: number) =>
    onChange(
      selected.includes(id)
        ? selected.filter((b) => b !== id)
        : [...selected, id]
    );

  return (
    <div className="space-y-2">
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

      {/* Batch list */}
      <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
        {loading ? (
          <p className="text-sm text-muted-foreground p-3 text-center">
            Loading batches…
          </p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3 text-center">
            No machines batches found for your account.
          </p>
        ) : (
          batches.map((b) => {
            const isSelected = selected.includes(b.batchId);
            return (
              <button
                key={b.batchId}
                type="button"
                onClick={() => toggle(b.batchId)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                  isSelected ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted"
                }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {b.title || b.category || "Untitled Batch"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Batch ID: #{b.batchId}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Group Card ───────────────────────────────────────────────────────────────

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

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{group.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {group.country}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Languages className="h-3 w-3" />
                {(group.languages ?? []).join(", ") || "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleEditClick}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(group.group_id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Batches section */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Batches
          </p>
          {loadingAuctions ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : allBatchIds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No batches added yet. Click edit to add batches.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {allBatchIds.map((bId: number) => {
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
            </div>
          )}
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
  form: { title: string; country: string; languages: string[]; batchIds: number[] };
  setForm: (v: any) => void;
  sellerBatches: BatchOption[];
  batchesLoading: boolean;
  onSave: () => void;
  saving: boolean;
}) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          {title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 py-1">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="ag-title">
            Group Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ag-title"
            placeholder="e.g. Heavy Machinery – Europe Q3"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label>
            Country <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.country}
            onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a country…" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Languages */}
        <div className="space-y-1.5">
          <Label>
            Languages <span className="text-destructive">*</span>
          </Label>
          <LanguageSelector
            selected={form.languages}
            onChange={(langs) => setForm((f) => ({ ...f, languages: langs }))}
          />
        </div>

        {/* Batches */}
        <div className="space-y-1.5">
          <Label>
            Add Batches{" "}
            <span className="text-muted-foreground font-normal">(machines)</span>
          </Label>
          <BatchSelector
            batches={sellerBatches}
            selected={form.batchIds}
            onChange={(ids) => setForm((f) => ({ ...f, batchIds: ids }))}
            loading={batchesLoading}
          />
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : title}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { title: "", country: "", languages: ["English"] as string[], batchIds: [] as number[] };

const AuctionGroups = () => {
  const sellerId = Number(
    localStorage.getItem("companySellerId") || localStorage.getItem("userId") || 0
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } =
    useGetAuctionGroupsQuery({ seller_id: sellerId, site_id: SITE_TYPE });

  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesBySellerQuery(
    { sellerId: String(sellerId), page: 1, type: "machines" },
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
      languages: group.languages ?? [],
      batchIds: currentBatchIds,
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
    if (!form.title.trim()) { toast.error("Title is required."); return false; }
    if (!form.country) { toast.error("Country is required."); return false; }
    return true;
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await createGroup({
        title: form.title.trim(),
        country: form.country,
        languages: form.languages,
        seller_id: sellerId,
        site_id: SITE_TYPE,
      }).unwrap();

      // Add selected batches as a single auction item
      if (form.batchIds.length > 0) {
        await addAuction({ group_id: res.data.group_id, batch_ids: form.batchIds }).unwrap();
      }

      toast.success("Auction group created!");
      closeDialog();
      refetchGroups();
    } catch {
      toast.error("Failed to create group.");
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
        country: form.country,
        languages: form.languages,
      }).unwrap();

      // Replace all batches in one call
      await replaceBatches({
        group_id: editGroup.group_id,
        batch_ids: form.batchIds,
      }).unwrap();

      toast.success("Group updated!");
      closeDialog();
      refetchGroups();
    } catch {
      toast.error("Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (group_id: number) => {
    if (!window.confirm("Delete this auction group?")) return;
    try {
      await deleteGroup(group_id).unwrap();
      toast.success("Group deleted.");
      refetchGroups();
    } catch {
      toast.error("Failed to delete group.");
    }
  };

  const groups = groupsData?.data ?? [];

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

        {/* ── Groups Grid ── */}
        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed rounded-xl gap-3">
            <Gavel className="h-12 w-12 opacity-25" />
            <p className="text-lg font-medium">No auction groups yet</p>
            <p className="text-sm">Click "New Group" to get started.</p>
            <Button onClick={openCreate} className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> Create First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
