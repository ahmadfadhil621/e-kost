"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createTenantSchema,
  type CreateTenantInput,
} from "@/domain/schemas/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TenantFormProps {
  mode?: "create" | "edit";
  defaultValues?: Partial<CreateTenantInput>;
  defaultBillingDay?: number | null;
  onSubmit?: (data: CreateTenantInput & { billingDayOfMonth?: number | null }) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TenantForm({
  mode = "create",
  defaultValues,
  defaultBillingDay,
  onSubmit,
  onCancel,
  isLoading = false,
}: TenantFormProps) {
  const { t } = useTranslation();
  const [billingDay, setBillingDay] = useState<number | "">(
    defaultBillingDay ?? ""
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: defaultValues ?? {
      name: "",
      phone: "",
      email: "",
    },
  });

  const handleFormSubmit = async (data: CreateTenantInput) => {
    const billingDayOfMonth =
      mode === "edit" && billingDay !== ""
        ? Number(billingDay)
        : undefined;
    await onSubmit?.({ ...data, billingDayOfMonth });
  };

  const titleKey =
    mode === "create" ? "tenant.create.title" : "tenant.edit.title";
  const submitKey =
    mode === "create" ? "tenant.create.submit" : "tenant.edit.submit";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
      <div className="space-y-2">
        <Label htmlFor="tenant-name">{t("tenant.create.name")}</Label>
        <Input
          id="tenant-name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "tenant-name-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.name && (
          <p id="tenant-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-phone">{t("tenant.create.phone")}</Label>
        <Input
          id="tenant-phone"
          type="tel"
          {...register("phone")}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "tenant-phone-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.phone && (
          <p id="tenant-phone-error" className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenant-email">{t("tenant.create.email")}</Label>
        <Input
          id="tenant-email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "tenant-email-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.email && (
          <p id="tenant-email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="tenant-billing-day">{t("tenant.edit.billingDay")}</Label>
          <Input
            id="tenant-billing-day"
            type="number"
            min={1}
            max={31}
            value={billingDay}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setBillingDay(isNaN(v) ? "" : Math.min(31, Math.max(1, v)));
            }}
            className="min-h-[44px] w-24"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
        >
          {isLoading ? t("common.loading") : t(submitKey)}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px]"
          >
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
