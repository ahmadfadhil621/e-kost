"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ExpenseDetail = {
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
): Promise<ExpenseDetail | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses/${expenseId}`,
    { credentials: "include" }
  );
  if (res.status === 404) {return null;}
  if (!res.ok) {throw new Error("Failed to fetch expense");}
  return res.json();
}

async function deleteExpense(
  propertyId: string,
  expenseId: string
): Promise<void> {
  const res = await fetch(
    `/api/properties/${propertyId}/expenses/${expenseId}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to delete expense");
  }
}

export default function ExpenseDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formatCurrency = useFormatCurrency();
  const propertyId = params.propertyId as string;
  const expenseId = params.expenseId as string;

  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: expense, isLoading, error } = useQuery({
    queryKey: ["expense", propertyId, expenseId],
    queryFn: () => fetchExpense(propertyId, expenseId),
    enabled: !!propertyId && !!expenseId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(propertyId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      toast({ title: t("expense.delete.success") });
      setDeleteOpen(false);
      router.push(`/properties/${propertyId}/finance/expenses`);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t("expense.detail.notFound")}</p>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() =>
            router.push(`/properties/${propertyId}/finance/expenses`)
          }
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("expense.detail.notFound")}</p>
      </div>
    );
  }

  const formattedDate = new Date(expense.date).toLocaleDateString(
    typeof window !== "undefined" ? navigator.language : "en",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold">{t("expense.detail.title")}</h2>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("expense.form.category")}</p>
          <p className="font-medium">{t(`expense.category.${expense.category}`)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("expense.form.amount")}</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("expense.form.date")}</p>
          <p className="font-medium">{formattedDate}</p>
        </div>
        {expense.description && (
          <div>
            <p className="text-sm text-muted-foreground">
              {t("expense.form.description")}
            </p>
            <p className="font-medium">{expense.description}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link
            href={`/properties/${propertyId}/finance/expenses/${expenseId}/edit`}
          >
            {t("common.edit")}
          </Link>
        </Button>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() =>
            router.push(`/properties/${propertyId}/finance/expenses`)
          }
        >
          {t("common.back")}
        </Button>
      </div>

      {/* G-3: Destructive actions at bottom */}
      <div className="border-t pt-6 space-y-3">
        <Button
          variant="destructive"
          className="min-h-[44px] min-w-[44px] w-full"
          onClick={() => setDeleteOpen(true)}
          aria-label={t("expense.delete.title")}
        >
          {t("expense.delete.title")}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("expense.delete.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("expense.delete.confirmMessage")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setDeleteOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
