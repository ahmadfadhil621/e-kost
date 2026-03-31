"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createCurrencyFormSchema = z.object({
  code: z.string().min(3).max(3),
  locale: z.string().min(2),
  label: z.string().min(1),
});
type CreateCurrencyFormInput = z.infer<typeof createCurrencyFormSchema>;

type Currency = {
  id: string;
  code: string;
  locale: string;
  label: string;
  createdAt: string;
};

export function CurrencySection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: currencies = [], isLoading } = useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: async () => {
      const res = await fetch("/api/currencies");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCurrencyFormInput) => {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        if (res.status === 409) {
          throw new Error(t("settings.currencyManagement.error.alreadyExists"));
        }
        throw new Error(json.error ?? t("settings.currencyManagement.error.createFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      setShowForm(false);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/currencies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        if (res.status === 409) {
          const body = json.error ?? "";
          if (body.toLowerCase().includes("last")) {
            throw new Error(t("settings.currencyManagement.error.lastCurrency"));
          }
          throw new Error(t("settings.currencyManagement.error.inUse"));
        }
        throw new Error(json.error ?? t("settings.currencyManagement.error.deleteFailed"));
      }
    },
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
    },
    onError: (err: Error) => {
      setDeleteError(err.message);
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateCurrencyFormInput>({
    resolver: zodResolver(createCurrencyFormSchema),
  });

  const onSubmit = (data: CreateCurrencyFormInput) => {
    createMutation.mutate(data);
  };

  return (
    <section aria-labelledby="currency-management-heading">
      <div className="flex items-center justify-between">
        <h2 id="currency-management-heading" className="text-base font-semibold text-foreground">
          {t("settings.currencyManagement.title")}
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
        >
          {t("settings.currencyManagement.add")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 rounded-md border p-4">
          <div className="space-y-1">
            <Label htmlFor="currency-code">{t("settings.currencyManagement.form.code")}</Label>
            <Input
              id="currency-code"
              placeholder={t("settings.currencyManagement.form.codePlaceholder")}
              className="min-h-[44px]"
              {...register("code")}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="currency-locale">{t("settings.currencyManagement.form.locale")}</Label>
            <Input
              id="currency-locale"
              placeholder={t("settings.currencyManagement.form.localePlaceholder")}
              className="min-h-[44px]"
              {...register("locale")}
            />
            {errors.locale && <p className="text-sm text-destructive">{errors.locale.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="currency-label">{t("settings.currencyManagement.form.label")}</Label>
            <Input
              id="currency-label"
              placeholder={t("settings.currencyManagement.form.labelPlaceholder")}
              className="min-h-[44px]"
              {...register("label")}
            />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">{(createMutation.error as Error).message}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending}>
              {t("settings.currencyManagement.form.submit")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>
              {t("settings.currencyManagement.form.cancel")}
            </Button>
          </div>
        </form>
      )}

      {deleteError && (
        <p className="mt-2 text-sm text-destructive">{deleteError}</p>
      )}

      {isLoading ? null : (
        <div className="mt-4">
          {currencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("settings.currencyManagement.list.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {currencies.map((currency) => (
                <li key={currency.id} className="flex items-center justify-between rounded-md border px-3 py-3 text-sm">
                  <div>
                    <span className="font-medium">{currency.code}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span>{currency.label}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{currency.locale}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(currency.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {t("settings.currencyManagement.list.delete")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
