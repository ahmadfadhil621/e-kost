"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExpenseForm } from "@/components/expense/expense-form";
import type { CreateExpenseInput } from "@/domain/schemas/expense";

type ExpenseResponse = {
  id: string;
  propertyId: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

async function fetchExpense(
  propertyId: string,
  expenseId: string
): Promise<ExpenseResponse> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses/${expenseId}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch expense");
  }
  return res.json();
}

export default function EditExpensePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const expenseId = params.expenseId as string;
  const queryClient = useQueryClient();

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", propertyId, expenseId],
    queryFn: () => fetchExpense(propertyId, expenseId),
    enabled: !!propertyId && !!expenseId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await fetch(
        `/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? err.errors ?? "Failed to update expense");
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
    await updateMutation.mutateAsync(data);
  };

  if (!propertyId || !expenseId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (isLoading || !expense) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const dateStr =
    typeof expense.date === "string"
      ? expense.date
      : new Date(expense.date).toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-lg font-semibold">{t("expense.edit.title")}</h2>
      <ExpenseForm
        initialData={{
          category: expense.category as CreateExpenseInput["category"],
          amount: expense.amount,
          date: dateStr,
          description: expense.description ?? undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.push(`/properties/${propertyId}/finance/expenses`)
        }
        isLoading={updateMutation.isPending}
      />
      {updateMutation.isError && (
        <p className="text-destructive text-sm" role="alert">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : "Failed to save"}
        </p>
      )}
    </div>
  );
}
