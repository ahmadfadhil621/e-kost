"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type SummaryVariant = "income" | "expense" | "net" | "neutral";

export interface SummaryCardProps {
  label: string;
  amount: number;
  variant?: SummaryVariant;
  formatCurrency: (amount: number) => string;
  href?: string;
}

export function SummaryCard({
  label,
  amount,
  variant = "neutral",
  formatCurrency,
  href,
}: SummaryCardProps) {
  const { t } = useTranslation();
  const formatted = formatCurrency(amount);
  const isPositive = variant === "net" && amount > 0;
  const isNegative = variant === "net" && amount < 0;

  const card = (
    <Card className={`w-full transition-shadow ${href ? "hover:shadow-md hover:ring-2 hover:ring-primary/20 cursor-pointer" : ""}`}>
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <span className="text-muted-foreground text-sm">{label}</span>
        {href && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
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

  if (href) {
    return (
      <Link href={href} className="block min-h-[44px]">
        {card}
      </Link>
    );
  }

  return card;
}
