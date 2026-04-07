"use client";

import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default function ActivityPage() {
  const { t } = useTranslation();
  const params = useParams<{ propertyId: string }>();
  const propertyId = params.propertyId;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{t("activity.title")}</h1>
      <ActivityFeed propertyId={propertyId} />
    </div>
  );
}
