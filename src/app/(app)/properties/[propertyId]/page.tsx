"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyResponse = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: PropertyRole;
  staffOnlyFinance: boolean;
};

type DashboardStats = {
  occupancy: { totalRooms: number; occupied: number };
  outstandingCount: number;
};

async function fetchProperty(propertyId: string): Promise<PropertyResponse> {
  const res = await fetch(`/api/properties/${propertyId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Property not found");
  }
  return res.json() as Promise<PropertyResponse>;
}

async function fetchDashboardStats(propertyId: string): Promise<DashboardStats> {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load stats");
  }
  return res.json() as Promise<DashboardStats>;
}

function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery<PropertyResponse>({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["property-detail-stats", propertyId],
    queryFn: () => fetchDashboardStats(propertyId),
    enabled: !!propertyId,
  });

  if (isLoading) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center"
        role="status"
        aria-label={t("common.loading")}
      >
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">
          {t("property.detail.error.unavailable")}
        </p>
      </div>
    );
  }

  const totalRooms = stats?.occupancy?.totalRooms ?? 0;
  const tenants = stats?.occupancy?.occupied ?? 0;
  const outstanding = stats?.outstandingCount ?? 0;
  const isOwner = property.role === "owner";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-semibold leading-tight">{property.name}</h2>
            <Badge variant="secondary">
              {t(`property.role.${property.role}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground" data-testid="property-address">
            {property.address}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("property.detail.createdAt")}:{" "}
            {formatDate(property.createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="flex flex-col justify-center rounded-lg border border-border bg-card p-4"
          data-testid="stat-total-rooms"
        >
          <span className="text-2xl font-bold tabular-nums">{totalRooms}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.totalRooms")}
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-4">
          <span className="text-2xl font-bold tabular-nums">{tenants}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.tenants")}
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-4">
          <span className="text-2xl font-bold tabular-nums">{outstanding}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.outstanding")}
          </span>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "rooms", label: t("property.detail.nav.rooms") },
          { key: "tenants", label: t("property.detail.nav.tenants") },
          { key: "payments", label: t("property.detail.nav.payments") },
          { key: "finance", label: t("property.detail.nav.finance") },
          { key: "activity", label: t("property.detail.nav.activity") },
          ...(isOwner ? [{ key: "settings", label: t("property.detail.nav.settings") }] : []),
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/properties/${propertyId}/${key}`}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Map placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("common.actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              {t("property.detail.mapPlaceholder")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
