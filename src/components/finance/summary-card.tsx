"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type SummaryVariant = "income" | "expense" | "net" | "neutral";

export interface SummaryCardProps {
  label: string;
  amount: number;
  variant?: SummaryVariant;
  formatCurrency: (amount: number) => string;
}

export function SummaryCard({
  label,
  amount,
  variant = "neutral",
  formatCurrency,
}: SummaryCardProps) {
  const { t } = useTranslation();
  const formatted = formatCurrency(amount);
  const isPositive = variant === "net" && amount > 0;
  const isNegative = variant === "net" && amount < 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <span className="text-muted-foreground text-sm">{label}</span>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-semibold tabular-nums ${
            isPositive
              ? "text-[hsl(var(--status-available))]"
              : isNegative
                ? "text-[hsl(var(--status-occupied))]"
                : ""
          }`}
          aria-label={`${label} ${formatted}`}
        >
          {formatted}
        </p>
        {variant === "net" && amount > 0 && (
          <span className="text-sm text-[hsl(var(--status-available))]">
            {t("finance.positive")}
          </span>
        )}
        {variant === "net" && amount < 0 && (
          <span className="text-sm text-[hsl(var(--status-occupied))]">
            {t("finance.negative")}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
