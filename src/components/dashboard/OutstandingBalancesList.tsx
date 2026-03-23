"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [selectedBalance, setSelectedBalance] =
    useState<OutstandingBalance | null>(null);

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
          <p className="text-sm text-balance-paid" role="status">
            {t("dashboard.outstanding.allPaid")}
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {balances.map((b) => (
              <li key={b.tenantId}>
                <button
                  onClick={() => setSelectedBalance(b)}
                  className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-md border p-2 text-left hover:bg-accent"
                >
                  <span className="text-foreground">{b.tenantName}</span>
                  <span className="text-sm font-semibold text-balance-outstanding shrink-0">
                    {formatCurrency(b.balance)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={!!selectedBalance}
        onOpenChange={(open) => {
          if (!open) { setSelectedBalance(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBalance?.tenantName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              {t("dashboard.outstanding.detail.room")}:{" "}
              {selectedBalance?.roomNumber}
            </p>
            <p className="font-semibold text-balance-outstanding">
              {t("dashboard.outstanding.detail.owes")}:{" "}
              {selectedBalance ? formatCurrency(selectedBalance.balance) : ""}
            </p>
          </div>
          <DialogFooter>
            <Link
              href={
                selectedBalance
                  ? `/properties/${propertyId}/tenants/${selectedBalance.tenantId}`
                  : "#"
              }
              className="text-primary underline hover:underline"
              onClick={() => setSelectedBalance(null)}
            >
              {t("dashboard.outstanding.detail.viewTenant")}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
