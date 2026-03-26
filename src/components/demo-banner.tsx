"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function DemoBanner() {
  const { t } = useTranslation();
  const { user } = useAuth() ?? {};

  if (!user?.email || user.email !== "demo@ekost.app") { return null; }

  return (
    <div
      role="status"
      aria-label={t("demo.banner.ariaLabel", "Demo account banner")}
    >
      {t("demo.banner.message", "You're in a demo account — all data resets on next login")}
    </div>
  );
}
