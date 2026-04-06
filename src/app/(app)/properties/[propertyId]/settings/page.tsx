"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StaffSection } from "@/components/settings/StaffSection";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyInfo = {
  id: string;
  name: string;
  role: PropertyRole;
  staffOnlyFinance: boolean;
};

async function fetchProperty(propertyId: string): Promise<PropertyInfo> {
  const res = await fetch(`/api/properties/${propertyId}`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch property"); }
  return res.json() as Promise<PropertyInfo>;
}

async function updateSettings(
  propertyId: string,
  staffOnlyFinance: boolean
): Promise<{ staffOnlyFinance: boolean }> {
  const res = await fetch(`/api/properties/${propertyId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ staffOnlyFinance }),
  });
  if (!res.ok) { throw new Error("Failed to update settings"); }
  return res.json() as Promise<{ staffOnlyFinance: boolean }>;
}

export default function PropertySettingsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const propertyId = params.propertyId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const [staffOnlyFinance, setStaffOnlyFinance] = useState<boolean | null>(null);
  const currentValue = staffOnlyFinance !== null ? staffOnlyFinance : (property?.staffOnlyFinance ?? false);

  const mutation = useMutation({
    mutationFn: (value: boolean) => updateSettings(propertyId, value),
    onSuccess: (data) => {
      setStaffOnlyFinance(null);
      queryClient.setQueryData<PropertyInfo>(["property", propertyId], (old) =>
        old ? { ...old, staffOnlyFinance: data.staffOnlyFinance } : old
      );
      toast({ title: t("property.detail.settings.finance.saveSuccess") });
    },
    onError: () => {
      toast({ title: t("property.detail.settings.finance.saveError"), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center" role="status" aria-label={t("common.loading")}>
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">{t("property.detail.error.unavailable")}</p>
      </div>
    );
  }

  if (property.role !== "owner") {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted-foreground">{t("property.detail.settings.forbidden")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("property.detail.settings.title")}</h2>

      {/* Access section */}
      <section aria-labelledby="settings-access-heading">
        <h3 id="settings-access-heading" className="text-base font-semibold mb-3">
          {t("property.detail.settings.access.title")}
        </h3>
        <StaffSection
          propertyId={property.id}
          propertyName={property.name}
          userRole={property.role}
        />
      </section>

      {/* Finance section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("property.detail.settings.finance.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              id="staffOnlyFinance"
              type="checkbox"
              checked={currentValue}
              onChange={(e) => setStaffOnlyFinance(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input accent-primary cursor-pointer"
              disabled={mutation.isPending}
            />
            <div className="space-y-1">
              <Label htmlFor="staffOnlyFinance" className="font-medium cursor-pointer">
                {t("property.detail.settings.finance.staffOnlyFinance.label")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("property.detail.settings.finance.staffOnlyFinance.description")}
              </p>
            </div>
          </div>

          <Button
            className="min-h-[44px]"
            disabled={mutation.isPending || currentValue === (property.staffOnlyFinance ?? false)}
            onClick={() => mutation.mutate(currentValue)}
          >
            {mutation.isPending
              ? t("property.detail.settings.finance.saving")
              : t("property.detail.settings.finance.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
