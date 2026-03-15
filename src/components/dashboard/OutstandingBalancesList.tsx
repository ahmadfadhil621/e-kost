"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { OutstandingBalance } from "@/domain/schemas/dashboard";

export interface OutstandingBalancesListProps {
  balances: OutstandingBalance[];
  totalCount: number;
  propertyId: string;
  formatCurrency: (amount: number) => string;
  isLoading?: boolean;
}

export function OutstandingBalancesList({
  balances,
  totalCount: _totalCount,
  propertyId,
  formatCurrency,
  isLoading = false,
}: OutstandingBalancesListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="outstanding-balances-skeleton">
        <CardHeader>
          <span className="text-muted-foreground text-sm">
            {t("dashboard.outstanding.title")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="outstanding-balances-list">
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("dashboard.outstanding.title")}
        </span>
        <Link
          href={`/properties/${propertyId}/tenants`}
          className="text-primary text-sm underline hover:underline min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
        >
          {t("dashboard.outstanding.viewAllTenants")}
        </Link>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <p
            className="text-sm text-balance-paid"
            role="status"
          >
            {t("dashboard.outstanding.allPaid")}
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {balances.map((b) => (
              <li key={b.tenantId}>
                <Link
                  href={`/properties/${propertyId}/tenants/${b.tenantId}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-between gap-2 rounded-md border p-2 text-left hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground">{b.tenantName}</span>
                    <span className="ml-1 text-sm text-muted-foreground">{b.roomNumber}</span>
                  </div>
                  <span className="text-sm font-semibold text-balance-outstanding shrink-0">
                    {formatCurrency(b.balance)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
