"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoomCard, type RoomForCard } from "@/components/room/room-card";
import { StatusFilter, type StatusFilterValue } from "@/components/room/status-filter";
import { SearchInput } from "@/components/common/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import type { RoomStatus } from "@/domain/schemas/room";

async function fetchRooms(propertyId: string, status?: RoomStatus): Promise<{ rooms: RoomForCard[]; count: number }> {
  const url = status ? `/api/properties/${propertyId}/rooms?status=${status}` : `/api/properties/${propertyId}/rooms`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch rooms"); }
  return res.json() as Promise<{ rooms: RoomForCard[]; count: number }>;
}

export default function RoomListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const [filter, setFilter] = useState<StatusFilterValue>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 0);

  const { data: allRoomsData, isLoading } = useQuery<{ rooms: RoomForCard[]; count: number }>({
    queryKey: ["rooms", propertyId],
    queryFn: () => fetchRooms(propertyId),
    enabled: !!propertyId,
  });

  const filteredRooms: RoomForCard[] = useMemo(() => {
    if (!allRoomsData?.rooms) { return []; }
    let filtered = filter === "all" ? allRoomsData.rooms : allRoomsData.rooms.filter((r) => r.status === filter);
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((r) => r.roomNumber.toLowerCase().includes(q) || r.roomType.toLowerCase().includes(q));
    }
    return filtered;
  }, [allRoomsData?.rooms, filter, debouncedSearch]);

  const allRooms = useMemo(() => allRoomsData?.rooms ?? [], [allRoomsData?.rooms]);
  const counts = useMemo(() => ({
    all: allRooms.length,
    available: allRooms.filter((r) => r.status === "available").length,
    occupied: allRooms.filter((r) => r.status === "occupied").length,
    under_renovation: allRooms.filter((r) => r.status === "under_renovation").length,
  }), [allRooms]);

  if (!propertyId) { return <div><p>{t("common.loading")}</p></div>; }
  if (isLoading) { return <div><p>{t("common.loading")}</p></div>; }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("room.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/rooms/new`}>{t("room.create.title")}</Link>
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("room.list.searchPlaceholder")}
        ariaLabel={t("room.list.searchPlaceholder")}
      />
      <StatusFilter value={filter} onChange={setFilter} counts={counts} />

      {allRooms.length === 0 ? (
        <p className="text-muted-foreground">{t("room.list.empty")}</p>
      ) : filteredRooms.length === 0 ? (
        <p className="text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 list-none p-0 m-0">
          {filteredRooms.map((room, index) => (
            <li key={room.id} className="animate-fade-in" style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}>
              <RoomCard room={room} propertyId={propertyId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
