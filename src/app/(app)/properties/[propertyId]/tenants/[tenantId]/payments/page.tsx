"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentList } from "@/components/payment/payment-list";
import type { Payment } from "@/domain/schemas/payment";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyInfo = { role: PropertyRole; staffOnlyFinance: boolean };

const PAGE_SIZE = 20;

async function fetchTenantPayments(
  propertyId: string,
  tenantId: string,
  page: number
): Promise<{ payments: Payment[]; count: number; totalPages: number }> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=${PAGE_SIZE}&page=${page}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }
  const data = await res.json();
  const payments = (data.payments ?? []).map(
    (p: { paymentDate: string; createdAt: string }) => ({
      ...p,
      paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    })
  );
  return {
    payments,
    count: data.count ?? 0,
    totalPages: data.totalPages ?? 1,
  };
}

async function fetchProperty(propertyId: string): Promise<PropertyInfo> {
  const res = await fetch(`/api/properties/${propertyId}`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch property"); }
  return res.json() as Promise<PropertyInfo>;
}

async function deletePayment(propertyId: string, paymentId: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/payments/${paymentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Failed to delete payment");
  }
}

export default function TenantPaymentHistoryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const propertyId = params.propertyId as string;
  const tenantId = params.tenantId as string;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-payments-history", propertyId, tenantId, page],
    queryFn: () => fetchTenantPayments(propertyId, tenantId, page),
    enabled: !!propertyId && !!tenantId,
  });

  const canMutateFinance = !(property?.staffOnlyFinance && property?.role === "owner");

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => deletePayment(propertyId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments-history", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "tenant", propertyId, tenantId] });
    },
  });

  const totalPages = data?.totalPages ?? 1;

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants/${tenantId}`}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">{t("payment.fullHistory.backToTenant")}</span>
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{t("payment.fullHistory.title")}</h1>
      </div>

      <PaymentList
        payments={data?.payments ?? []}
        isLoading={isLoading}
        onDeletePayment={canMutateFinance ? (paymentId) => deleteMutation.mutate(paymentId) : undefined}
        isDeletingPayment={deleteMutation.isPending}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="outline"
            className="min-h-[44px]"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            {t("payment.pagination.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("payment.pagination.pageOf", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            className="min-h-[44px]"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            {t("payment.pagination.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
