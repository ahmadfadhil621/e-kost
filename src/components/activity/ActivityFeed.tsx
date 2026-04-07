"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ActivityEntry } from "./ActivityEntry";
import { ActivityFilters } from "./ActivityFilters";
import type { ActivityLogEntry } from "@/domain/schemas/activity-log";

interface ActivityPage {
  data: ActivityLogEntry[];
  nextCursor: string | null;
}

async function fetchActivityPage(
  propertyId: string,
  cursor?: string,
  area?: string,
  actorId?: string
): Promise<ActivityPage> {
  const params = new URLSearchParams();
  if (cursor) { params.set("cursor", cursor); }
  if (area && area !== "all") { params.set("area", area); }
  if (actorId && actorId !== "all") { params.set("actorId", actorId); }

  const res = await fetch(
    `/api/properties/${propertyId}/activity?${params.toString()}`,
    { credentials: "include" }
  );
  if (!res.ok) { throw new Error("Failed to fetch activity"); }
  const json = await res.json();
  return {
    data: json.data.map((e: ActivityLogEntry & { createdAt: string }) => ({
      ...e,
      createdAt: new Date(e.createdAt),
    })),
    nextCursor: json.nextCursor,
  };
}

async function fetchPropertyStaff(
  propertyId: string
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`/api/properties/${propertyId}/staff`, {
    credentials: "include",
  });
  if (!res.ok) { return []; }
  const data = await res.json();
  return (data ?? []).map((s: { userId: string; name: string }) => ({
    id: s.userId,
    name: s.name,
  }));
}

interface ActivityFeedProps {
  propertyId: string;
}

export function ActivityFeed({ propertyId }: ActivityFeedProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ area: "all", actorId: "all" });
  const [pages, setPages] = useState<ActivityPage[]>([]);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const currentCursor = cursors[cursors.length - 1];

  const { data: staffList } = useQuery({
    queryKey: ["property-staff", propertyId],
    queryFn: () => fetchPropertyStaff(propertyId),
  });

  const { data, isFetching } = useQuery({
    queryKey: ["activity", propertyId, filters.area, filters.actorId, currentCursor],
    queryFn: () =>
      fetchActivityPage(propertyId, currentCursor, filters.area, filters.actorId),
    placeholderData: (prev) => prev,
  });

  // When new page arrives, append it (but reset on filter change)
  const allEntries =
    cursors.length === 1
      ? data?.data ?? []
      : [...pages.flatMap((p) => p.data), ...(data?.data ?? [])];

  function handleFilterChange(newFilters: typeof filters) {
    setFilters(newFilters);
    setPages([]);
    setCursors([undefined]);
  }

  function handleLoadMore() {
    if (!data?.nextCursor) { return; }
    setPages((prev) => [...prev, data]);
    setCursors((prev) => [...prev, data.nextCursor!]);
  }

  const hasNextPage = data?.nextCursor !== null && data?.nextCursor !== undefined;

  return (
    <div className="space-y-4">
      <ActivityFilters
        value={filters}
        actors={staffList ?? []}
        onChange={handleFilterChange}
      />

      <div>
        {allEntries.length === 0 && !isFetching ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">{t("activity.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("activity.emptyDescription")}</p>
          </div>
        ) : (
          <div>
            {allEntries.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {isFetching && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("activity.loading")}
          </p>
        )}

        {hasNextPage && !isFetching && (
          <div className="pt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
            >
              {t("activity.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
