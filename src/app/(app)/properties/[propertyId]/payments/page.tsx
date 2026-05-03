"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { PaymentList } from "@/components/payment/payment-list";
import type { Payment } from "@/domain/schemas/payment";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyInfo = { role: PropertyRole; staffOnlyFinance: boolean };

async function fetchProperty(propertyId: string): Promise<PropertyInfo> {
  const res = await fetch(`/api/properties/${propertyId}`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch property"); }
  return res.json() as Promise<PropertyInfo>;
}

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
  const { toast } = useToast();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const queryClient = useQueryClient();

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", propertyId],
    queryFn: () => fetchPayments(propertyId),
    enabled: !!propertyId,
  });

  const canMutateFinance = !(property?.staffOnlyFinance && property?.role === "owner");
  const hasPayments = payments.length > 0;

  async function handleExport() {
    try {
      const res = await fetch(`/api/properties/${propertyId}/payments/export`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: (body as { error?: string }).error ?? t("payment.export.errorToast"),
          variant: "destructive",
        });
        return;
      }
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "payments.xlsx";
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: t("payment.export.errorToast"), variant: "destructive" });
    }
  }

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
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-[44px] min-w-[44px]"
                    aria-label={t("payment.export.button")}
                    disabled={!hasPayments}
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              {!hasPayments && (
                <TooltipContent>
                  <p>{t("payment.export.disabledTooltip")}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {canMutateFinance && (
            <Button asChild className="min-h-[44px] min-w-[44px]">
              <Link href={`/properties/${propertyId}/payments/new`}>
                {t("payment.list.recordPayment")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <PaymentList
        payments={payments}
        isLoading={isLoading}
        onDeletePayment={canMutateFinance ? (paymentId) => deleteMutation.mutate(paymentId) : undefined}
        isDeletingPayment={deleteMutation.isPending}
      />
    </div>
  );
}
