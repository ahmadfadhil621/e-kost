"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RoomForm } from "@/components/room/room-form";
import type { CreateRoomInput } from "@/domain/schemas/room";

type RoomDetail = {
  id: string;
  roomNumber: string;
  roomType: string;
  monthlyRent: number;
  status: string;
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

export default function EditRoomPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;
  const roomId = params.roomId as string;

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", propertyId, roomId],
    queryFn: () => fetchRoom(propertyId, roomId),
    enabled: !!propertyId && !!roomId,
  });

  const handleSubmit = async (data: CreateRoomInput) => {
    const res = await fetch(
      `/api/properties/${propertyId}/rooms/${roomId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: t("auth.error.generic"),
        description: body?.error ?? undefined,
        variant: "destructive",
      });
      return;
    }

    toast({ title: t("room.edit.success") });
    router.push(`/properties/${propertyId}/rooms/${roomId}`);
  };

  if (isLoading || !room) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">
          {isLoading ? t("common.loading") : t("room.errors.notFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoomForm
        mode="edit"
        defaultValues={{
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          monthlyRent: room.monthlyRent,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/properties/${propertyId}/rooms/${roomId}`)}
      />
    </div>
  );
}
