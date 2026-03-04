"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";

type PropertyDetail = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = usePropertyContext();
  const [property, setProperty] = useState<PropertyDetail | null>(null);

  const activeId = ctx?.activePropertyId ?? null;
  const properties = ctx?.properties ?? [];
  const isLoading = ctx?.isLoading ?? true;

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      try {
        const propRes = await fetch(`/api/properties/${activeId}`, {
          credentials: "include",
        });
        if (propRes.ok) {
          const p = await propRes.json();
          setProperty(p);
        } else {
          setProperty(null);
        }
      } catch {
        setProperty(null);
      }
    })();
  }, [activeId]);

  useEffect(() => {
    if (isLoading) return;
    if (properties.length === 0) return;
    if (!activeId && properties.length > 0) {
      router.replace("/properties");
      return;
    }
  }, [isLoading, properties.length, activeId, router]);

  // Show empty state as soon as we have no properties (including while loading)
  // so the create prompt is visible quickly and E2E/parallel load don't time out
  if (properties.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("nav.dashboard")}</h2>
        <p className="text-muted-foreground">
          {t("property.list.empty")}
        </p>
        {isLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!activeId) {
    return null;
  }

  if (!property) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{property.name}</h2>
        <p className="text-sm text-muted-foreground">{property.address || "—"}</p>
      </div>
      <div>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${activeId}/rooms`}>
            {t("nav.rooms")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
