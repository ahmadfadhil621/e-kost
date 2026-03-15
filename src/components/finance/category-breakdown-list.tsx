"use client";

import { useTranslation } from "react-i18next";
import type { CategoryBreakdown as CategoryBreakdownType } from "@/domain/schemas/expense";

export interface CategoryBreakdownListProps {
  categories: CategoryBreakdownType[];
  totalExpenses: number;
  formatCurrency: (amount: number) => string;
}

export function CategoryBreakdownList({
  categories,
  totalExpenses,
  formatCurrency,
}: CategoryBreakdownListProps) {
  const { t } = useTranslation();

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("expense.list.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-2" aria-label={t("finance.categoryBreakdown")}>
      {categories.map((item) => {
        const percentage =
          totalExpenses > 0
            ? Math.round((item.total / totalExpenses) * 100)
            : 0;
        const labelKey = `expense.category.${item.category}`;
        return (
          <li
            key={item.category}
            className="flex items-center justify-between gap-2 border-b pb-2 last:border-0"
          >
            <span className="text-foreground">
              {t(labelKey)} ({item.count})
            </span>
            <div className="text-right">
              <span className="font-medium tabular-nums">
                {formatCurrency(item.total)}
              </span>
              <span className="ml-1 text-muted-foreground text-sm">
                ({percentage}%)
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
