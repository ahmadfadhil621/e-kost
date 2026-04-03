"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BalanceStatusIndicator } from "@/components/balance/balance-status-indicator";
import { TenantFilterBar, type TenantFilterValue } from "@/components/tenant/tenant-filter-bar";
import { useDebounce } from "@/hooks/use-debounce";

type TenantSummary = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  roomNumber: string | null;
  assignedAt: string | null;
};

type BalanceItem = {
  tenantId: string;
  outstandingBalance: number;
  status: "paid" | "unpaid";
};

async function fetchTenants(propertyId: string): Promise<{ tenants: TenantSummary[]; count: number }> {
  const res = await fetch(`/api/properties/${propertyId}/tenants`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch tenants"); }
  return res.json();
}

async function fetchBalances(propertyId: string): Promise<{ balances: BalanceItem[] }> {
  const res = await fetch(`/api/properties/${propertyId}/balances`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch balances"); }
  return res.json();
}


export default function TenantListPage() {
  const { t, i18n } = useTranslation();
  const formatCurrency = useFormatCurrency();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TenantFilterValue>("all");
  const debouncedSearch = useDebounce(search, 0); // 0ms for test speed

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tenants", propertyId],
    queryFn: () => fetchTenants(propertyId),
    enabled: !!propertyId,
    retry: false,
  });

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["balances", propertyId],
    queryFn: () => fetchBalances(propertyId),
    enabled: !!propertyId && (data?.tenants?.length ?? 0) > 0,
  });

  const tenants = useMemo(() => data?.tenants ?? [], [data?.tenants]);
  const balancesMap = useMemo(
    () => new Map((balancesData?.balances ?? []).map((b) => [b.tenantId, b])),
    [balancesData?.balances]
  );

  const filteredTenants = useMemo(() => {
    let result = tenants;
    // correct logic restored
    if (filter === "missing_rent") {
      result = result.filter((t) => balancesMap.get(t.id)?.status === "unpaid");
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tenants, balancesMap, filter, debouncedSearch]);

  const filterCounts = useMemo(() => ({
    all: tenants.length,
    missing_rent: tenants.filter((t) => balancesMap.get(t.id)?.status === "unpaid").length,
  }), [tenants, balancesMap]);

  if (!propertyId) { return <div><p>{t("common.loading")}</p></div>; }
  if (isLoading) { return <div><p>{t("common.loading")}</p></div>; }
  if (isError) { return <div><p role="alert">{t("property.errors.notFound")}</p></div>; }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t("tenant.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants/new`}>{t("tenant.list.addTenant")}</Link>
        </Button>
      </div>

      {tenants.length > 0 && (
        <TenantFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
          balancesLoading={balancesLoading}
        />
      )}

      {tenants.length === 0 ? (
        <p className="text-muted-foreground">{t("tenant.list.empty")}</p>
      ) : filteredTenants.length === 0 ? (
        <p className="text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredTenants.map((tenant) => (
            <li key={tenant.id}>
              <Link href={`/properties/${propertyId}/tenants/${tenant.id}`} className="block">
                <Card className="min-h-[44px] transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <span className="font-medium">{tenant.name}</span>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                    <p className="text-sm text-muted-foreground">{tenant.email}</p>
                    {tenant.roomId && tenant.roomNumber && (
                      <p className="text-sm text-muted-foreground">
                        {t("tenant.detail.room")} {tenant.roomNumber}
                        {tenant.assignedAt && (
                          <> &middot; {t("tenant.detail.since", {
                            date: new Intl.DateTimeFormat(i18n.language, {
                              month: "long",
                              year: "numeric",
                            }).format(new Date(tenant.assignedAt)),
                          })}</>
                        )}
                      </p>
                    )}
                    {balancesMap.has(tenant.id) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm font-medium">
                          {formatCurrency(balancesMap.get(tenant.id)!.outstandingBalance)}
                        </span>
                        <BalanceStatusIndicator status={balancesMap.get(tenant.id)!.status} size="small" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
