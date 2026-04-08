"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePropertyContext } from "@/contexts/property-context";
import { StaffSection } from "@/components/settings/StaffSection";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyInfo = {
  id: string;
  name: string;
  role: PropertyRole;
  staffOnlyFinance: boolean;
  archivedAt: string | null;
};

type DashboardStats = {
  occupancy: { totalRooms: number; occupied: number };
  outstandingCount: number;
};

async function fetchProperty(propertyId: string): Promise<PropertyInfo> {
  const res = await fetch(`/api/properties/${propertyId}`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to fetch property"); }
  return res.json() as Promise<PropertyInfo>;
}

async function fetchDashboardStats(propertyId: string): Promise<DashboardStats> {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, { credentials: "include" });
  if (!res.ok) { throw new Error("Failed to load stats"); }
  return res.json() as Promise<DashboardStats>;
}

async function archiveProperty(propertyId: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/archive`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "Failed to archive property");
  }
}

async function unarchiveProperty(propertyId: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/unarchive`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "Failed to restore property");
  }
}

async function deleteProperty(propertyId: string): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json() as { error?: string };
    throw new Error(body.error ?? "Failed to delete property");
  }
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
  const router = useRouter();
  const propertyId = params.propertyId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyCtx = usePropertyContext();

  const [staffOnlyFinance, setStaffOnlyFinance] = useState<boolean | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["property-detail-stats", propertyId],
    queryFn: () => fetchDashboardStats(propertyId),
    enabled: !!propertyId,
  });

  const currentValue = staffOnlyFinance !== null ? staffOnlyFinance : (property?.staffOnlyFinance ?? false);

  const invalidatePropertyQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["property-detail-stats", propertyId] });
    void propertyCtx?.refetch();
  };

  const clearActiveIfCurrent = () => {
    if (propertyCtx?.activePropertyId === propertyId) {
      propertyCtx.setActivePropertyId(null);
    }
  };

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

  const archiveMutation = useMutation({
    mutationFn: () => archiveProperty(propertyId),
    onSuccess: () => {
      clearActiveIfCurrent();
      invalidatePropertyQueries();
      toast({ title: t("property.archive.success") });
      setArchiveOpen(false);
      router.push("/properties");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
      setArchiveOpen(false);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => unarchiveProperty(propertyId),
    onSuccess: () => {
      invalidatePropertyQueries();
      toast({ title: t("property.unarchive.success") });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProperty(propertyId),
    onSuccess: () => {
      clearActiveIfCurrent();
      invalidatePropertyQueries();
      toast({ title: t("property.delete.success") });
      setDeleteOpen(false);
      router.push("/properties");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
      setDeleteOpen(false);
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

  const hasActiveTenants = (stats?.occupancy?.occupied ?? 0) > 0;
  const isArchived = !!property.archivedAt;

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

      {/* Danger zone */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-destructive">
          {t("property.dangerZone")}
        </h3>
        {hasActiveTenants && (
          <p className="text-sm text-muted-foreground">
            {t("property.occupiedWarning")}
          </p>
        )}
        {isArchived ? (
          <Button
            variant="outline"
            className="min-h-[44px] min-w-[44px] w-full"
            onClick={() => unarchiveMutation.mutate()}
            disabled={unarchiveMutation.isPending}
            aria-label={t("property.unarchive.title")}
          >
            {t("property.unarchive.title")}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-h-[44px] min-w-[44px] w-full"
            onClick={() => setArchiveOpen(true)}
            disabled={hasActiveTenants}
            aria-label={t("property.archive.title")}
          >
            {t("property.archive.title")}
          </Button>
        )}
        <Button
          variant="destructive"
          className="min-h-[44px] min-w-[44px] w-full"
          onClick={() => setDeleteOpen(true)}
          disabled={hasActiveTenants || isArchived}
          aria-label={t("property.delete.title")}
        >
          {t("property.delete.title")}
        </Button>
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("property.archive.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("property.archive.confirmMessage", { name: property.name })}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setArchiveOpen(false)}
            >
              {t("property.archive.cancel")}
            </Button>
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
            >
              {t("property.archive.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog — GitHub-style name input */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) { setDeleteConfirmName(""); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("property.delete.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("property.delete.confirmMessage", { name: property.name })}
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm-name">
              {t("property.delete.confirmNameLabel")}
            </Label>
            <Input
              id="delete-confirm-name"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={property.name}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmName("");
              }}
            >
              {t("property.delete.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteConfirmName !== property.name || deleteMutation.isPending}
            >
              {t("property.delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
