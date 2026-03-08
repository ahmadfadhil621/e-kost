"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RecentPayment } from "@/domain/schemas/dashboard";

export interface RecentPaymentsListProps {
  payments: RecentPayment[];
  propertyId: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  isLoading?: boolean;
}

export function RecentPaymentsList({
  payments,
  propertyId,
  formatCurrency,
  formatDate,
  isLoading = false,
}: RecentPaymentsListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="w-full" data-testid="recent-payments-skeleton">
        <CardHeader>
          <span className="text-muted-foreground text-sm">
            {t("dashboard.recentPayments.title")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="recent-payments-list">
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("dashboard.recentPayments.title")}
        </span>
        <Link
          href={`/properties/${propertyId}/payments`}
          className="text-primary text-sm underline min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
        >
          {t("dashboard.recentPayments.viewAll")}
        </Link>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("dashboard.recentPayments.empty")}
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {payments.map((p) => (
              <li key={p.paymentId}>
                <Link
                  href={`/properties/${propertyId}/payments`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-between rounded-md border p-2 text-left hover:bg-muted"
                >
                  <span>{p.tenantName}</span>
                  <span className="text-sm tabular-nums">
                    {formatCurrency(p.amount)} — {formatDate(p.date)}
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
