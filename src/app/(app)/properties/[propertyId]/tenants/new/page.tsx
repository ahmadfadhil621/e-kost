"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { TenantForm } from "@/components/tenant/tenant-form";
import type { CreateTenantInput } from "@/domain/schemas/tenant";

export default function NewTenantPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const propertyId = params.propertyId as string;

  const handleSubmit = async (data: CreateTenantInput) => {
    const res = await fetch(`/api/properties/${propertyId}/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast({
        title: t("auth.error.generic"),
        description: body?.error ?? undefined,
        variant: "destructive",
      });
      return;
    }

    toast({ title: t("tenant.create.success") });
    router.push(`/properties/${propertyId}/tenants`);
  };

  return (
    <div className="space-y-4">
      <TenantForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/properties/${propertyId}/tenants`)}
      />
    </div>
  );
}
