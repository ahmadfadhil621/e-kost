"use client";

import { useTranslation } from "react-i18next";
import type { RoomStatus } from "@/domain/schemas/room";
import { Button } from "@/components/ui/button";

export type StatusFilterValue = "all" | RoomStatus;

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts: {
    all: number;
    available: number;
    occupied: number;
    under_renovation: number;
  };
}

export function StatusFilter({ value, onChange, counts }: StatusFilterProps) {
  const { t } = useTranslation();

  const buttons: { value: StatusFilterValue; labelKey: string; count: number }[] = [
    { value: "all", labelKey: "room.list.filterAll", count: counts.all },
    { value: "available", labelKey: "room.list.filterAvailable", count: counts.available },
    { value: "occupied", labelKey: "room.list.filterOccupied", count: counts.occupied },
    { value: "under_renovation", labelKey: "room.list.filterRenovation", count: counts.under_renovation },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("common.filter")}>
      {buttons.map(({ value: v, labelKey, count }) => {
        const isActive = value === v;
        const label = t(labelKey);
        return (
          <Button
            key={v}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => onChange(v)}
            aria-pressed={isActive}
            aria-label={`${label} (${count})`}
          >
            {label} ({count})
          </Button>
        );
      })}
    </div>
  );
}
