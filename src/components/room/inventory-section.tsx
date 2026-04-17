"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { ConditionBadge } from "@/components/room/condition-badge";
import { InventoryItemForm } from "@/components/room/inventory-item-form";
import type {
  InventoryItem,
  CreateInventoryItemInput,
} from "@/domain/schemas/room-inventory-item";

interface InventorySectionProps {
  propertyId: string;
  roomId: string;
  isArchived: boolean;
}

async function fetchInventory(
  propertyId: string,
  roomId: string
): Promise<InventoryItem[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/inventory`,
    { credentials: "include" }
  );
  if (!res.ok) { throw new Error("Failed to fetch inventory"); }
  const body = await res.json();
  return body.data;
}

async function createItem(
  propertyId: string,
  roomId: string,
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/inventory`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string })?.error ?? "Failed to add item");
  }
  const body = await res.json();
  return (body as { data: InventoryItem }).data;
}

async function updateItem(
  propertyId: string,
  roomId: string,
  itemId: string,
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string })?.error ?? "Failed to update item"
    );
  }
  const body = await res.json();
  return (body as { data: InventoryItem }).data;
}

async function deleteItem(
  propertyId: string,
  roomId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/inventory/${itemId}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string })?.error ?? "Failed to remove item"
    );
  }
}

interface InventoryItemRowProps {
  item: InventoryItem;
  isArchived: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

function InventoryItemRow({ item, isArchived, onEdit, onDelete }: InventoryItemRowProps) {
  const { t } = useTranslation();
  const [showExact, setShowExact] = useState(false);

  const date = new Date(item.conditionUpdatedAt);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  const exactTime = format(date, "MMM d, yyyy · HH:mm");

  return (
    <li className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <ConditionBadge condition={item.condition} />
        <button
          type="button"
          onClick={() => setShowExact((v) => !v)}
          className="text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2 cursor-pointer min-h-[24px] px-0.5"
          aria-label={showExact ? exactTime : relativeTime}
        >
          {t("inventory.conditionRecorded")}: {showExact ? exactTime : relativeTime}
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">
          {item.name}
          {item.quantity > 1 && (
            <span className="ml-1 font-normal text-muted-foreground">
              ×{item.quantity}
            </span>
          )}
        </span>
        {item.notes && (
          <p className="max-w-[160px] truncate text-xs text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
      {!isArchived && (
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={t("inventory.editItem")}
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            aria-label={t("inventory.deleteItem")}
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </li>
  );
}

export function InventorySection({
  propertyId,
  roomId,
  isArchived,
}: InventorySectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", propertyId, roomId],
    queryFn: () => fetchInventory(propertyId, roomId),
    enabled: !!propertyId && !!roomId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["inventory", propertyId, roomId],
    });

  const addMutation = useMutation({
    mutationFn: (input: CreateInventoryItemInput) =>
      createItem(propertyId, roomId, input),
    onSuccess: () => {
      invalidate();
      toast({ title: t("inventory.success.added") });
      setAddOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: (input: CreateInventoryItemInput) =>
      updateItem(propertyId, roomId, editTarget!.id, input),
    onSuccess: () => {
      invalidate();
      toast({ title: t("inventory.success.updated") });
      setEditTarget(null);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(propertyId, roomId, deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      toast({ title: t("inventory.success.deleted") });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("inventory.title")}</h3>
        {!isArchived && (
          <Button
            size="sm"
            variant="outline"
            className="min-h-[44px] min-w-[44px] gap-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("inventory.addItem")}
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{t("room.errors.loadFailed")}</p>
      )}

      {!isLoading && !error && items?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("inventory.empty")}</p>
      )}

      {!isLoading && !error && items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <InventoryItemRow
              key={item.id}
              item={item}
              isArchived={isArchived}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </ul>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inventory.addItem")}</DialogTitle>
          </DialogHeader>
          <InventoryItemForm
            mode="add"
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={() => setAddOpen(false)}
            isLoading={addMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) { setEditTarget(null); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inventory.editItem")}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <InventoryItemForm
              mode="edit"
              defaultValues={{
                name: editTarget.name,
                quantity: editTarget.quantity,
                condition: editTarget.condition,
                notes: editTarget.notes ?? undefined,
              }}
              onSubmit={(data) => editMutation.mutate(data)}
              onCancel={() => setEditTarget(null)}
              isLoading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) { setDeleteTarget(null); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inventory.deleteItem")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("inventory.deleteConfirm")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
