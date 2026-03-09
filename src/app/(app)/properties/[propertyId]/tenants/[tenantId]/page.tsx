"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantPaymentSection } from "@/components/payment/tenant-payment-section";
import { BalanceSection } from "@/components/balance/balance-section";
import { NotesSection } from "@/components/notes/notes-section";
import type { Payment } from "@/domain/schemas/payment";

type TenantDetail = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  movedOutAt: string | null;
};

type RoomSummary = {
  id: string;
  roomNumber: string;
  status: string;
};

async function fetchTenant(
  propertyId: string,
  tenantId: string
): Promise<TenantDetail | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}`,
    { credentials: "include" }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch tenant");
  }
  return res.json();
}

async function fetchAvailableRooms(
  propertyId: string
): Promise<{ rooms: RoomSummary[] }> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms?status=available`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }
  return res.json();
}

async function fetchTenantPayments(
  propertyId: string,
  tenantId: string
): Promise<{ payments: Payment[]; count: number }> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/payments`,
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
  return { payments, count: data.count ?? payments.length };
}

export default function TenantDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyId = params.propertyId as string;
  const tenantId = params.tenantId as string;

  const [assignOpen, setAssignOpen] = useState(false);
  const [moveOutOpen, setMoveOutOpen] = useState(false);

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant", propertyId, tenantId],
    queryFn: () => fetchTenant(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const { data: availableRoomsData } = useQuery({
    queryKey: ["rooms", propertyId, "available"],
    queryFn: () => fetchAvailableRooms(propertyId),
    enabled: !!propertyId && assignOpen,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", "tenant", propertyId, tenantId],
    queryFn: () => fetchTenantPayments(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const assignMutation = useMutation({
    mutationFn: (roomId: string) =>
      fetch(`/api/properties/${propertyId}/tenants/${tenantId}/assign-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomId }),
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to assign room");
      }
      queryClient.invalidateQueries({ queryKey: ["tenant", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenants", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      toast({ title: t("tenant.assignRoom.success") });
      setAssignOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const moveOutMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/properties/${propertyId}/tenants/${tenantId}/move-out`, {
        method: "POST",
        credentials: "include",
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to move out");
      }
      queryClient.invalidateQueries({ queryKey: ["tenants", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["balances", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["tenant", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["payments", "tenant"] });
      toast({ title: t("tenant.moveOut.success") });
      setMoveOutOpen(false);
      router.push(`/properties/${propertyId}/tenants`);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !tenant) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading
            ? t("common.loading")
            : t("tenant.detail.notFound", "Tenant not found")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t("auth.error.generic")}</p>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => router.push(`/properties/${propertyId}/tenants`)}
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  if (tenant.movedOutAt) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">{t("tenant.detail.title")}</h2>
        <div className="space-y-2">
          <p className="font-medium">{tenant.name}</p>
          <p className="text-sm text-muted-foreground">
            {t("tenant.moveOut.success")}
          </p>
        </div>
        <Button asChild variant="ghost" className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants`}>
            {t("common.back")}
          </Link>
        </Button>
        <NotesSection
          propertyId={propertyId}
          tenantId={tenantId}
          readOnly
        />
      </div>
    );
  }

  const availableRooms = availableRoomsData?.rooms ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("tenant.detail.title")}</h2>

      <div className="space-y-2">
        <p>
          <span className="font-medium">{tenant.name}</span>
        </p>
        <p className="text-sm text-muted-foreground">{tenant.phone}</p>
        <p className="text-sm text-muted-foreground">{tenant.email}</p>
        <p className="text-sm text-muted-foreground">
          {tenant.roomId
            ? `${t("tenant.detail.room")}: ${tenant.roomId}`
            : t("tenant.detail.noRoom")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => setAssignOpen(true)}
          aria-label={t("tenant.detail.assignRoom")}
        >
          {t("tenant.detail.assignRoom")}
        </Button>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => setMoveOutOpen(true)}
          aria-label={t("tenant.detail.moveOut")}
        >
          {t("tenant.detail.moveOut")}
        </Button>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants/${tenantId}/edit`}>
            {t("tenant.detail.edit")}
          </Link>
        </Button>
        <Button asChild variant="ghost" className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants`}>
            {t("common.back")}
          </Link>
        </Button>
      </div>

      <BalanceSection propertyId={propertyId} tenantId={tenantId} />

      <TenantPaymentSection
        tenantId={tenantId}
        payments={paymentsData?.payments ?? []}
        count={paymentsData?.count ?? 0}
        isLoading={paymentsLoading}
      />

      <NotesSection propertyId={propertyId} tenantId={tenantId} />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tenant.assignRoom.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {availableRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("tenant.assignRoom.noAvailableRooms")}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {t("tenant.assignRoom.availableRooms")}
                </p>
                <div className="flex flex-col gap-2">
                  {availableRooms.map((room) => (
                    <Button
                      key={room.id}
                      variant="outline"
                      className="min-h-[44px] min-w-[44px] justify-start"
                      onClick={() => assignMutation.mutate(room.id)}
                      disabled={assignMutation.isPending}
                    >
                      {room.roomNumber}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setAssignOpen(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOutOpen} onOpenChange={setMoveOutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tenant.moveOut.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("tenant.moveOut.confirmMessage")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setMoveOutOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={() => moveOutMutation.mutate()}
              disabled={moveOutMutation.isPending}
            >
              {t("tenant.moveOut.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
