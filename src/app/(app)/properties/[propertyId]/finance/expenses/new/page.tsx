"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExpenseForm } from "@/components/expense/expense-form";
import type { CreateExpenseInput } from "@/domain/schemas/expense";

export default function NewExpensePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await fetch(
        `/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? err.errors ?? "Failed to create expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId] });
      queryClient.invalidateQueries({
        queryKey: ["finance-summary", propertyId],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      router.push(`/properties/${propertyId}/finance/expenses`);
    },
  });

  const handleSubmit = async (data: CreateExpenseInput) => {
    await createMutation.mutateAsync(data);
  };

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold">{t("expense.create.title")}</h2>
      <ExpenseForm
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/properties/${propertyId}/finance/expenses`)}
        isLoading={createMutation.isPending}
      />
      {createMutation.isError && (
        <p className="text-destructive text-sm" role="alert">
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : "Failed to save"}
        </p>
      )}
    </div>
  );
}
