"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "@/components/payment/payment-form";
import type { CreatePaymentInput } from "@/domain/schemas/payment";
import type { TenantOption, CycleOption } from "@/components/payment/payment-form";
import type { BillingCycleBreakdown } from "@/domain/schemas/billing-cycle";

type TenantRow = {
  id: string;
  name: string;
  roomId: string | null;
  movedOutAt: string | null;
};

type RoomRow = { id: string; roomNumber: string };

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

async function fetchTenants(propertyId: string): Promise<TenantRow[]> {
  const res = await fetch(`/api/properties/${propertyId}/tenants`, {
    credentials: "include",
  });
  if (!res.ok) { throw new Error("Failed to fetch tenants"); }
  const data = await res.json();
  return data.tenants ?? [];
}

async function fetchRooms(propertyId: string): Promise<RoomRow[]> {
  const res = await fetch(`/api/properties/${propertyId}/rooms`, {
    credentials: "include",
  });
  if (!res.ok) { throw new Error("Failed to fetch rooms"); }
  const data = await res.json();
  return data.rooms ?? [];
}

async function fetchBillingCycles(
  propertyId: string,
  tenantId: string
): Promise<BillingCycleBreakdown | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/billing-cycles`,
    { credentials: "include" }
  );
  if (!res.ok) { return null; }
  return res.json();
}

export default function NewPaymentPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;
  const defaultTenantId = searchParams.get("tenantId") ?? "";

  const { data: tenantsData = [] } = useQuery({
    queryKey: ["tenants", propertyId],
    queryFn: () => fetchTenants(propertyId),
    enabled: !!propertyId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => fetchRooms(propertyId),
    enabled: !!propertyId,
  });

  const { data: cycleBreakdown } = useQuery({
    queryKey: ["billing-cycles", propertyId, defaultTenantId],
    queryFn: () => fetchBillingCycles(propertyId, defaultTenantId),
    enabled: !!propertyId && !!defaultTenantId,
  });

  const activeTenants: TenantOption[] = tenantsData
    .filter((t: TenantRow) => t.roomId && !t.movedOutAt)
    .map((t: TenantRow) => ({
      id: t.id,
      name: t.name,
      roomNumber: rooms.find((r: RoomRow) => r.id === t.roomId)?.roomNumber,
    }));

  const availableCycles: CycleOption[] | undefined = cycleBreakdown
    ? cycleBreakdown.unpaidCycles.map((c) => ({
        year: c.year,
        month: c.month,
        label: `${MONTH_NAMES[c.month - 1]} ${c.year}`,
      }))
    : undefined;

  const defaultCycle = availableCycles?.[0];

  const createMutation = useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      const res = await fetch(`/api/properties/${propertyId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to record payment");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "tenant"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      queryClient.invalidateQueries({
        queryKey: ["balance", propertyId, variables.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["balances", propertyId] });
      queryClient.invalidateQueries({
        queryKey: ["billing-cycles", propertyId, variables.tenantId],
      });
      toast({ title: t("payment.create.success") });
    },
    onError: (err: Error) => {
      toast({
        title: t("payment.errors.loadFailed"),
        description: err.message,
        variant: "destructive",
      });
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
      <PaymentForm
        tenants={activeTenants}
        onSubmit={(data) => createMutation.mutate(data)}
        onSuccess={() => {}}
        isLoading={createMutation.isPending}
        defaultTenantId={defaultTenantId}
        availableCycles={availableCycles}
        defaultCycleYear={defaultCycle?.year}
        defaultCycleMonth={defaultCycle?.month}
      />
    </div>
  );
}
