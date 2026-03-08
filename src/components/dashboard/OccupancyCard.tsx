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

  return (
    <Card className="w-full" data-testid="occupancy-card">
      <CardHeader>
        <span className="text-muted-foreground text-sm">
          {t("dashboard.occupancy.title")}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold tabular-nums" aria-label={`${t("dashboard.occupancy.rate")} ${occupancy.occupancyRate}%`}>
          {occupancy.occupancyRate}%
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.occupancy.totalRooms")}: {occupancy.totalRooms}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.occupancy.occupied")}: {occupancy.occupied}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.occupancy.available")}: {occupancy.available}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.occupancy.underRenovation")}: {occupancy.underRenovation}
        </p>
      </CardContent>
    </Card>
  );
}
