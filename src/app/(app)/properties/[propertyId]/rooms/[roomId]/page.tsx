"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { RoomStatus } from "@/domain/schemas/room";

type RoomDetail = {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: RoomStatus;
  archivedAt: string | null;
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

async function deleteRoom(
  propertyId: string,
  roomId: string
): Promise<void> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to delete room");
  }
}

async function archiveRoom(
  propertyId: string,
  roomId: string
): Promise<RoomDetail> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/archive`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to archive room");
  }
  return res.json();
}

async function unarchiveRoom(
  propertyId: string,
  roomId: string
): Promise<RoomDetail> {
  const res = await fetch(
    `/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to restore room");
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data: room, isLoading, error } = useQuery({
    queryKey: ["room", propertyId, roomId],
    queryFn: () => fetchRoom(propertyId, roomId),
    enabled: !!propertyId && !!roomId,
  });

  const invalidateRoomQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["room", propertyId, roomId] });
    queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: RoomStatus) =>
      updateStatus(propertyId, roomId, status),
    onSuccess: () => {
      invalidateRoomQueries();
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(propertyId, roomId),
    onSuccess: () => {
      invalidateRoomQueries();
      toast({ title: t("room.delete.success") });
      setDeleteOpen(false);
      router.push(`/properties/${propertyId}/rooms`);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveRoom(propertyId, roomId),
    onSuccess: () => {
      invalidateRoomQueries();
      toast({ title: t("room.archive.success") });
      setArchiveOpen(false);
      router.push(`/properties/${propertyId}/rooms`);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => unarchiveRoom(propertyId, roomId),
    onSuccess: () => {
      invalidateRoomQueries();
      toast({ title: t("room.unarchive.success") });
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

  const isArchived = !!room.archivedAt;

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
          {isArchived && (
            <span className="ml-2 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t("room.status.archived")}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {room.roomType} · {formatCurrency(room.monthlyRent)}
        </p>
        {!isArchived && (
          <div className="flex items-center gap-2">
            <StatusIndicator status={room.status} size="large" />
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t("common.date")}: {createdAt}
        </p>
      </div>

      {!isArchived && room.status === "occupied" && room.tenantId && (
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

      {isArchived ? (
        <div className="flex flex-col gap-2">
          <Button
            className="min-h-[44px] min-w-[44px] w-full"
            onClick={() => unarchiveMutation.mutate()}
            disabled={unarchiveMutation.isPending}
            aria-label={t("room.unarchive.title")}
          >
            {t("room.unarchive.confirm")}
          </Button>
        </div>
      ) : (
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
      )}

      {/* G-3: Destructive actions at bottom */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-destructive">
          {t("room.dangerZone")}
        </h3>
        {!isArchived && (
          <Button
            variant="outline"
            className="min-h-[44px] min-w-[44px] w-full"
            onClick={() => setArchiveOpen(true)}
            aria-label={t("room.archive.title")}
          >
            {t("room.archive.title")}
          </Button>
        )}
        <Button
          variant="destructive"
          className="min-h-[44px] min-w-[44px] w-full"
          onClick={() => setDeleteOpen(true)}
          aria-label={t("room.delete.title")}
        >
          {t("room.delete.title")}
        </Button>
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("room.archive.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("room.archive.confirmMessage", { roomNumber: room.roomNumber })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setArchiveOpen(false)}
            >
              {t("room.archive.cancel")}
            </Button>
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
            >
              {t("room.archive.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("room.delete.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("room.delete.confirmMessage", { roomNumber: room.roomNumber })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setDeleteOpen(false)}
            >
              {t("room.delete.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {t("room.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
