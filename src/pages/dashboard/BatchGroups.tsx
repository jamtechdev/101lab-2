import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  CheckCircle2,
  Package,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  CalendarClock,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { SITE_TYPE } from "@/config/site";
import {
  useGetBatchGroupsQuery,
  useCreateBatchGroupMutation,
  useUpdateBatchGroupMutation,
  useToggleBatchGroupMutation,
  useDeleteBatchGroupMutation,
  type BatchGroup,
} from "@/rtk/slices/batchGroupApiSlice";
import { useGetBatchesBySellerQuery } from "@/rtk/slices/productSlice";

const PAGE_SIZE = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

type BatchOption = { batchId: number; title: string | null; category: string };

type FormState = {
  title: string;
  description: string;
  batchIds: number[];
};

const EMPTY_FORM: FormState = { title: "", description: "", batchIds: [] };

// ─── Batch Selector (scroll-paginated) ───────────────────────────────────────

const BatchSelector = ({
  sellerId,
  selected,
  onChange,
}: {
  sellerId: number;
  selected: number[];
  onChange: (ids: number[]) => void;
}) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [page, setPage] = useState(1);
  const [allBatches, setAllBatches] = useState<BatchOption[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useGetBatchesBySellerQuery(
    { sellerId: String(sellerId), page, type: SITE_TYPE, limit: PAGE_SIZE },
    { skip: !sellerId }
  );

  // Accumulate pages into allBatches
  useEffect(() => {
    const incoming: BatchOption[] = (data?.data?.data ?? []).map((b: any) => ({
      batchId: b.batchId,
      title: b.title ?? null,
      category: b.category ?? "",
    }));
    if (incoming.length === 0) { setHasMore(false); return; }
    if (incoming.length < PAGE_SIZE) setHasMore(false);
    setAllBatches((prev) => {
      const existingIds = new Set(prev.map((x) => x.batchId));
      const fresh = incoming.filter((x) => !existingIds.has(x.batchId));
      return [...prev, ...fresh];
    });
  }, [data]);

  // IntersectionObserver on sentinel → load next page
  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  }, [isFetching, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allBatches;
    return allBatches.filter(
      (b) =>
        b.batchId.toString().includes(q) ||
        b.title?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
    );
  }, [allBatches, search]);

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1.5 min-h-10 p-2 border rounded-lg bg-muted/30">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm self-center">
            Pick batches from the list below
          </span>
        ) : (
          selected.map((id) => {
            const b = allBatches.find((x) => x.batchId === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1 h-6">
                <span className="font-mono text-xs">#{id}</span>
                {(b?.title || b?.category) && (
                  <span className="max-w-[110px] truncate text-xs">
                    {b?.title || b?.category}
                  </span>
                )}
                <button type="button" onClick={() => toggle(id)} className="ml-0.5">
                  <X className="h-3 w-3 hover:text-destructive" />
                </button>
              </Badge>
            );
          })
        )}
      </div>

      {/* Search + collapse toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by ID, title, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-2"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Count + bulk actions */}
      {allBatches.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {search ? `${filtered.length} matches` : `${allBatches.length} loaded`}
            {hasMore && !search && " — scroll for more"}
          </span>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs"
              onClick={() => onChange(filtered.map((b) => b.batchId))}>
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs"
              onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable list */}
      {expanded && (
        <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
          {allBatches.length === 0 && isFetching ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Loading batches…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "No matches" : "No batches found"}
              </p>
              {search && (
                <Button type="button" variant="link" size="sm" className="text-xs mt-1"
                  onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              {filtered.map((b) => {
                const sel = selected.includes(b.batchId);
                return (
                  <button
                    key={b.batchId}
                    type="button"
                    onClick={() => toggle(b.batchId)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      sel ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                      sel ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}>
                      {sel && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {b.title || b.category || "Untitled Batch"}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono shrink-0">
                          #{b.batchId}
                        </Badge>
                      </div>
                      {b.category && (
                        <p className="text-xs text-muted-foreground mt-0.5">{b.category}</p>
                      )}
                    </div>
                  </button>
                );
              })}
              {/* Sentinel — triggers next page load when visible */}
              <div ref={sentinelRef} className="py-2 text-center">
                {isFetching && (
                  <p className="text-xs text-muted-foreground">Loading more…</p>
                )}
                {!hasMore && allBatches.length > 0 && !search && (
                  <p className="text-xs text-muted-foreground">All {allBatches.length} batches loaded</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {selected.length} batch(es) selected
        </p>
      )}
    </div>
  );
};

// ─── Group Form Dialog ────────────────────────────────────────────────────────

const GroupDialog = ({
  open,
  onClose,
  dialogTitle,
  form,
  setForm,
  sellerId,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  dialogTitle: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  sellerId: number;
  onSave: () => void;
  saving: boolean;
}) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {dialogTitle}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 py-1">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="bg-title">
            Group Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bg-title"
            placeholder="e.g. Heavy Machinery – Q3 2026"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="bg-desc" className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Description
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="bg-desc"
            placeholder="Describe what this group contains, target buyers, auction notes…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Batches */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Batches
          </Label>
          <BatchSelector
            sellerId={sellerId}
            selected={form.batchIds}
            onChange={(ids) => setForm((f) => ({ ...f, batchIds: ids }))}
          />
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving} className="min-w-[90px]">
          {saving ? "Saving…" : "Save Group"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ─── Group Card ───────────────────────────────────────────────────────────────

const GroupCard = ({
  group,
  onEdit,
  onDelete,
  onToggle,
  toggling,
}: {
  group: BatchGroup;
  onEdit: (group: BatchGroup) => void;
  onDelete: (group: BatchGroup) => void;
  onToggle: (group: BatchGroup) => void;
  toggling: boolean;
}) => {
  const batchIds: number[] = group.batch_ids ?? [];

  return (
    <Card
      className={`border shadow-sm transition-all duration-200 hover:shadow-md ${
        !group.is_active ? "opacity-60" : ""
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{group.title}</h3>
              <Badge
                variant={group.is_active ? "default" : "secondary"}
                className="text-xs shrink-0"
              >
                {group.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(group)}
              title="Edit group"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(group)}
              title="Delete group"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-t" />

        {/* Batches */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
            <Package className="h-3 w-3" />
            Batches ({batchIds.length})
          </p>
          {batchIds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No batches — click Edit to add some.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {batchIds.map((bId) => (
                <Badge key={bId} variant="outline" className="text-xs font-mono">
                  #{bId}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="border-t" />

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {group.is_active ? (
              <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {group.is_active ? "Active" : "Inactive"}
            </span>
            <span className="text-xs text-muted-foreground">
              — {group.is_active ? "visible to buyers" : "hidden from buyers"}
            </span>
          </div>
          <Switch
            checked={group.is_active}
            onCheckedChange={() => onToggle(group)}
            disabled={toggling}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BatchGroups = () => {
  const sellerId = Number(
    localStorage.getItem("companySellerId") || localStorage.getItem("userId") || 0
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: groupsData,
    isLoading: groupsLoading,
  } = useGetBatchGroupsQuery({ seller_id: sellerId, site_id: SITE_TYPE });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [createGroup, { isLoading: creating }] = useCreateBatchGroupMutation();
  const [updateGroup, { isLoading: updating }] = useUpdateBatchGroupMutation();
  const [toggleGroup] = useToggleBatchGroupMutation();
  const [deleteGroup] = useDeleteBatchGroupMutation();

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<BatchGroup | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<BatchGroup | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const saving = creating || updating;

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setDialog("create");
  };

  const openEdit = (group: BatchGroup) => {
    setEditTarget(group);
    setForm({
      title: group.title,
      description: group.description ?? "",
      batchIds: group.batch_ids ?? [],
    });
    setDialog("edit");
  };

  const closeDialog = () => {
    setDialog(null);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.title.trim()) {
      toast.error("Group title is required.");
      return false;
    }
    return true;
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await createGroup({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        batch_ids: form.batchIds,
        seller_id: sellerId,
        site_id: SITE_TYPE,
      }).unwrap();
      toast.success("Group created!");
      closeDialog();
    } catch {
      toast.error("Failed to create group.");
    }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!validate() || !editTarget) return;
    try {
      await updateGroup({
        group_id: editTarget.group_id,
        seller_id: sellerId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        batch_ids: form.batchIds,
      }).unwrap();
      toast.success("Group updated!");
      closeDialog();
    } catch {
      toast.error("Failed to update group.");
    }
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (group: BatchGroup) => {
    setTogglingId(group.group_id);
    try {
      await toggleGroup({ group_id: group.group_id, seller_id: sellerId }).unwrap();
      toast.success(
        group.is_active ? "Group deactivated." : "Group activated!"
      );
    } catch {
      toast.error("Failed to toggle group status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGroup({ group_id: deleteTarget.group_id, seller_id: sellerId }).unwrap();
      toast.success("Group deleted.");
    } catch {
      toast.error("Failed to delete group.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const groups: BatchGroup[] = groupsData?.data ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Batch Groups
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organise multiple batches into named groups. Toggle each group active or inactive.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Group
          </Button>
        </div>

        {/* Stats bar */}
        {!groupsLoading && groups.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{groups.length}</strong> group(s) total
            </span>
            <span className="text-muted-foreground">
              <strong className="text-green-600">
                {groups.filter((g) => g.is_active).length}
              </strong>{" "}
              active
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">
                {groups.reduce((acc, g) => acc + (g.batch_ids?.length ?? 0), 0)}
              </strong>{" "}
              total batches assigned
            </span>
          </div>
        )}

        {/* Groups grid */}
        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-xl text-muted-foreground gap-3">
            <Layers className="h-12 w-12 opacity-20" />
            <p className="text-lg font-medium">No batch groups yet</p>
            <p className="text-sm">Create a group to organise your machine batches.</p>
            <Button onClick={openCreate} className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Create First Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.group_id}
                group={group}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
                toggling={togglingId === group.group_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <GroupDialog
        open={dialog === "create"}
        onClose={closeDialog}
        dialogTitle="Create Batch Group"
        form={form}
        setForm={setForm}
        sellerId={sellerId}
        onSave={handleCreate}
        saving={saving}
      />

      {/* Edit dialog */}
      <GroupDialog
        open={dialog === "edit"}
        onClose={closeDialog}
        dialogTitle="Edit Batch Group"
        form={form}
        setForm={setForm}
        sellerId={sellerId}
        onSave={handleUpdate}
        saving={saving}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group. The batches themselves won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BatchGroups;
