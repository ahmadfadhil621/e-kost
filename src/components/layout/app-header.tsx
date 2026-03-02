"use client";

import { useTranslation } from "react-i18next";
import { ProfileDropdown } from "@/components/auth/profile-dropdown";

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-lg font-semibold">{t("app.name")}</h1>
        <ProfileDropdown />
      </div>
    </header>
  );
}
