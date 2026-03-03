"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePropertyContext } from "@/contexts/property-context";
import { StaffManagement } from "@/components/property/staff-management";
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
  const [staff, setStaff] = useState<{ id: string; userId: string; user: { id: string; name: string; email: string } }[]>([]);

  const activeId = ctx?.activePropertyId ?? null;
  const properties = ctx?.properties ?? [];
  const isLoading = ctx?.isLoading ?? true;

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      try {
        const [propRes, staffRes] = await Promise.all([
          fetch(`/api/properties/${activeId}`, { credentials: "include" }),
          fetch(`/api/properties/${activeId}/staff`, { credentials: "include" }),
        ]);
        if (propRes.ok) {
          const p = await propRes.json();
          setProperty(p);
        }
        if (staffRes.ok) {
          const s = await staffRes.json();
          setStaff(Array.isArray(s) ? s : []);
        }
      } catch {
        setProperty(null);
        setStaff([]);
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

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("nav.dashboard")}</h2>
        <p className="text-muted-foreground">
          {t("property.list.empty")}
        </p>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
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

  const refetchStaff = () => {
    fetch(`/api/properties/${activeId}/staff`, { credentials: "include" })
      .then((r) => r.json())
      .then((s) => setStaff(Array.isArray(s) ? s : []))
      .catch(() => setStaff([]));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{property.name}</h2>
        <p className="text-sm text-muted-foreground">{property.address || "—"}</p>
      </div>
      <StaffManagement
        propertyId={property.id}
        ownerId={property.ownerId}
        staffList={staff}
        onRefetch={refetchStaff}
      />
    </div>
  );
}
