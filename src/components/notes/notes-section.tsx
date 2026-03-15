"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { NoteCard, type NoteApi } from "./note-card";
import { NoteForm } from "./note-form";
import type { CreateNoteInput } from "@/domain/schemas/tenant-note";

async function fetchNotes(
  propertyId: string,
  tenantId: string
): Promise<NoteApi[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/notes`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch notes");
  }
  return res.json();
}

export interface NotesSectionProps {
  propertyId: string;
  tenantId: string;
  readOnly?: boolean;
}

export function NotesSection({
  propertyId,
  tenantId,
  readOnly = false,
}: NotesSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const queryKey = ["notes", propertyId, tenantId];
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchNotes(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const handleCreate = async (data: CreateNoteInput) => {
    setCreateLoading(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/tenants/${tenantId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body?.errors?.content?.[0] ?? body?.error) ?? "Failed to add note"
        );
      }
      toast({ title: t("notes.create.success") });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast({
        title: t("auth.error.generic"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h2 id="notes-section-heading" className="text-lg font-semibold mb-2">
          {t("notes.title")}
        </h2>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 id="notes-section-heading" className="text-lg font-semibold mb-2">
          {t("notes.title")}
        </h2>
        <p className="text-destructive">{t("auth.error.generic")}</p>
      </section>
    );
  }

  return (
    <section>
      <h2 id="notes-section-heading" className="text-lg font-semibold mb-2">
        {t("notes.title")}
      </h2>
      {readOnly && (
        <p className="text-sm text-muted-foreground mb-3">
          {t("notes.movedOut")}
        </p>
      )}
      {!readOnly && !showAddForm && (
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] min-w-[44px] mb-3"
          onClick={() => setShowAddForm(true)}
        >
          {t("notes.add")}
        </Button>
      )}
      {!readOnly && showAddForm && (
        <div className="mb-4">
          <NoteForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            isLoading={createLoading}
          />
        </div>
      )}
      {notes.length === 0 && !showAddForm ? (
        <p className="text-muted-foreground">{t("notes.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {notes.map((note) => (
            <li key={note.id}>
              <NoteCard
                note={note}
                propertyId={propertyId}
                tenantId={tenantId}
                onUpdated={() => queryClient.invalidateQueries({ queryKey })}
                onDeleted={() => queryClient.invalidateQueries({ queryKey })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
