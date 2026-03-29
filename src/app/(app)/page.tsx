"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { FinanceSummaryCard } from "@/components/dashboard/FinanceSummaryCard";
import { OutstandingBalancesList } from "@/components/dashboard/OutstandingBalancesList";
import { RecentPaymentsList } from "@/components/dashboard/RecentPaymentsList";
import type { RecentPayment, FinanceSummarySnapshot } from "@/domain/schemas/dashboard";

type PropertyDetail = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
};

type DashboardResponse = {
  occupancy: { totalRooms: number; occupied: number; available: number; underRenovation: number; occupancyRate: number };
  finance: FinanceSummarySnapshot;
  outstandingBalances: Array<{ tenantId: string; tenantName: string; roomNumber: string; balance: number }>;
  outstandingCount: number;
  recentPayments: Array<{ paymentId: string; tenantName: string; amount: number; date: string }>;
};

async function fetchDashboard(propertyId: string): Promise<DashboardResponse> {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Failed to load dashboard");
  }
  return res.json();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = usePropertyContext();
  const formatCurrency = useFormatCurrency();
  const [property, setProperty] = useState<PropertyDetail | null>(null);

  const activeId = ctx?.activePropertyId ?? null;
  const properties = ctx?.properties ?? [];
  const isLoading = ctx?.isLoading ?? true;

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["dashboard", activeId],
    queryFn: () => (activeId ? fetchDashboard(activeId) : Promise.reject(new Error("No property"))),
    enabled: !!activeId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!isLoading && properties.length > 0 && !activeId) {
      router.replace("/properties");
    }
  }, [isLoading, properties.length, activeId, router]);

  useEffect(() => {
    if (!activeId) {
      return;
    }
    (async () => {
      try {
        const propRes = await fetch(`/api/properties/${activeId}`, {
          credentials: "include",
        });
        if (propRes.ok) {
          const p = await propRes.json();
          setProperty(p);
        } else {
          setProperty(null);
        }
      } catch {
        setProperty(null);
      }
    })();
  }, [activeId]);

  if (!isLoading && properties.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("nav.dashboard")}</h2>
        <p className="text-muted-foreground">{t("property.list.empty")}</p>
        {isLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!activeId) {
    return null;
  }

  if (!property) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{property.name}</h2>
        <p className="text-sm text-muted-foreground">{t("dashboard.error")}</p>
        <Button
          onClick={() => refetchDashboard()}
          className="min-h-[44px] min-w-[44px]"
        >
          {t("dashboard.retry")}
        </Button>
      </div>
    );
  }

  const recentPaymentsWithDates: RecentPayment[] =
    dashboardData?.recentPayments?.map((p) => ({
      ...p,
      date: typeof p.date === "string" ? new Date(p.date) : p.date,
    })) ?? [];

  const occupancy = dashboardData?.occupancy;
  const finance = dashboardData?.finance;
  const tenantCount = occupancy?.occupied ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{property.name}</h2>
        <Link
          href={`/properties/${activeId}`}
          className="inline-flex items-center py-1 text-xs text-primary underline-offset-2 hover:underline"
        >
          {t("property.detail.propertyInfo")} →
        </Link>
      </div>

      {dashboardLoading && (
        <p className="text-sm text-muted-foreground" role="status">
          {t("dashboard.loading")}
        </p>
      )}

      <OccupancyCard
        occupancy={dashboardData?.occupancy ?? null}
        isLoading={dashboardLoading}
      />
      <FinanceSummaryCard
        finance={dashboardData?.finance ?? null}
        formatCurrency={formatCurrency}
        isLoading={dashboardLoading}
      />
      <OutstandingBalancesList
        balances={dashboardData?.outstandingBalances ?? []}
        totalCount={dashboardData?.outstandingCount ?? 0}
        propertyId={activeId}
        formatCurrency={formatCurrency}
        isLoading={dashboardLoading}
      />
      <RecentPaymentsList
        payments={recentPaymentsWithDates}
        propertyId={activeId}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        isLoading={dashboardLoading}
      />

      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/properties/${activeId}/rooms`}
          className="flex min-h-[44px] flex-col justify-center rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {occupancy?.totalRooms ?? "—"}
          </span>
          <span className="text-xs text-muted-foreground">{t("dashboard.quickStats.rooms")}</span>
        </Link>
        <Link
          href={`/properties/${activeId}/tenants`}
          className="flex min-h-[44px] flex-col justify-center rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {tenantCount}
          </span>
          <span className="text-xs text-muted-foreground">{t("dashboard.quickStats.tenants")}</span>
        </Link>
        <Link
          href={`/properties/${activeId}/finance`}
          className="flex min-h-[44px] flex-col justify-center rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <span
            className={`text-lg font-bold tabular-nums ${
              (finance?.netIncome ?? 0) >= 0 ? "text-finance-profit-positive" : "text-finance-profit-negative"
            }`}
          >
            {finance !== undefined && finance !== null ? formatCurrency(finance.netIncome) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{t("dashboard.quickStats.netProfit")}</span>
        </Link>
      </div>
    </div>
  );
}
