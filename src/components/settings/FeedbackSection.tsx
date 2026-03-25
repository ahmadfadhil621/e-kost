"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { feedbackSchema } from "@/domain/schemas/feedback";
import type { FeedbackInput } from "@/domain/schemas/feedback";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function FeedbackSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const MAX = 2000;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { message: "" },
  });

  const message = watch("message") ?? "";

  const onSubmit = async (data: FeedbackInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: data.message }),
      });
      if (res.ok) {
        toast({ title: t("settings.feedback.success") });
        reset();
      } else {
        toast({ title: t("settings.feedback.error") });
      }
    } catch {
      toast({ title: t("settings.feedback.error") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="feedback-heading">
      <h2 id="feedback-heading" className="text-base font-semibold text-foreground">
        {t("settings.feedback.title")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-2">
        <Label htmlFor="feedback-message">{t("settings.feedback.title")}</Label>
        <textarea
          id="feedback-message"
          {...register("message")}
          maxLength={MAX}
          placeholder={t("settings.feedback.placeholder")}
          disabled={submitting}
          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {errors.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.message.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {t("settings.feedback.charsRemaining", { count: MAX - message.length })}
        </p>
        <Button type="submit" disabled={submitting} className="min-h-[44px]">
          {submitting ? t("settings.feedback.submitting") : t("settings.feedback.submit")}
        </Button>
      </form>
    </section>
  );
}
