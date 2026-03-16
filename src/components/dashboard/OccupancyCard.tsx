"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { OccupancyStats } from "@/domain/schemas/dashboard";

export interface OccupancyCardProps {
  occupancy: OccupancyStats | null;
  isLoading?: boolean;
}

export function OccupancyCard({
  occupancy,
  isLoading = false,
}: OccupancyCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="occupancy-card-skeleton">
        <CardHeader>
          <span className="text-muted-foreground text-sm">
            {t("dashboard.occupancy.title")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!occupancy) {
    return null;
  }

  const hasRooms = occupancy.totalRooms > 0;
  const total = occupancy.totalRooms || 1;
  const occupiedPercent = Math.min(100, Math.round((occupancy.occupied / total) * 100));
  const renovationPercent = Math.min(
    100 - occupiedPercent,
    Math.round((occupancy.underRenovation / total) * 100),
  );
  const availablePercent = Math.max(
    0,
    100 - occupiedPercent - renovationPercent,
  );

  return (
    <Card className="w-full" data-testid="occupancy-card">
      <CardHeader>
        <span className="text-muted-foreground text-sm">
          {t("dashboard.occupancy.title")}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tabular-nums text-foreground" aria-label={`${t("dashboard.occupancy.rate")} ${occupancy.occupancyRate}%`}>
          {occupancy.occupancyRate}%
        </p>
        <div
          className="flex h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="meter"
          aria-valuenow={occupancy.occupancyRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("dashboard.occupancy.title")}
        >
          {hasRooms && occupiedPercent > 0 && (
            <div
              className="h-full bg-status-occupied transition-all"
              data-testid="meter-segment-occupied"
              style={{ width: `${occupiedPercent}%` }}
            />
          )}
          {hasRooms && renovationPercent > 0 && (
            <div
              className="h-full bg-status-renovation transition-all"
              data-testid="meter-segment-renovation"
              style={{ width: `${renovationPercent}%` }}
            />
          )}
          {hasRooms && availablePercent > 0 && (
            <div
              className="h-full bg-status-available transition-all"
              data-testid="meter-segment-available"
              style={{ width: `${availablePercent}%` }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5 text-status-occupied-foreground">
            <span className="h-2 w-2 rounded-full bg-status-occupied" aria-hidden />
            {occupancy.occupied} {t("dashboard.occupancy.occupied")}
          </span>
          <span className="flex items-center gap-1.5 text-status-renovation-foreground">
            <span className="h-2 w-2 rounded-full bg-status-renovation" aria-hidden />
            {occupancy.underRenovation} {t("dashboard.occupancy.underRenovation")}
          </span>
          <span className="flex items-center gap-1.5 text-status-available-foreground">
            <span className="h-2 w-2 rounded-full bg-status-available" aria-hidden />
            {occupancy.available} {t("dashboard.occupancy.available")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
