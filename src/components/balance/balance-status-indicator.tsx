"use client";

import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle } from "lucide-react";

export type BalanceStatus = "paid" | "unpaid";

interface BalanceStatusIndicatorProps {
  status: BalanceStatus;
  size?: "small" | "large";
}

const statusConfig: Record<
  BalanceStatus,
  { icon: typeof CheckCircle; labelKey: string; className: string }
> = {
  paid: {
    icon: CheckCircle,
    labelKey: "balance.status.paid",
    className:
      "bg-[hsl(var(--balance-paid))] text-[hsl(var(--balance-paid-foreground))]",
  },
  unpaid: {
    icon: AlertCircle,
    labelKey: "balance.status.unpaid",
    className:
      "bg-[hsl(var(--balance-outstanding))] text-[hsl(var(--balance-outstanding-foreground))]",
  },
};

export function BalanceStatusIndicator({
  status,
  size = "small",
}: BalanceStatusIndicatorProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const Icon = config.icon;
  const isLarge = size === "large";
  const iconSize = isLarge ? "w-5 h-5" : "w-4 h-4";
  const textSize = isLarge ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${config.className} ${textSize}`}
      role="status"
      aria-label={t(config.labelKey)}
    >
      <Icon className={iconSize} aria-hidden />
      <span>{t(config.labelKey)}</span>
    </span>
  );
}
