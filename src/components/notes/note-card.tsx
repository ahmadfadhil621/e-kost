"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteForm } from "./note-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateNoteInput } from "@/domain/schemas/tenant-note";
import { Pencil, Trash2 } from "lucide-react";

export interface NoteApi {
  id: string;
  tenantId: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteCardProps {
  note: NoteApi;
  propertyId: string;
  tenantId: string;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function NoteCard({
  note,
  propertyId,
  tenantId,
  onUpdated,
  onDeleted,
}: NoteCardProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdate = async (data: CreateNoteInput) => {
    const res = await fetch(
      `/api/properties/${propertyId}/tenants/${tenantId}/notes/${note.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to update note");
    }
    setEditing(false);
    onUpdated();
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/tenants/${tenantId}/notes/${note.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to delete note");
      }
      setDeleteOpen(false);
      onDeleted();
    } finally {
      setDeleteLoading(false);
    }
  };

  const noteDate = note.date ? new Date(note.date) : new Date();
  const createdAt = note.createdAt ? new Date(note.createdAt) : new Date();

  if (editing) {
    return (
      <Card className="w-full">
        <CardContent className="pt-4">
          <NoteForm
            defaultValues={{
              content: note.content,
              date: note.date?.toString().split("T")[0] ?? new Date().toISOString().split("T")[0],
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitLabel={t("notes.form.submit")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="pt-4 space-y-2">
          <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
          <p className="text-xs text-muted-foreground">
            {t("notes.form.date")}: {format(noteDate, "PPP")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("payment.list.recorded")}: {format(createdAt, "PPp")}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              aria-label={t("common.edit")}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              aria-label={t("common.delete")}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("notes.delete.confirm")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? t("common.loading") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
