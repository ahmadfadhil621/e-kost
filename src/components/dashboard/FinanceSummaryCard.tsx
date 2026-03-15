"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  return (
    <Card className="w-full" data-testid="finance-summary-card">
      <CardHeader>
        <span className="text-muted-foreground text-sm">
          {t("dashboard.finance.title")} — {monthLabel}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("dashboard.finance.income")}</p>
            <p className="text-lg font-semibold tabular-nums text-finance-income" aria-label={`Income ${formatCurrency(finance.income)}`}>
              {formatCurrency(finance.income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("dashboard.finance.expenses")}</p>
            <p className="text-lg font-semibold tabular-nums text-finance-expense" aria-label={`Expenses ${formatCurrency(finance.expenses)}`}>
              {formatCurrency(finance.expenses)}
            </p>
          </div>
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
    </Card>
  );
}
