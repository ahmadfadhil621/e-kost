"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PropertyForm } from "@/components/property/property-form";
import { usePropertyContext } from "@/contexts/property-context";
import type { CreatePropertyInput } from "@/domain/schemas/property";
import { useToast } from "@/hooks/use-toast";

export default function NewPropertyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const ctx = usePropertyContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreatePropertyInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        toast({
          title: t("auth.error.generic"),
          description: body?.error ?? t("auth.error.generic"),
          variant: "destructive",
        });
        return;
      }
      await ctx?.refetch();
      toast({
        title: t("property.create.success"),
      });
      router.push("/properties");
    } catch {
      toast({
        title: t("auth.error.generic"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PropertyForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
