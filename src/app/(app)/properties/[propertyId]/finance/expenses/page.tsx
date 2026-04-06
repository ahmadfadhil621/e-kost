"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { MoreVertical } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonthSelector } from "@/components/finance/month-selector";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { Expense } from "@/domain/schemas/expense";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyInfo = { role: PropertyRole; staffOnlyFinance: boolean };

async function fetchProperty(propertyId: string): Promise<PropertyInfo> {
  const res = await fetch(`/api/properties/${propertyId}`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch property"); }
  return res.json() as Promise<PropertyInfo>;
}

async function fetchExpenses(propertyId: string, year: number, month: number): Promise<Expense[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses?year=${year}&month=${month}`,
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
  const searchParams = useSearchParams();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(() => {
    const y = Number(searchParams.get("year"));
    return y >= 2000 && y <= 2100 ? y : now.getFullYear();
  });
  const [month, setMonth] = useState(() => {
    const m = Number(searchParams.get("month"));
    return m >= 1 && m <= 12 ? m : now.getMonth() + 1;
  });

  const goPrevious = useCallback(() => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const goNext = useCallback(() => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", propertyId, year, month],
    queryFn: () => fetchExpenses(propertyId, year, month),
    enabled: !!propertyId,
  });

  const canMutateFinance = !(property?.staffOnlyFinance && property?.role === "owner");

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(propertyId, expenseId),
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: ["expenses", propertyId, year, month] });
      const previousExpenses = queryClient.getQueryData<Expense[]>(["expenses", propertyId, year, month]);
      queryClient.setQueryData<Expense[]>(["expenses", propertyId, year, month], (old) =>
        (old ?? []).filter((e) => e.id !== expenseId)
      );
      return { previousExpenses };
    },
    onError: (_err, _expenseId, context) => {
      queryClient.setQueryData(["expenses", propertyId, year, month], context?.previousExpenses);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId, year, month] });
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
        {canMutateFinance && (
          <Button asChild className="min-h-[44px] min-w-[44px]">
            <Link href={`/properties/${propertyId}/finance/expenses/new`}>
              {t("finance.addExpense")}
            </Link>
          </Button>
        )}
      </div>

      <MonthSelector
        year={year}
        month={month}
        onPrevious={goPrevious}
        onNext={goNext}
      />

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
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-sm font-medium">
                    {t(`expense.category.${expense.category}`)}
                  </span>
                  {canMutateFinance && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-h-[44px] min-w-[44px]"
                          aria-label={t("payment.delete.moreOptions")}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/properties/${propertyId}/finance/expenses/${expense.id}/edit`}
                          >
                            {t("common.edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setPendingDeleteId(expense.id)}
                        >
                          {t("expense.delete.title")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                  const id = pendingDeleteId;
                  setPendingDeleteId(null);
                  deleteMutation.mutate(id);
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
