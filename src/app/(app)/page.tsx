"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { FinanceSummaryCard } from "@/components/dashboard/FinanceSummaryCard";
import { OutstandingBalancesList } from "@/components/dashboard/OutstandingBalancesList";
import { RecentPaymentsList } from "@/components/dashboard/RecentPaymentsList";
import type { RecentPayment } from "@/domain/schemas/dashboard";

type PropertyDetail = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
};

type DashboardResponse = {
  occupancy: { totalRooms: number; occupied: number; available: number; underRenovation: number; occupancyRate: number };
  finance: { month: number; year: number; income: number; expenses: number; netIncome: number };
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

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (properties.length === 0) {
      return;
    }
    if (!activeId && properties.length > 0) {
      router.replace("/properties");
      return;
    }
  }, [isLoading, properties.length, activeId, router]);

  if (properties.length === 0) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{property.name}</h2>
        <p className="text-sm text-muted-foreground">{property.address || "—"}</p>
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

      <div className="flex flex-col gap-2">
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${activeId}/rooms`}>{t("nav.rooms")}</Link>
        </Button>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${activeId}/tenants`}>{t("nav.tenants")}</Link>
        </Button>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${activeId}/payments`}>{t("nav.payments")}</Link>
        </Button>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${activeId}/finance`}>{t("nav.finance")}</Link>
        </Button>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/settings">{t("nav.settings")}</Link>
        </Button>
      </div>
    </div>
  );
}
