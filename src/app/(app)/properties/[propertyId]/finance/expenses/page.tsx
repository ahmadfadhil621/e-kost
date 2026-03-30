"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { Expense } from "@/domain/schemas/expense";

async function fetchExpenses(propertyId: string): Promise<Expense[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch expenses");
  }
  const data = await res.json();
  return (data ?? []).map(
    (e: {
      id: string;
      propertyId: string;
      category: string;
      amount: number;
      date: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }) => ({
      ...e,
      date: new Date(e.date),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    })
  );
}

async function deleteExpense(propertyId: string, expenseId: string): Promise<void> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses/${expenseId}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok && res.status !== 204) {
    throw new Error("Failed to delete expense");
  }
}

export default function ExpenseListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const formatCurrency = useFormatCurrency();
  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", propertyId],
    queryFn: () => fetchExpenses(propertyId),
    enabled: !!propertyId,
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(propertyId, expenseId),
    onSuccess: () => {
      setPendingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId] });
    },
  });

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t("expense.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/finance/expenses/new`}>
            {t("finance.addExpense")}
          </Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      )}

      {!isLoading && expenses.length === 0 && (
        <p className="text-muted-foreground">{t("expense.list.empty")}</p>
      )}

      {!isLoading && expenses.length > 0 && (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <Card className="w-full">
                <CardHeader className="pb-2">
                  <span className="text-sm font-medium">
                    {t(`expense.category.${expense.category}`)}
                  </span>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {expense.date.toLocaleDateString(
                      typeof window !== "undefined"
                        ? navigator.language
                        : "en",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                  {expense.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {expense.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] flex-1"
                    >
                      <Link
                        href={`/properties/${propertyId}/finance/expenses/${expense.id}/edit`}
                      >
                        {t("common.edit")}
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] flex-1"
                      onClick={() => setPendingDeleteId(expense.id)}
                    >
                      {t("expense.delete.title")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) { setPendingDeleteId(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("expense.delete.confirm")}</DialogTitle>
            <DialogDescription>
              {t("expense.delete.confirmMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setPendingDeleteId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px]"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDeleteId) {
                  deleteMutation.mutate(pendingDeleteId);
                }
              }}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
