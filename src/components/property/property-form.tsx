"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/domain/schemas/property";
import { useCurrency } from "@/contexts/currency-context";
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

interface PropertyFormProps {
  mode?: "create" | "edit";
  defaultValues?: Partial<CreatePropertyInput>;
  onSubmit?: (data: CreatePropertyInput) => void | Promise<void>;
  isLoading?: boolean;
}

export function PropertyForm({
  mode = "create",
  defaultValues,
  onSubmit,
  isLoading = false,
}: PropertyFormProps) {
  const { t } = useTranslation();
  const { availableCurrencies } = useCurrency();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: defaultValues ?? { name: "", address: "", currency: "" },
  });

  const handleFormSubmit = async (data: CreatePropertyInput) => {
    await onSubmit?.(data);
  };

  const titleKey =
    mode === "create" ? "property.create.title" : "property.edit.title";
  const submitKey =
    mode === "create" ? "property.create.submit" : "property.edit.submit";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
      <div className="space-y-2">
        <Label htmlFor="property-name">{t("property.create.name")}</Label>
        <Input
          id="property-name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="property-address">{t("property.create.address")}</Label>
        <Input
          id="property-address"
          {...register("address")}
          aria-invalid={!!errors.address}
          aria-describedby={errors.address ? "address-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.address && (
          <p
            id="address-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.address.message}
          </p>
        )}
      </div>
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="property-currency">{t("property.currency.label")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("property.currency.description")}
          </p>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="property-currency"
                  aria-invalid={!!errors.currency}
                  aria-describedby={errors.currency ? "currency-error" : undefined}
                  className="min-h-[44px]"
                >
                  <SelectValue placeholder={t("property.currency.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.currency && (
            <p id="currency-error" className="text-sm text-destructive" role="alert">
              {errors.currency.message}
            </p>
          )}
        </div>
      )}
      <Button type="submit" disabled={isLoading} className="min-h-[44px] min-w-[44px]">
        {t(submitKey)}
      </Button>
    </form>
  );
}
