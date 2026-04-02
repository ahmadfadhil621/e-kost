"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PropertySwitcher } from "@/components/property/property-switcher";
import { usePropertyContext } from "@/contexts/property-context";

const ProfileDropdown = dynamic(
  () =>
    import("@/components/auth/profile-dropdown").then(
      (m) => m.ProfileDropdown
    ),
  { ssr: false }
);

async function fetchDashboard(propertyId: string) {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load dashboard");
  }
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
  // Only show stats when occupancy is loaded (undefined while query is loading)
  const showRoomStats =
    !!activeId && occupancy !== undefined && occupancy !== null;

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-border bg-card">
      {/* Shared max-width scale: max-w-[480px] md:max-w-2xl lg:max-w-3xl xl:max-w-5xl — keep in sync with layout.tsx and app-nav.tsx */}
      <div className="mx-auto w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl xl:max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PropertySwitcher />
          </div>
          <ProfileDropdown />
        </div>
        {showRoomStats && (
          <div className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
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
