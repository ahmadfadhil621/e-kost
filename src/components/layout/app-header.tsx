"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ProfileDropdown } from "@/components/auth/profile-dropdown";
import { PropertySwitcher } from "@/components/property/property-switcher";
import { usePropertyContext } from "@/contexts/property-context";

async function fetchDashboard(propertyId: string) {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export function AppHeader() {
  const { t } = useTranslation();
  const activeId = usePropertyContext()?.activePropertyId ?? null;
  const { data } = useQuery({
    queryKey: ["dashboard", activeId],
    queryFn: () => fetchDashboard(activeId!),
    enabled: !!activeId,
    staleTime: 60 * 1000,
  });

  const occupancy = data?.occupancy;
  const showRoomStats = !!activeId && occupancy != null;

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex flex-col gap-0">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PropertySwitcher />
          </div>
          <ProfileDropdown />
        </div>
        {showRoomStats && (
          <div className="flex items-center gap-1.5 px-4 pb-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-status-occupied" aria-hidden />
              {occupancy.occupied} {t("dashboard.occupancy.occupied")}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-status-available" aria-hidden />
              {occupancy.available} {t("dashboard.occupancy.available")}
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-status-renovation" aria-hidden />
              {occupancy.underRenovation} {t("dashboard.occupancy.underRenovation")}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
