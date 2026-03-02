"use client";

import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("nav.dashboard")}</h2>
      <p className="mt-2 text-muted-foreground">{t("app.tagline")}</p>
    </div>
  );
}
