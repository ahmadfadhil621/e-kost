"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RoomForm } from "@/components/room/room-form";
import type { CreateRoomInput } from "@/domain/schemas/room";

export default function NewRoomPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;

  const handleSubmit = async (data: CreateRoomInput) => {
    const res = await fetch(`/api/properties/${propertyId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: t("auth.error.generic"),
        description: body?.error ?? undefined,
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["rooms", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
    toast({ title: t("room.create.success") });
    router.push(`/properties/${propertyId}/rooms`);
  };

  return (
    <div className="space-y-4">
      <RoomForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/properties/${propertyId}/rooms`)}
      />
    </div>
  );
}
