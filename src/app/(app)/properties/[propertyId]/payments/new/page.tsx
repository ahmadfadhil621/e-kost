"use client";

import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PaymentForm } from "@/components/payment/payment-form";
import type { CreatePaymentInput } from "@/domain/schemas/payment";
import type { TenantOption } from "@/components/payment/payment-form";

type TenantRow = {
  id: string;
  name: string;
  roomId: string | null;
  movedOutAt: string | null;
};

type RoomRow = { id: string; roomNumber: string };

async function fetchTenants(propertyId: string): Promise<TenantRow[]> {
  const res = await fetch(`/api/properties/${propertyId}/tenants`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch tenants");
  }
  const data = await res.json();
  // #region agent log
  const _rawTenants = data.tenants;
  fetch("http://127.0.0.1:7266/ingest/aaf93920-0ed8-4918-8ed8-89e8713375fa", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c14ddc" },
    body: JSON.stringify({
      sessionId: "c14ddc",
      location: "payments/new/page.tsx:fetchTenants",
      message: "API response data.tenants",
      data: {
        hasTenants: "tenants" in data,
        typeOfTenants: typeof _rawTenants,
        isArray: Array.isArray(_rawTenants),
        constructorName: _rawTenants !== null && _rawTenants !== undefined && typeof _rawTenants === "object" ? ( _rawTenants as object).constructor?.name : String(_rawTenants),
        topLevelKeys: typeof data === "object" && data !== null ? Object.keys(data) : [],
      },
      timestamp: Date.now(),
      hypothesisId: "D",
    }),
  }).catch(() => {});
  // #endregion
  return data.tenants ?? [];
}

async function fetchRooms(propertyId: string): Promise<RoomRow[]> {
  const res = await fetch(`/api/properties/${propertyId}/rooms`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }
  const data = await res.json();
  return data.rooms ?? [];
}

export default function NewPaymentPage() {
  const { t } = useTranslation();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;

  const tenantsQuery = useQuery({
    queryKey: ["tenants", propertyId],
    queryFn: () => fetchTenants(propertyId),
    enabled: !!propertyId,
  });
  const tenantsData = tenantsQuery.data;
  const tenants = tenantsData ?? [];

  // #region agent log
  const _tenantsType = typeof tenants;
  const _tenantsIsArray = Array.isArray(tenants);
  const _tenantsConstructor = tenants !== null && tenants !== undefined ? (tenants as object).constructor?.name : "null/undefined";
  fetch("http://127.0.0.1:7266/ingest/aaf93920-0ed8-4918-8ed8-89e8713375fa", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c14ddc" },
    body: JSON.stringify({
      sessionId: "c14ddc",
      location: "payments/new/page.tsx:tenants",
      message: "tenants value before filter",
      data: {
        typeof: _tenantsType,
        isArray: _tenantsIsArray,
        constructorName: _tenantsConstructor,
        hasFilter: typeof (tenants as unknown as { filter?: unknown })?.filter,
        sampleKeys: tenants !== null && tenants !== undefined && typeof tenants === "object" && !Array.isArray(tenants) ? Object.keys(tenants as object).slice(0, 10) : undefined,
      },
      timestamp: Date.now(),
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => fetchRooms(propertyId),
    enabled: !!propertyId,
  });

  const tenantsList: TenantRow[] = Array.isArray(tenants) ? tenants : [];
  const activeTenants: TenantOption[] = tenantsList
    .filter((t: TenantRow) => t.roomId && !t.movedOutAt)
    .map((t: TenantRow) => ({
      id: t.id,
      name: t.name,
      roomNumber: rooms.find((r: RoomRow) => r.id === t.roomId)?.roomNumber,
    }));

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
      toast({ title: t("payment.create.success") });
      // Stay on form so success toast is visible (form clears for next entry)
    },
    onError: (err: Error) => {
      toast({
        title: t("payment.errors.loadFailed"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreatePaymentInput) => {
    createMutation.mutate(data);
  };

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
        onSubmit={handleSubmit}
        onSuccess={() => {}}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
