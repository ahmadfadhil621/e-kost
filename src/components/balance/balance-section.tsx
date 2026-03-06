"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BalanceStatusIndicator } from "./balance-status-indicator";

interface BalanceSectionProps {
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

export function BalanceSection({ propertyId, tenantId }: BalanceSectionProps) {
  const { t } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  const { data, isLoading, error } = useQuery({
    queryKey: ["balance", propertyId, tenantId],
    queryFn: () => fetchBalance(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  if (isLoading) {
    return (
      <section aria-labelledby="balance-heading">
        <h2 id="balance-heading" className="text-lg font-semibold mb-2">
          {t("balance.sectionTitle")}
        </h2>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </section>
    );
  }

  if (error || data === null) {
    return (
      <section aria-labelledby="balance-heading">
        <h2 id="balance-heading" className="text-lg font-semibold mb-2">
          {t("balance.sectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {data === null ? t("balance.noRoom") : t("balance.loadFailed")}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="balance-heading">
      <h2 id="balance-heading" className="text-lg font-semibold mb-2">
        {t("balance.sectionTitle")}
      </h2>
      <Card className="w-full">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <BalanceStatusIndicator status={data.status} size="large" />
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">
                {t("balance.monthlyRent")}
              </dt>
              <dd className="font-medium">
                {formatCurrency(
                  data.monthlyRent,
                  currencyLocale,
                  currencyCode
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">
                {t("balance.totalPayments")}
              </dt>
              <dd className="font-medium">
                {formatCurrency(
                  data.totalPayments,
                  currencyLocale,
                  currencyCode
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">
                {t("balance.outstanding")}
              </dt>
              <dd className="font-medium">
                {formatCurrency(
                  data.outstandingBalance,
                  currencyLocale,
                  currencyCode
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
}
