"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FinanceSummarySnapshot } from "@/domain/schemas/dashboard";

export interface FinanceSummaryCardProps {
  finance: FinanceSummarySnapshot | null;
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function FinanceSummaryCard({
  finance,
  formatCurrency,
  isLoading = false,
}: FinanceSummaryCardProps) {
  const { t } = useTranslation();
  const [activePopup, setActivePopup] = useState<"income" | "expenses" | null>(null);

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="finance-summary-skeleton">
        <CardHeader>
          <span className="text-muted-foreground text-sm">
            {t("dashboard.finance.title")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!finance) {
    return null;
  }

  const monthLabel = MONTH_NAMES[finance.month - 1]
    ? `${MONTH_NAMES[finance.month - 1]} ${finance.year}`
    : `${finance.month}/${finance.year}`;
  const isPositive = finance.netIncome > 0;
  const isNegative = finance.netIncome < 0;

  const sortedBreakdown = [...finance.categoryBreakdown]
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <Card className="w-full" data-testid="finance-summary-card">
      <CardHeader>
        <span className="text-muted-foreground text-sm">
          {t("dashboard.finance.title")} — {monthLabel}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="finance-income-trigger"
            onClick={() => setActivePopup("income")}
            className="min-h-[44px] w-full text-left rounded-md hover:bg-accent"
          >
            <p className="text-xs text-muted-foreground">{t("dashboard.finance.income")}</p>
            <p className="text-lg font-semibold tabular-nums text-finance-income" aria-label={`Income ${formatCurrency(finance.income)}`}>
              {formatCurrency(finance.income)}
            </p>
          </button>
          <button
            data-testid="finance-expenses-trigger"
            onClick={() => setActivePopup("expenses")}
            className="min-h-[44px] w-full text-left rounded-md hover:bg-accent"
          >
            <p className="text-xs text-muted-foreground">{t("dashboard.finance.expenses")}</p>
            <p className="text-lg font-semibold tabular-nums text-finance-expense" aria-label={`Expenses ${formatCurrency(finance.expenses)}`}>
              {formatCurrency(finance.expenses)}
            </p>
          </button>
        </div>
        <p
          className={`text-lg font-semibold tabular-nums ${
            isPositive
              ? "text-finance-profit-positive"
              : isNegative
                ? "text-finance-profit-negative"
                : "text-foreground"
          }`}
          aria-label={`Net income ${formatCurrency(finance.netIncome)}`}
        >
          {t("dashboard.finance.netIncome")}: {formatCurrency(finance.netIncome)}
        </p>
      </CardContent>

      {/* Income detail dialog */}
      <Dialog
        open={activePopup === "income"}
        onOpenChange={(open) => { if (!open) { setActivePopup(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.finance.incomeDetail.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(finance.income)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.finance.incomeDetail.fromRent")}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses breakdown dialog */}
      <Dialog
        open={activePopup === "expenses"}
        onOpenChange={(open) => { if (!open) { setActivePopup(null); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.finance.expensesDetail.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(finance.expenses)}
            </p>
            {sortedBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.finance.expensesDetail.noExpenses")}
              </p>
            ) : (
              <ul className="space-y-1">
                {sortedBreakdown.map((c) => (
                  <li
                    key={c.category}
                    data-testid="expense-category-item"
                    className="flex justify-between text-sm"
                  >
                    <span>{t(`expense.category.${c.category}`)}</span>
                    <span className="tabular-nums">{formatCurrency(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
