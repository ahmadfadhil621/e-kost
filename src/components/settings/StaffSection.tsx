"use client";

import { useTranslation } from "react-i18next";
import { StaffManagement } from "./StaffManagement";

type StaffSectionProps = {
  propertyId: string;
  propertyName: string;
  userRole: "owner" | "staff" | null;
};

export function StaffSection({
  propertyId,
  propertyName,
  userRole,
}: StaffSectionProps) {
  const { t } = useTranslation();

  if (userRole !== "owner") {
    return null;
  }

  return (
    <section aria-labelledby="staff-heading">
      <h2
        id="staff-heading"
        className="text-base font-semibold text-foreground"
      >
        {t("settings.staff.title", { propertyName })}
      </h2>
      <div className="mt-2">
        <StaffManagement
          propertyId={propertyId}
          propertyName={propertyName}
        />
      </div>
    </section>
  );
}
