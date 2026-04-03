"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import type { Payment } from "@/domain/schemas/payment";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TenantPaymentSectionProps {
  tenantId: string;
  propertyId: string;
  payments: Payment[];
  count: number;
  isLoading?: boolean;
  isMovedOut?: boolean;
}


export function TenantPaymentSection({
  tenantId,
  propertyId,
  payments,
  count,
  isLoading = false,
  isMovedOut = false,
}: TenantPaymentSectionProps) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const displayedPayments = payments.slice(0, 3);

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 id="tenant-payments-heading" className="text-lg font-semibold">
          {t("payment.tenantSection.title")}
        </h2>
        {!isMovedOut && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="min-h-[44px] min-w-[44px] shrink-0"
          >
            <Link href={`/properties/${propertyId}/payments/new?tenantId=${tenantId}`}>
              {t("payment.list.recordPayment")}
            </Link>
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {t("payment.tenantSection.count", { count })}
      </p>
      {displayedPayments.length === 0 ? (
        <p className="text-muted-foreground">
          {t("payment.tenantSection.empty")}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {displayedPayments.map((payment) => (
              <li key={payment.id} data-payment-id={payment.id}>
                <Card className="w-full">
                  <CardContent className="pt-4 space-y-1">
                    <p className="text-lg font-semibold">
                      {formatCurrency(payment.amount)}
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
                    {payment.note && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        {payment.note}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {count > 3 && (
            <Link
              href={`/properties/${propertyId}/tenants/${tenantId}/payments`}
              className="mt-3 flex items-center text-sm text-primary underline hover:underline min-h-[44px]"
            >
              {t("payment.tenantSection.viewAll")}
            </Link>
          )}
        </>
      )}
    </section>
  );
}
