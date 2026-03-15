"use client";

import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TenantForm } from "@/components/tenant/tenant-form";
import type { CreateTenantInput } from "@/domain/schemas/tenant";

type TenantDetail = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

async function fetchTenant(
  propertyId: string,
  tenantId: string
): Promise<TenantDetail | null> {
  const res = await fetch(
    `/api/properties/${propertyId}/tenants/${tenantId}`,
    { credentials: "include" }
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch tenant");
  }
  return res.json();
}

export default function EditTenantPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyId = params.propertyId as string;
  const tenantId = params.tenantId as string;

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", propertyId, tenantId],
    queryFn: () => fetchTenant(propertyId, tenantId),
    enabled: !!propertyId && !!tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateTenantInput>) =>
      fetch(`/api/properties/${propertyId}/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update tenant");
      }
      queryClient.invalidateQueries({ queryKey: ["tenant", propertyId, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenants", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", propertyId] });
      toast({ title: t("tenant.edit.success") });
      router.push(`/properties/${propertyId}/tenants/${tenantId}`);
    },
    onError: (err: Error) => {
      toast({
        title: t("auth.error.generic"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: CreateTenantInput) => {
    updateMutation.mutate(data);
  };

  if (isLoading || !tenant) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TenantForm
        mode="edit"
        defaultValues={{
          name: tenant.name,
          phone: tenant.phone,
          email: tenant.email,
        }}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.push(`/properties/${propertyId}/tenants/${tenantId}`)
        }
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
