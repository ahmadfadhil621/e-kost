"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MonthSelector } from "@/components/finance/month-selector";
import { SummaryCard } from "@/components/finance/summary-card";
import { CategoryBreakdownList } from "@/components/finance/category-breakdown-list";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { FinanceSummary } from "@/domain/schemas/expense";

async function fetchFinanceSummary(
  propertyId: string,
  year: number,
  month: number
): Promise<FinanceSummary> {
  const res = await fetch(
    `/api/properties/${propertyId}/finance/summary?year=${year}&month=${month}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch finance summary");
  }
  return res.json();
}

export default function FinanceOverviewPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const formatCurrency = useFormatCurrency();

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

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

  const { data, isLoading, error } = useQuery({
    queryKey: ["finance-summary", propertyId, year, month],
    queryFn: () => fetchFinanceSummary(propertyId, year, month),
    enabled: !!propertyId,
    staleTime: 60_000,
  });

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold">{t("finance.title")}</h2>

      <MonthSelector
        year={year}
        month={month}
        onPrevious={goPrevious}
        onNext={goNext}
      />

      {error && (
        <p className="text-destructive text-sm">
          {t("auth.error.generic")}
        </p>
      )}

      {isLoading && (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      )}

      {data && !error && (
        <>
          <div className="flex flex-col gap-3">
            <SummaryCard
              label={t("finance.income")}
              amount={data.income}
              variant="income"
              formatCurrency={formatCurrency}
            />
            <SummaryCard
              label={t("finance.expenses")}
              amount={data.expenses}
              variant="expense"
              formatCurrency={formatCurrency}
            />
            <SummaryCard
              label={t("finance.netIncome")}
              amount={data.netIncome}
              variant="net"
              formatCurrency={formatCurrency}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t("finance.categoryBreakdown")}
            </h3>
            <CategoryBreakdownList
              categories={data.categoryBreakdown}
              totalExpenses={data.expenses}
              formatCurrency={formatCurrency}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/finance/expenses`}>
            {t("finance.viewExpenses")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/finance/expenses/new`}>
            {t("finance.addExpense")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
