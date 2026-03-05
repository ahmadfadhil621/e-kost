"use client";

import { useTranslation } from "react-i18next";
import type { Payment } from "@/domain/schemas/payment";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";

interface TenantPaymentSectionProps {
  tenantId: string;
  payments: Payment[];
  count: number;
  isLoading?: boolean;
}

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TenantPaymentSection({
  tenantId: _tenantId,
  payments,
  count,
  isLoading = false,
}: TenantPaymentSectionProps) {
  const { t, i18n } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  if (isLoading) {
    return (
      <section aria-labelledby="tenant-payments-heading">
        <h2 id="tenant-payments-heading" className="text-lg font-semibold mb-2">
          {t("payment.tenantSection.title")}
        </h2>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="tenant-payments-heading">
      <h2 id="tenant-payments-heading" className="text-lg font-semibold mb-2">
        {t("payment.tenantSection.title")}
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        {t("payment.tenantSection.count", { count })}
      </p>
      {payments.length === 0 ? (
        <p className="text-muted-foreground">
          {t("payment.tenantSection.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {payments.map((payment) => (
            <li key={payment.id}>
              <Card className="w-full">
                <CardContent className="pt-4 space-y-1">
                  <p className="text-lg font-semibold">
                    {formatCurrency(
                      payment.amount,
                      currencyLocale,
                      currencyCode
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("payment.list.date")}:{" "}
                    {format(
                      payment.paymentDate instanceof Date
                        ? payment.paymentDate
                        : new Date(payment.paymentDate),
                      "PPP"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("payment.list.recorded")}:{" "}
                    {format(
                      payment.createdAt instanceof Date
                        ? payment.createdAt
                        : new Date(payment.createdAt),
                      "PPp"
                    )}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
