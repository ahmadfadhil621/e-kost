"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PropertiesListPage() {
  const { t } = useTranslation();
  const ctx = usePropertyContext();
  const { properties, activePropertyId, isLoading } =
    ctx ?? {
      properties: [],
      activePropertyId: null,
      isLoading: true,
    };

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
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <p className="text-muted-foreground">{t("property.list.empty")}</p>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <Button asChild size="sm" className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {properties.map((p) => (
          <li key={p.id}>
            <Link href={`/properties/${p.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    {activePropertyId === p.id && (
                      <Badge variant="secondary">{t("property.list.active")}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {p.address || "—"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
