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

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", propertyId],
    queryFn: () => fetchTenants(propertyId),
    enabled: !!propertyId,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => fetchRooms(propertyId),
    enabled: !!propertyId,
  });

  const activeTenants: TenantOption[] = tenants
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "tenant"] });
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
