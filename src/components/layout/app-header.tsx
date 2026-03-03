"use client";

import { useTranslation } from "react-i18next";
import { ProfileDropdown } from "@/components/auth/profile-dropdown";
import { PropertySwitcher } from "@/components/property/property-switcher";

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PropertySwitcher />
        </div>
        <ProfileDropdown />
      </div>
    </header>
  );
}
