"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentList } from "@/components/payment/payment-list";
import type { Payment } from "@/domain/schemas/payment";

async function fetchPayments(propertyId: string): Promise<Payment[]> {
  const res = await fetch(`/api/properties/${propertyId}/payments`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }
  const data = await res.json();
  return (data ?? []).map((p: { paymentDate: string; createdAt: string }) => ({
    ...p,
    paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  }));
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

export default function PaymentListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", propertyId],
    queryFn: () => fetchPayments(propertyId),
    enabled: !!propertyId,
  });

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => deletePayment(propertyId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", propertyId] });
    },
  });

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t("payment.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/payments/new`}>
            {t("payment.list.recordPayment")}
          </Link>
        </Button>
      </div>

      <PaymentList
        payments={payments}
        isLoading={isLoading}
        onDeletePayment={(paymentId) => deleteMutation.mutate(paymentId)}
        isDeletingPayment={deleteMutation.isPending}
      />
    </div>
  );
}
