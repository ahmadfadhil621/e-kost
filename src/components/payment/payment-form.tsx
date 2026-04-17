"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from "@/domain/schemas/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export interface CycleOption {
  year: number;
  month: number;
  label: string;
}

interface PaymentFormProps {
  tenants?: TenantOption[];
  onSubmit?: (data: CreatePaymentInput) => void | Promise<void>;
  onSuccess?: () => void;
  isLoading?: boolean;
  defaultTenantId?: string;
  availableCycles?: CycleOption[];
  defaultCycleYear?: number;
  defaultCycleMonth?: number;
}

const defaultNoteValue = () =>
  `${format(new Date(), "MMMM")}'s rent`;

const defaultPaymentDate = () =>
  new Date().toISOString().split("T")[0];

export function PaymentForm({
  tenants = [],
  onSubmit,
  onSuccess,
  isLoading = false,
  defaultTenantId = "",
  availableCycles,
  defaultCycleYear,
  defaultCycleMonth,
}: PaymentFormProps) {
  const { t } = useTranslation();

  const defaultCycleValue =
    defaultCycleYear !== undefined && defaultCycleMonth !== undefined
      ? `${defaultCycleYear}-${defaultCycleMonth}`
      : availableCycles && availableCycles.length > 0
      ? `${availableCycles[0].year}-${availableCycles[0].month}`
      : "";

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
      billingCycleYear: defaultCycleYear,
      billingCycleMonth: defaultCycleMonth,
      note: defaultNoteValue(),
    },
  });

  useEffect(() => {
    if (defaultTenantId) {
      setValue("tenantId", defaultTenantId, { shouldValidate: false });
    }
  }, [defaultTenantId, setValue]);

  const tenantId = watch("tenantId");
  const [cycleValue, setCycleValue] = useState(defaultCycleValue);

  // Sync FIFO default when cycles load asynchronously after mount
  useEffect(() => {
    if (defaultCycleYear !== undefined && defaultCycleMonth !== undefined && !cycleValue) {
      setCycleValue(`${defaultCycleYear}-${defaultCycleMonth}`);
      setValue("billingCycleYear", defaultCycleYear, { shouldValidate: false });
      setValue("billingCycleMonth", defaultCycleMonth, { shouldValidate: false });
    }
  }, [defaultCycleYear, defaultCycleMonth, cycleValue, setValue]);

  const handleCycleChange = (v: string) => {
    setCycleValue(v);
    const [year, month] = v.split("-").map(Number);
    setValue("billingCycleYear", year, { shouldValidate: false });
    setValue("billingCycleMonth", month, { shouldValidate: false });
  };

  const handleFormSubmit = async (data: CreatePaymentInput) => {
    await onSubmit?.(data);
    reset({
      tenantId: "",
      amount: undefined as unknown as number,
      paymentDate: defaultPaymentDate(),
      note: defaultNoteValue(),
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
      {availableCycles && availableCycles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="billing-period">{t("billing.period")}</Label>
          <Select
            value={cycleValue}
            onValueChange={handleCycleChange}
          >
            <SelectTrigger
              id="billing-period"
              aria-label={t("billing.period")}
              className="min-h-[44px]"
            >
              <SelectValue placeholder={t("billing.selectPeriod")} />
            </SelectTrigger>
            <SelectContent>
              {availableCycles.map((c) => (
                <SelectItem key={`${c.year}-${c.month}`} value={`${c.year}-${c.month}`}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="payment-note">{t("payment.create.note")}</Label>
        <Textarea
          id="payment-note"
          {...register("note")}
          maxLength={1000}
          className="resize-none"
          rows={3}
          placeholder={t("payment.create.notePlaceholder")}
          aria-invalid={!!errors.note}
          aria-describedby={errors.note ? "note-error" : undefined}
        />
        {errors.note && (
          <p id="note-error" className="text-sm text-destructive">
            {errors.note.message}
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
