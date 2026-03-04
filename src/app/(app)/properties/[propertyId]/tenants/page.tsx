"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type TenantSummary = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
};

async function fetchTenants(propertyId: string): Promise<{
  tenants: TenantSummary[];
  count: number;
}> {
  const res = await fetch(`/api/properties/${propertyId}/tenants`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch tenants");
  }
  return res.json();
}

export default function TenantListPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;

  const { data, isLoading } = useQuery({
    queryKey: ["tenants", propertyId],
    queryFn: () => fetchTenants(propertyId),
    enabled: !!propertyId,
  });

  const tenants = data?.tenants ?? [];

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t("common.loading")}</p>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t("tenant.list.title")}</h2>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href={`/properties/${propertyId}/tenants/new`}>
            {t("tenant.list.addTenant")}
          </Link>
        </Button>
      </div>

      {tenants.length === 0 ? (
        <p className="text-muted-foreground">{t("tenant.list.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <Link
                href={`/properties/${propertyId}/tenants/${tenant.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="min-h-[44px] transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <span className="font-medium">{tenant.name}</span>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {tenant.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.email}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
