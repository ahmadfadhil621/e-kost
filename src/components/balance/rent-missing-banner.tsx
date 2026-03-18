"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface RentMissingBannerProps {
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
  if (res.status === 400) return null;
  if (!res.ok) throw new Error("Failed to fetch balance");
  return res.json();
}

export function RentMissingBanner({
  propertyId,
  tenantId,
}: RentMissingBannerProps) {
  const { t } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  const { data, isLoading } = useQuery({
    queryKey: ["balance", propertyId, tenantId],
    queryFn: () => fetchBalance(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  if (isLoading || !data || data.status === "paid") return null;

  const amount = formatCurrency(
    data.outstandingBalance,
    currencyLocale,
    currencyCode
  );

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-100"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
      <span className="text-sm font-medium">
        {t("balance.rentMissingBanner.message", { amount })}
      </span>
    </div>
  );
}
