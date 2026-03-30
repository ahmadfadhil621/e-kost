"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { MonthSelector } from "@/components/finance/month-selector";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { Card, CardContent } from "@/components/ui/card";
import type { CashflowEntry } from "@/domain/schemas/cashflow";

async function fetchCashflow(
  propertyId: string,
  year: number,
  month: number
): Promise<CashflowEntry[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/finance/cashflow?year=${year}&month=${month}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch cashflow");
  }
  return res.json();
}

export default function CashflowPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const formatCurrency = useFormatCurrency();
  const searchParams = useSearchParams();

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

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["cashflow", propertyId, year, month],
    queryFn: () => fetchCashflow(propertyId, year, month),
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
      <h2 className="text-lg font-semibold">{t("finance.cashflow.title")}</h2>

      <MonthSelector
        year={year}
        month={month}
        onPrevious={goPrevious}
        onNext={goNext}
      />

      {error && (
        <p className="text-destructive text-sm">{t("auth.error.generic")}</p>
      )}

      {isLoading && (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <p className="text-muted-foreground">{t("finance.cashflow.empty")}</p>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="w-full">
                <CardContent className="flex items-center justify-between py-3 px-4 min-h-[44px]">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {entry.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString(
                        typeof window !== "undefined" ? navigator.language : "en",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ml-4 ${
                      entry.type === "income"
                        ? "text-[hsl(var(--status-available))]"
                        : "text-[hsl(var(--status-occupied))]"
                    }`}
                  >
                    {entry.type === "income" ? "+" : "−"}
                    {formatCurrency(entry.amount)}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
