"use client";

import { useTranslation } from "react-i18next";
import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";

interface StaffSummarySectionProps {
  entries: StaffSummaryEntry[];
  isLoading: boolean;
  formatCurrency: (n: number) => string;
}

export function StaffSummarySection({
  entries,
  isLoading,
  formatCurrency,
}: StaffSummarySectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">{t("finance.staffSummary.title")}</h3>

      {isLoading && (
        <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
      )}

      {!isLoading && entries.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("finance.staffSummary.empty")}</p>
      )}

      {!isLoading && entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.actorId}
              className="rounded-lg border bg-card p-3 flex flex-col gap-1 text-sm"
            >
              <span className="font-medium">{entry.actorName}</span>
              <span className="text-muted-foreground capitalize">{entry.actorRole}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                <span>
                  {t("finance.staffSummary.collected")}:{" "}
                  <span className="font-medium text-green-600">
                    {formatCurrency(entry.totalPayments)}
                  </span>
                </span>
                <span>
                  {t("finance.staffSummary.added")}:{" "}
                  <span className="font-medium text-red-600">
                    {formatCurrency(entry.totalExpenses)}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
