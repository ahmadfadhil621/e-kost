"use client";

import { useTranslation } from "react-i18next";
import type { ItemCondition } from "@/domain/schemas/room-inventory-item";

interface ConditionBadgeProps {
  condition: ItemCondition;
}

const conditionClassName: Record<ItemCondition, string> = {
  NEW: "bg-[hsl(var(--condition-new))] text-[hsl(var(--condition-new-foreground))]",
  GOOD: "bg-[hsl(var(--condition-good))] text-[hsl(var(--condition-good-foreground))]",
  FAIR: "bg-[hsl(var(--condition-fair))] text-[hsl(var(--condition-fair-foreground))]",
  POOR: "bg-[hsl(var(--condition-poor))] text-[hsl(var(--condition-poor-foreground))]",
  DAMAGED: "bg-[hsl(var(--condition-damaged))] text-[hsl(var(--condition-damaged-foreground))]",
};

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${conditionClassName[condition]}`}
    >
      {t(`condition.${condition}`)}
    </span>
  );
}
