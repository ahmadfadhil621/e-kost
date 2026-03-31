"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "@/domain/schemas/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TenantOption {
  id: string;
  name: string;
  roomNumber?: string;
}

interface PaymentFormProps {
  tenants?: TenantOption[];
  onSubmit?: (data: CreatePaymentInput) => void | Promise<void>;
  onSuccess?: () => void;
  isLoading?: boolean;
  defaultTenantId?: string;
}

const defaultPaymentDate = () =>
  new Date().toISOString().split("T")[0];

export function PaymentForm({
  tenants = [],
  onSubmit,
  onSuccess,
  isLoading = false,
  defaultTenantId = "",
}: PaymentFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      tenantId: defaultTenantId,
      amount: undefined as unknown as number,
      paymentDate: defaultPaymentDate(),
    },
  });

  useEffect(() => {
    if (defaultTenantId) {
      setValue("tenantId", defaultTenantId, { shouldValidate: false });
    }
  }, [defaultTenantId, setValue]);

  const tenantId = watch("tenantId");

  const handleFormSubmit = async (data: CreatePaymentInput) => {
    await onSubmit?.(data);
    reset({
      tenantId: "",
      amount: undefined as unknown as number,
      paymentDate: defaultPaymentDate(),
    });
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t("payment.create.title")}</h2>
      <div className="space-y-2">
        <Label htmlFor="payment-tenant">{t("payment.create.tenant")}</Label>
        <Select
          value={tenantId}
          onValueChange={(v) => setValue("tenantId", v, { shouldValidate: true })}
        >
          <SelectTrigger
            id="payment-tenant"
            className="min-h-[44px]"
            aria-invalid={!!errors.tenantId}
            aria-describedby={errors.tenantId ? "tenantId-error" : undefined}
          >
            <SelectValue placeholder={t("payment.create.selectTenant")} />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.roomNumber
                  ? `${tenant.name} - ${tenant.roomNumber}`
                  : tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tenantId && (
          <p id="tenantId-error" className="text-sm text-destructive">
            {errors.tenantId.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment-amount">{t("payment.create.amount")}</Label>
        <Input
          id="payment-amount"
          type="number"
          step="0.01"
          min="0.01"
          {...register("amount", { valueAsNumber: true })}
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? "amount-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.amount && (
          <p id="amount-error" className="text-sm text-destructive">
            {errors.amount.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment-date">{t("payment.create.date")}</Label>
        <Input
          id="payment-date"
          type="date"
          {...register("paymentDate")}
          aria-invalid={!!errors.paymentDate}
          aria-describedby={errors.paymentDate ? "paymentDate-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.paymentDate && (
          <p id="paymentDate-error" className="text-sm text-destructive">
            {errors.paymentDate.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="min-h-[44px] min-w-[44px]"
        disabled={isLoading}
      >
        {isLoading ? t("common.loading") : t("payment.create.submit")}
      </Button>
    </form>
  );
}
