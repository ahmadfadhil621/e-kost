"use client";
// STUB for fault injection
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/common/search-input";

export type TenantFilterValue = "all" | "missing_rent";

interface TenantFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filter: TenantFilterValue;
  onFilterChange: (value: TenantFilterValue) => void;
  counts: { all: number; missing_rent: number };
  balancesLoading: boolean;
}

export function TenantFilterBar({
  searchValue, onSearchChange, filter, onFilterChange, counts, balancesLoading,
}: TenantFilterBarProps) {
  const { t } = useTranslation();

  const buttons: { value: TenantFilterValue; labelKey: string; count: number }[] = [
    { value: "all", labelKey: "tenant.list.filterAll", count: counts.all },
    { value: "missing_rent", labelKey: "tenant.list.filterMissingRent", count: counts.missing_rent },
  ];

  return (
    <div className="space-y-3">
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={t("tenant.list.searchPlaceholder")}
        ariaLabel={t("tenant.list.searchPlaceholder")}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("common.filter")}>
        {buttons.map(({ value: v, labelKey, count }) => {
          const isActive = filter === v;
          const label = t(labelKey);
          return (
            <Button
              key={v}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => onFilterChange(v)}
              aria-pressed={isActive}
              aria-label={`${label} (${count})`}
              disabled={v === "missing_rent" && balancesLoading}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>
    </div>
  );
}
