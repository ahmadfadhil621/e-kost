"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createNoteSchema,
  type CreateNoteInput,
} from "@/domain/schemas/tenant-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const defaultNoteDate = () => new Date().toISOString().split("T")[0];

export interface NoteFormProps {
  defaultValues?: Partial<CreateNoteInput>;
  onSubmit: (data: CreateNoteInput) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function NoteForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel,
}: NoteFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      content: defaultValues?.content ?? "",
      date: defaultValues?.date ?? defaultNoteDate(),
    },
  });

  const content = watch("content");
  const contentLength = (content ?? "").length;

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="note-content">{t("notes.form.content")}</Label>
        <textarea
          id="note-content"
          {...register("content")}
          placeholder={t("notes.form.contentPlaceholder")}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? "note-content-error" : undefined}
          rows={3}
          maxLength={2001}
          className={cn(
            "flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y"
          )}
        />
        <p className="text-xs text-muted-foreground">
          {contentLength}/2000
        </p>
        {errors.content && (
          <p
            id="note-content-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.content.message?.includes("2000")
              ? t("notes.validation.contentTooLong")
              : t("notes.validation.contentRequired")}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-date">{t("notes.form.date")}</Label>
        <Input
          id="note-date"
          type="date"
          {...register("date")}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "note-date-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.date && (
          <p id="note-date-error" className="text-sm text-destructive">
            {t("notes.validation.invalidDate")}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t("notes.form.cancel")}
        </Button>
        <Button
          type="submit"
          className="min-h-[44px] min-w-[44px]"
          disabled={isLoading}
        >
          {isLoading ? t("common.loading") : (submitLabel ?? t("notes.form.submit"))}
        </Button>
      </div>
    </form>
  );
}
