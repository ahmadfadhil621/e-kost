"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantPaymentSection } from "@/components/payment/tenant-payment-section";
import { BalanceSection } from "@/components/balance/balance-section";
import { RentMissingBanner } from "@/components/balance/rent-missing-banner";
import { NotesSection } from "@/components/notes/notes-section";
import type { Payment } from "@/domain/schemas/payment";

type TenantDetail = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  roomNumber: string | null;
  assignedAt: string | null;
  billingDayOfMonth: number | null;
  createdAt: string;
  updatedAt: string;
  movedOutAt: string | null;
};

type RoomSummary = {
  id: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  capacity: number;
  activeTenantCount: number;
  status: string;
};

type RoomAssignmentEntry = {
  id: string;
  tenantId: string;
  roomId: string;
  roomNumber: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
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

async function fetchRoomsWithCapacity(
  propertyId: string
): Promise<{ rooms: RoomSummary[] }> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms?hasCapacity=true`,
    { credentials: "include" }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }
  return res.json();
}

async function fetchRoomAssignments(
  propertyId: string,
  tenantId: string
): Promise<RoomAssignmentEntry[]> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`,
    { credentials: "include" }
  );
  if (!res.ok) {
    return [];
  }
  const body = await res.json();
  return body.data ?? [];
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

type DialogMode = "assign" | "move" | null;

