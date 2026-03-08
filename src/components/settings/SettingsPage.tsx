"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useProperty } from "@/contexts/property-context";
import { AVAILABLE_LOCALES } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { AccountSection } from "./AccountSection";
import { StaffSection } from "./StaffSection";
import { Separator } from "@/components/ui/separator";

type User = { id: string; name: string; email: string };

export function SettingsPage() {
  const { t } = useTranslation();
  const { user: authUser, loading: authLoading } = useAuth();
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);
  const user = updatedUser ?? authUser;
  const {
    activeProperty,
    userRole,
    isLoading: propertyLoading,
  } = useProperty();

  const loading = authLoading || propertyLoading;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground" role="status">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-md space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        {t("settings.title")}
      </h1>

      <section className="space-y-6">
        <LanguageSelector availableLocales={AVAILABLE_LOCALES} />
        <Separator />
        <AccountSection
          user={user!}
          onUserUpdated={(u) => setUpdatedUser(u)}
        />
        {activeProperty && (
          <>
            <Separator />
            <StaffSection
              propertyId={activeProperty.id}
              propertyName={activeProperty.name}
              userRole={userRole}
            />
          </>
        )}
      </section>
    </main>
  );
}
