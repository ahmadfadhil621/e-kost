"use client";

import { useTranslation } from "react-i18next";
import type { Payment } from "@/domain/schemas/payment";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";

interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
  onSelectPayment?: (payment: Payment) => void;
}

function formatCurrency(amount: number, locale: string, currencyCode: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PaymentList({
  payments,
  isLoading = false,
  onSelectPayment,
}: PaymentListProps) {
  const { t } = useTranslation();
  const currencyCode = t("currency.code");
  const currencyLocale = t("currency.locale");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{t("payment.list.empty")}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0">
      {payments.map((payment) => (
        <li key={payment.id}>
          <Card
            className="w-full"
            role={onSelectPayment ? "button" : undefined}
            onClick={() => onSelectPayment?.(payment)}
          >
            <CardHeader className="pb-2">
              <span className="text-sm font-medium">{payment.tenantName}</span>
            </CardHeader>
            <CardContent className="space-y-1">
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
  );
}
