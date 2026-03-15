"use client";

import { useTranslation } from "react-i18next";
import { CheckCircle, User, Wrench } from "lucide-react";
import type { RoomStatus } from "@/domain/schemas/room";

interface StatusIndicatorProps {
  status: RoomStatus;
  size?: "small" | "large";
}

const statusConfig: Record<
  RoomStatus,
  { icon: typeof CheckCircle; labelKey: string; className: string }
> = {
  available: {
    icon: CheckCircle,
    labelKey: "room.status.available",
    className: "bg-[hsl(var(--status-available))] text-[hsl(var(--status-available-foreground))]",
  },
  occupied: {
    icon: User,
    labelKey: "room.status.occupied",
    className: "bg-[hsl(var(--status-occupied))] text-[hsl(var(--status-occupied-foreground))]",
  },
  under_renovation: {
    icon: Wrench,
    labelKey: "room.status.under_renovation",
    className: "bg-[hsl(var(--status-renovation))] text-[hsl(var(--status-renovation-foreground))]",
  },
};

export function StatusIndicator({ status, size = "small" }: StatusIndicatorProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  const Icon = config.icon;
  const isLarge = size === "large";
  const iconSize = isLarge ? "w-5 h-5" : "w-4 h-4";
  const textSize = isLarge ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium min-h-[44px] min-w-[44px] ${config.className} ${textSize}`}
      role="status"
      aria-label={t(config.labelKey)}
    >
      <Icon className={iconSize} aria-hidden />
      <span>{t(config.labelKey)}</span>
    </span>
  );
}
