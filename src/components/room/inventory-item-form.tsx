"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createInventoryItemSchema,
  ItemConditionEnum,
  type CreateInventoryItemInput,
  type ItemCondition,
} from "@/domain/schemas/room-inventory-item";
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

interface InventoryItemFormProps {
  mode?: "add" | "edit";
  defaultValues?: Partial<CreateInventoryItemInput>;
  onSubmit: (data: CreateInventoryItemInput) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CONDITIONS = ItemConditionEnum.options;

export function InventoryItemForm({
  mode = "add",
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: InventoryItemFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      condition: "GOOD",
      notes: "",
      ...defaultValues,
    },
  });

  const condition = watch("condition");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="item-name">{t("inventory.fields.name")}</Label>
        <Input
          id="item-name"
          placeholder={t("inventory.namePlaceholder")}
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "item-name-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.name && (
          <p id="item-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-quantity">{t("inventory.fields.quantity")}</Label>
        <Input
          id="item-quantity"
          type="number"
          min={1}
          max={999}
          {...register("quantity", { valueAsNumber: true })}
          aria-invalid={!!errors.quantity}
          aria-describedby={errors.quantity ? "item-quantity-error" : undefined}
          className="min-h-[44px]"
        />
        {errors.quantity && (
          <p id="item-quantity-error" className="text-sm text-destructive">
            {errors.quantity.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-condition">{t("inventory.fields.condition")}</Label>
        <Select
          value={condition}
          onValueChange={(v) => setValue("condition", v as ItemCondition)}
        >
          <SelectTrigger
            id="item-condition"
            className="min-h-[44px]"
            aria-label={t("inventory.fields.condition")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c} className="min-h-[44px]">
                {t(`condition.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-notes">{t("inventory.fields.notes")}</Label>
        <Textarea
          id="item-notes"
          placeholder={t("inventory.notesPlaceholder")}
          {...register("notes")}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? "item-notes-error" : undefined}
          className="min-h-[80px]"
        />
        {errors.notes && (
          <p id="item-notes-error" className="text-sm text-destructive">
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
        >
          {isLoading
            ? t("common.loading")
            : mode === "add"
              ? t("inventory.addItem")
              : t("inventory.editItem")}
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
