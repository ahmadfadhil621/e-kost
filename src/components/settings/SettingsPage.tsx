"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProperty } from "@/contexts/property-context";
import { useDevStatus } from "@/hooks/use-dev-status";
import { AVAILABLE_LOCALES } from "@/lib/i18n";
import { LanguageSelector } from "./LanguageSelector";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";
import { Separator } from "@/components/ui/separator";

type User = { id: string; name: string; email: string };

export function SettingsPage() {
  const { t } = useTranslation();
  const { user: authUser, loading: authLoading } = useAuth();
  const [updatedUser, setUpdatedUser] = useState<User | null>(null);
  const user = updatedUser ?? authUser;
  const {
    isLoading: propertyLoading,
  } = useProperty();

  const { isDev, isLoading: devLoading } = useDevStatus();

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
    <main className="w-full space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        {t("settings.title")}
      </h1>

      <section className="space-y-6">
        <AppearanceSection />
        <Separator />
        <LanguageSelector availableLocales={[...AVAILABLE_LOCALES]} />
        <Separator />
        <AccountSection
          user={user!}
          onUserUpdated={(u) => setUpdatedUser(u)}
        />
        {!devLoading && isDev && (
          <>
            <Separator />
            <section aria-labelledby="dev-section-heading">
              <h2 id="dev-section-heading" className="text-base font-semibold text-foreground">
                {t("settings.developer.title")}
              </h2>
              <div className="mt-3">
                <Link
                  href="/settings/invites"
                  className="flex min-h-[44px] items-center text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("settings.developer.inviteManagement")}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t("settings.developer.inviteManagementDesc")}
                </p>
              </div>
              <div className="mt-3">
                <Link
                  href="/settings/currencies"
                  className="flex min-h-[44px] items-center text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("settings.developer.currencyManagement")}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t("settings.developer.currencyManagementDesc")}
                </p>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