export default function TenantDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyId = params.propertyId as string;
  const tenantId = params.tenantId as string;

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [moveDate, setMoveDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [billingDay, setBillingDay] = useState<number>(new Date().getDate());

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant", propertyId, tenantId],
    queryFn: () => fetchTenant(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms", propertyId, "withCapacity"],
    queryFn: () => fetchRoomsWithCapacity(propertyId),
    enabled: !!propertyId && !!dialogMode,
  });

  const { data: roomHistory } = useQuery({
    queryKey: ["room-assignments", propertyId, tenantId],
    queryFn: () => fetchRoomAssignments(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", "tenant", propertyId, tenantId],
    queryFn: () => fetchTenantPayments(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const moveMutation = useMutation({
    mutationFn: (body: {
      targetRoomId: string;
      moveDate: string;
      billingDayOfMonth?: number;
    }) =>
      fetch(`/api/properties/${propertyId}/tenants/${tenantId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to move tenant");
      }
      queryClient.invalidateQueries({ queryKey: ["tenant", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenants", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["billing-cycles", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["room-assignments", propertyId, tenantId] });
      toast({
        title:
          dialogMode === "assign"
            ? t("tenant.assignRoom.success")
            : t("tenant.moveRoom.success"),
      });
      setDialogMode(null);
      setSelectedRoomId("");
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
      router.back();
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
        {roomHistory && roomHistory.length > 0 && (
          <RoomHistorySection history={roomHistory} t={t} i18n={i18n} />
        )}
        <NotesSection
          propertyId={propertyId}
          tenantId={tenantId}
          readOnly
        />
      </div>
    );
  }

  // Rooms available for selection: exclude current room in move mode
  const allRoomsWithCapacity = roomsData?.rooms ?? [];
  const selectableRooms =
    dialogMode === "move"
      ? allRoomsWithCapacity.filter((r) => r.id !== tenant.roomId)
      : allRoomsWithCapacity;

  const handleMoveSubmit = () => {
    if (!selectedRoomId) {return;}
    const body: { targetRoomId: string; moveDate: string; billingDayOfMonth?: number } = {
      targetRoomId: selectedRoomId,
      moveDate,
    };
    if (dialogMode === "assign") {
      body.billingDayOfMonth = billingDay;
    }
    moveMutation.mutate(body);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("tenant.detail.title")}</h2>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="min-h-[44px] min-w-[44px] shrink-0"
        >
          <Link href={`/properties/${propertyId}/tenants/${tenantId}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t("tenant.detail.edit")}
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <p>
          <span className="font-medium">{tenant.name}</span>
        </p>
        <p className="text-sm text-muted-foreground">{tenant.phone}</p>
        <p className="text-sm text-muted-foreground">{tenant.email}</p>
        <p className="text-sm text-muted-foreground">
          {tenant.roomId
            ? [
                `${t("tenant.detail.room")}: ${tenant.roomNumber ?? tenant.roomId}`,
                tenant.assignedAt
                  ? t("tenant.detail.since", {
                      date: new Intl.DateTimeFormat(i18n.language, {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(tenant.assignedAt)),
                    })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : t("tenant.detail.noRoom")}
        </p>
      </div>

      <BalanceSection propertyId={propertyId} tenantId={tenantId} />

      <RentMissingBanner propertyId={propertyId} tenantId={tenantId} />

      <div className="flex flex-col gap-2">
        {tenant.roomId ? (
          <Button
            variant="outline"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              setSelectedRoomId("");
              setMoveDate(new Date().toISOString().slice(0, 10));
              setDialogMode("move");
            }}
            aria-label={t("tenant.detail.moveToRoom")}
          >
            {t("tenant.detail.moveToRoom")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              setSelectedRoomId("");
              setBillingDay(new Date().getDate());
              setDialogMode("assign");
            }}
            aria-label={t("tenant.detail.assignRoom")}
          >
            {t("tenant.detail.assignRoom")}
          </Button>
        )}
      </div>

      {roomHistory && roomHistory.length > 0 && (
        <RoomHistorySection history={roomHistory} t={t} i18n={i18n} />
      )}

      <TenantPaymentSection
        tenantId={tenantId}
        propertyId={propertyId}
        payments={paymentsData?.payments ?? []}
        count={paymentsData?.count ?? 0}
        isLoading={paymentsLoading}
        isMovedOut={!!tenant.movedOutAt}
      />

      <NotesSection propertyId={propertyId} tenantId={tenantId} />

      {/* Destructive actions at bottom */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-destructive">
          {t("tenant.dangerZone")}
        </h3>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px] w-full"
          onClick={() => setMoveOutOpen(true)}
          aria-label={t("tenant.detail.moveOut")}
        >
          {t("tenant.detail.moveOut")}
        </Button>
      </div>

      {/* Assign Room / Move to Room dialog */}
      <Dialog
        open={!!dialogMode}
        onOpenChange={(open) => {
          if (!open) {setDialogMode(null);}
        }}
      >
        <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "assign"
                ? t("tenant.assignRoom.title")
                : t("tenant.moveRoom.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Room selector — inline listbox so room names are always visible */}
            <div className="space-y-1">
              <Label>{t("tenant.assignRoom.selectRoom")}</Label>
              <div
                role="combobox"
                aria-expanded="true"
                aria-haspopup="listbox"
                aria-controls="room-listbox"
                tabIndex={0}
                className="text-sm text-muted-foreground px-2 py-1 border rounded-md"
              >
                {selectableRooms.find((r) => r.id === selectedRoomId)?.roomNumber ??
                  t("tenant.assignRoom.selectRoom")}
              </div>
              <ul
                id="room-listbox"
                role="listbox"
                className="max-h-48 overflow-y-auto border rounded-md divide-y"
              >
                {selectableRooms.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    {t("tenant.assignRoom.noRoomsWithCapacity")}
                  </li>
                ) : (
                  selectableRooms.map((room) => {
                    const slotsLeft = room.capacity - room.activeTenantCount;
                    return (
                      <li
                        key={room.id}
                        role="option"
                        aria-selected={selectedRoomId === room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`cursor-pointer flex items-center justify-between px-3 py-2 text-sm min-h-[44px] ${
                          selectedRoomId === room.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span>{room.roomNumber}</span>
                        <span className="text-xs opacity-70">
                          {t("tenant.assignRoom.slotsRemaining", { count: slotsLeft })}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Move-in date — only in assign mode */}
            {dialogMode === "assign" && (
              <div className="space-y-1">
                <Label htmlFor="moveInDate">{t("tenant.assignRoom.moveInDate")}</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {t("tenant.assignRoom.moveInDateHint")}
                </p>
              </div>
            )}

            {/* Move date — only in move mode */}
            {dialogMode === "move" && (
              <div className="space-y-1">
                <Label htmlFor="moveDate">{t("tenant.moveRoom.moveDate")}</Label>
                <Input
                  id="moveDate"
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {t("tenant.moveRoom.moveDateHint")}
                </p>
              </div>
            )}

            {/* Billing day — only in assign mode */}
            {dialogMode === "assign" && (
              <div className="space-y-1">
                <Label htmlFor="billingDay">{t("tenant.assignRoom.billingDay")}</Label>
                <Input
                  id="billingDay"
                  type="number"
                  min={1}
                  max={31}
                  value={billingDay}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) {setBillingDay(Math.min(31, Math.max(1, v)));}
                  }}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                  {t("tenant.assignRoom.billingDayHint")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setDialogMode(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={handleMoveSubmit}
              disabled={moveMutation.isPending || !selectedRoomId}
            >
              {dialogMode === "assign"
                ? t("tenant.assignRoom.title")
                : t("tenant.moveRoom.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Out dialog */}
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

function RoomHistorySection({
  history,
  t,
  i18n,
}: {
  history: RoomAssignmentEntry[];
  t: (key: string, options?: Record<string, unknown>) => string;
  i18n: { language: string };
}) {
  const fmt = new Intl.DateTimeFormat(i18n.language, {
    month: "short",
    year: "numeric",
    day: "numeric",
  });

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("tenant.roomHistory.title")}</h3>
      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start justify-between text-sm border rounded-md p-2"
          >
            <span className="font-medium">{entry.roomNumber}</span>
            <div className="text-right text-muted-foreground text-xs">
              <div>{fmt.format(new Date(entry.startDate))}</div>
              <div>
                {entry.endDate
                  ? fmt.format(new Date(entry.endDate))
                  : t("tenant.roomHistory.present")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
