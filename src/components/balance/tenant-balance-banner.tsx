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

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TenantBalanceBanner({
  propertyId,
  tenantId,
}: TenantBalanceBannerProps) {
  const { t } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  const { data, isLoading, error } = useQuery({
    queryKey: ["balance", propertyId, tenantId],
    queryFn: () => fetchBalance(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  if (isLoading || error || data === null || data === undefined) {
    return null;
  }

  if (data.status === "paid") {
    return (
      <div
        data-testid="tenant-balance-banner"
        className="flex items-center gap-2 rounded-lg px-4 py-3 bg-[hsl(var(--balance-paid))] text-[hsl(var(--balance-paid-foreground))]"
        role="status"
        aria-label={t("balance.banner.fullyPaid")}
      >
        <CheckCircle className="w-5 h-5 shrink-0" aria-hidden />
        <span className="text-sm font-medium">
          {t("balance.banner.fullyPaid")}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="tenant-balance-banner"
      className="flex items-center gap-2 rounded-lg px-4 py-3 bg-[hsl(var(--balance-outstanding))] text-[hsl(var(--balance-outstanding-foreground))]"
      role="alert"
      aria-label={t("balance.banner.outstanding", {
        amount: formatCurrency(
          data.outstandingBalance,
          currencyLocale,
          currencyCode
        ),
      })}
    >
      <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
      <span className="text-sm font-medium">
        {t("balance.banner.outstanding", {
          amount: formatCurrency(
            data.outstandingBalance,
            currencyLocale,
            currencyCode
          ),
        })}
      </span>
    </div>
  );
}
