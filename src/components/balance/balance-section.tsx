"use client";

import { useTranslation } from "react-i18next";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BalanceStatusIndicator } from "./balance-status-indicator";
import type { BillingCycleBreakdown, CycleStatus } from "@/domain/schemas/billing-cycle";

interface BalanceSectionProps {
  propertyId: string;
  tenantId: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatCycleLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

async function fetchBillingCycles(
  propertyId: string,
  tenantId: string
): Promise<BillingCycleBreakdown | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/billing-cycles`,
    { credentials: "include" }
  );
  if (res.status === 400) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch billing cycles");
  }
  return res.json();
}

function CycleStatusBadge({ status }: { status: CycleStatus["status"] }) {
  const { t } = useTranslation();
  const key =
    status === "partial"
      ? "billing.cycles.status.partial"
      : status === "unpaid"
      ? "billing.cycles.status.unpaid"
      : "billing.cycles.status.paid";
  const colorClass =
    status === "partial"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
      role="status"
    >
      {t(key)}
    </span>
  );
}

export function BalanceSection({ propertyId, tenantId }: BalanceSectionProps) {
  const { t } = useTranslation();
  const formatCurrency = useFormatCurrency();

  const { data, isLoading, error } = useQuery({
    queryKey: ["billing-cycles", propertyId, tenantId],
    queryFn: () => fetchBillingCycles(propertyId, tenantId),
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

  if (error || data === null || data === undefined) {
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
      {data.allPaid ? (
        <div className="flex flex-wrap items-center gap-2">
          <BalanceStatusIndicator status="paid" size="large" />
          <span className="text-sm text-muted-foreground">
            {t("billing.cycles.allPaid")}
          </span>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {data.unpaidCycles.map((cycle) => (
            <li key={`${cycle.year}-${cycle.month}`}>
              <Card className="w-full">
                <CardContent className="pt-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {formatCycleLabel(cycle.year, cycle.month)}
                    </span>
                    <CycleStatusBadge status={cycle.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {t("billing.cycles.amountOwed")}
                    </p>
                    <p className="font-semibold">{formatCurrency(cycle.amountOwed)}</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

