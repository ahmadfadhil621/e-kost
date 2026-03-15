"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MonthSelectorProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthSelector({
  year,
  month,
  onPrevious,
  onNext,
}: MonthSelectorProps) {
  const { t, i18n } = useTranslation();
  const date = new Date(year, month - 1, 1);
  const monthYearLabel = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onPrevious}
        aria-label={t("finance.previousMonth")}
        className="min-h-[44px] min-w-[44px]"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="text-lg font-medium" aria-live="polite">
        {monthYearLabel}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onNext}
        aria-label={t("finance.nextMonth")}
        className="min-h-[44px] min-w-[44px]"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
