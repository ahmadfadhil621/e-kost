"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  createExpenseSchema,
  type CreateExpenseInput,
  expenseCategories,
} from "@/domain/schemas/expense";
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

export type ExpenseFormData = CreateExpenseInput;

interface ExpenseFormProps {
  onSubmit?: (data: CreateExpenseInput) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultDate?: string;
}

const defaultExpenseDate = () => new Date().toISOString().split("T")[0];

export function ExpenseForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultDate = defaultExpenseDate(),
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      category: undefined as unknown as CreateExpenseInput["category"],
      amount: undefined as unknown as number,
      date: defaultDate,
      description: "",
    },
  });

  const category = watch("category");

  return (
    <form
      onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="expense-category">
          {t("expense.form.category")}
        </Label>
        <Select
          value={category}
          onValueChange={(v) =>
            setValue("category", v as CreateExpenseInput["category"])
          }
        >
          <SelectTrigger
            id="expense-category"
            className="min-h-[44px]"
            aria-invalid={!!errors.category}
          >
            <SelectValue placeholder={t("expense.form.category")} />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`expense.category.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-destructive text-sm" role="alert">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="expense-amount">{t("expense.form.amount")}</Label>
        <Input
          id="expense-amount"
          type="number"
          step="0.01"
          min="0.01"
          className="min-h-[44px]"
          aria-invalid={!!errors.amount}
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-destructive text-sm" role="alert">
            {errors.amount.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="expense-date">{t("expense.form.date")}</Label>
        <Input
          id="expense-date"
          type="date"
          className="min-h-[44px]"
          aria-invalid={!!errors.date}
          {...register("date")}
        />
        {errors.date && (
          <p className="text-destructive text-sm" role="alert">
            {errors.date.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="expense-description">
          {t("expense.form.description")}
        </Label>
        <Input
          id="expense-description"
          className="min-h-[44px]"
          {...register("description")}
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-[44px]"
          >
            {t("expense.form.cancel")}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px]"
        >
          {t("expense.form.submit")}
        </Button>
      </div>
    </form>
  );
}
