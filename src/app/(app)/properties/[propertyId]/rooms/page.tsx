"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoomCard, type RoomForCard } from "@/components/room/room-card";
import { StatusFilter, type StatusFilterValue } from "@/components/room/status-filter";
import type { RoomStatus } from "@/domain/schemas/room";

async function fetchRooms(
  propertyId: string,
  status?: RoomStatus
): Promise<{ rooms: RoomForCard[]; count: number }> {
  const url = status
    ? `/api/properties/${propertyId}/rooms?status=${status}`
    : `/api/properties/${propertyId}/rooms`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {throw new Error("Failed to fetch rooms");}
  return res.json();
}

export default function RoomListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [filter, setFilter] = useState<StatusFilterValue>("all");

  const { data: allRoomsData, isLoading } = useQuery({
    queryKey: ["rooms", propertyId],
    queryFn: () => fetchRooms(propertyId),
    enabled: !!propertyId,
  });

  const filteredRooms = useMemo(() => {
    if (!allRoomsData?.rooms) {return [];}
    if (filter === "all") {return allRoomsData.rooms;}
    return allRoomsData.rooms.filter((r) => r.status === filter);
  }, [allRoomsData?.rooms, filter]);

  const counts = useMemo(() => {
    const rooms = allRoomsData?.rooms ?? [];
    return {
      all: rooms.length,
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      under_renovation: rooms.filter((r) => r.status === "under_renovation").length,
    };
  }, [allRoomsData?.rooms]);

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t("room.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/rooms/new`}>
            {t("room.create.title")}
          </Link>
        </Button>
      </div>

      <StatusFilter value={filter} onChange={setFilter} counts={counts} />

      {filteredRooms.length === 0 ? (
        <p className="text-muted-foreground">{t("room.list.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredRooms.map((room) => (
            <li key={room.id}>
              <RoomCard
                room={room}
                href={`/properties/${propertyId}/rooms/${room.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
