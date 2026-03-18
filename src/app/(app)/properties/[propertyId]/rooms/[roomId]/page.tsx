"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/room/status-indicator";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoomStatus } from "@/domain/schemas/room";

type RoomDetail = {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  tenantName?: string;
};

async function fetchRoom(
  propertyId: string,
  roomId: string
): Promise<RoomDetail | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}`,
    { credentials: "include" }
  );
  if (res.status === 404) {return null;}
  if (!res.ok) {throw new Error("Failed to fetch room");}
  return res.json();
}

async function updateStatus(
  propertyId: string,
  roomId: string,
  status: RoomStatus
): Promise<RoomDetail> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to update status");
  }
  return res.json();
}

export default function RoomDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formatCurrency = useFormatCurrency();
  const propertyId = params.propertyId as string;
  const roomId = params.roomId as string;

  const { data: room, isLoading, error } = useQuery({
    queryKey: ["room", propertyId, roomId],
    queryFn: () => fetchRoom(propertyId, roomId),
    enabled: !!propertyId && !!roomId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: RoomStatus) =>
      updateStatus(propertyId, roomId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", propertyId, roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      toast({ title: t("room.status.updateSuccess") });
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !room) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading ? t("common.loading") : t("room.errors.notFound")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t("room.errors.loadFailed")}</p>
        <Button
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => router.push(`/properties/${propertyId}/rooms`)}
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const createdAt = room.createdAt
    ? new Date(room.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("room.detail.title")}</h2>

      <div className="space-y-2">
        <p>
          <span className="font-medium">{room.roomNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {room.roomType} · {formatCurrency(room.monthlyRent)}
        </p>
        <div className="flex items-center gap-2">
          <StatusIndicator status={room.status} size="large" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("common.date")}: {createdAt}
        </p>
      </div>

      {room.status === "occupied" && room.tenantId && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-muted-foreground">
            {t("room.detail.currentTenant")}
          </span>
          <p>
            <Link
              href={`/properties/${propertyId}/tenants/${room.tenantId}`}
              className="text-primary underline underline-offset-2 font-medium"
            >
              {room.tenantName}
            </Link>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/rooms/${roomId}/edit`}>
            {t("room.detail.edit")}
          </Link>
        </Button>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">
            {t("room.detail.changeStatus")}
          </span>
          <Select
            value={room.status}
            onValueChange={(value) =>
              statusMutation.mutate(value as RoomStatus)
            }
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className="min-h-[44px] min-w-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available" className="min-h-[44px]">
                {t("room.status.available")}
              </SelectItem>
              <SelectItem value="occupied" className="min-h-[44px]">
                {t("room.status.occupied")}
              </SelectItem>
              <SelectItem value="under_renovation" className="min-h-[44px]">
                {t("room.status.under_renovation")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
