"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertCircle } from "lucide-react";

interface TenantBalanceBannerProps {
  propertyId: string;
  tenantId: string;
}

type BalanceResult = {
  tenantId: string;
  monthlyRent: number;
  totalPayments: number;
  outstandingBalance: number;
  status: "paid" | "unpaid";
};

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

async function fetchBalance(
  propertyId: string,
  tenantId: string
): Promise<BalanceResult | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/balance`,
    { credentials: "include" }
  );
  if (res.status === 400) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch balance");
  }
  return res.json();
}

export function TenantBalanceBanner({
  propertyId,
  tenantId,
}: TenantBalanceBannerProps) {
  const { t } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  const { data, isLoading } = useQuery({
    queryKey: ["balance", propertyId, tenantId],
    queryFn: () => fetchBalance(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  if (isLoading || data === null || data === undefined) {
    return null;
  }

  if (data.status === "paid") {
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-[hsl(var(--balance-paid))] px-4 py-3"
        role="status"
        aria-label={t("balance.banner.fullyPaid")}
      >
        <CheckCircle
          className="h-5 w-5 text-[hsl(var(--balance-paid-foreground))]"
          aria-hidden
        />
        <span className="text-sm font-medium text-[hsl(var(--balance-paid-foreground))]">
          {t("balance.banner.fullyPaid")}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--balance-outstanding))] px-4 py-3"
      role="alert"
      aria-label={t("balance.banner.outstanding")}
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          className="h-5 w-5 text-[hsl(var(--balance-outstanding-foreground))]"
          aria-hidden
        />
        <span className="text-sm font-medium text-[hsl(var(--balance-outstanding-foreground))]">
          {t("balance.banner.outstanding")}
        </span>
      </div>
      <span className="text-sm font-bold text-[hsl(var(--balance-outstanding-foreground))]">
        {formatCurrency(data.outstandingBalance, currencyLocale, currencyCode)}
      </span>
    </div>
  );
}
