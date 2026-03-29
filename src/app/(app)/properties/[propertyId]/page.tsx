"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffSection } from "@/components/settings/StaffSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePropertyContext } from "@/contexts/property-context";
import type { PropertyRole } from "@/domain/schemas/property";

type PropertyResponse = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: PropertyRole;
};

type DashboardStats = {
  occupancy: { totalRooms: number; occupied: number };
  outstandingCount: number;
};

async function fetchProperty(propertyId: string): Promise<PropertyResponse> {
  const res = await fetch(`/api/properties/${propertyId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Property not found");
  }
  return res.json() as Promise<PropertyResponse>;
}

async function fetchDashboardStats(propertyId: string): Promise<DashboardStats> {
  const res = await fetch(`/api/properties/${propertyId}/dashboard`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load stats");
  }
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

function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const propertyCtx = usePropertyContext();
  const propertyId = params.propertyId as string;

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery<PropertyResponse>({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["property-detail-stats", propertyId],
    queryFn: () => fetchDashboardStats(propertyId),
    enabled: !!propertyId,
  });

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
      <div
        className="flex min-h-[200px] items-center justify-center"
        role="status"
        aria-label={t("common.loading")}
      >
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">
          {t("property.detail.error.unavailable")}
        </p>
      </div>
    );
  }

  const totalRooms = stats?.occupancy?.totalRooms ?? 0;
  const tenants = stats?.occupancy?.occupied ?? 0;
  const outstanding = stats?.outstandingCount ?? 0;
  const hasActiveTenants = tenants > 0;
  const isOwner = property.role === "owner";
  const isArchived = !!property.archivedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-semibold leading-tight">{property.name}</h2>
            <Badge variant="secondary">
              {t(`property.role.${property.role}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground" data-testid="property-address">
            {property.address}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("property.detail.createdAt")}:{" "}
            {formatDate(property.createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="flex flex-col justify-center rounded-lg border border-border bg-card p-4"
          data-testid="stat-total-rooms"
        >
          <span className="text-2xl font-bold tabular-nums">{totalRooms}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.totalRooms")}
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-4">
          <span className="text-2xl font-bold tabular-nums">{tenants}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.tenants")}
          </span>
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-4">
          <span className="text-2xl font-bold tabular-nums">{outstanding}</span>
          <span className="text-xs text-muted-foreground">
            {t("property.detail.stats.outstanding")}
          </span>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "rooms", label: t("property.detail.nav.rooms") },
          { key: "tenants", label: t("property.detail.nav.tenants") },
          { key: "payments", label: t("property.detail.nav.payments") },
          { key: "finance", label: t("property.detail.nav.finance") },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/properties/${propertyId}/${key}`}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Map placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("common.actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              {t("property.detail.mapPlaceholder")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staff management */}
      <StaffSection
        propertyId={property.id}
        propertyName={property.name}
        userRole={property.role}
      />

      {/* G-3: Destructive actions at bottom (owner only) */}
      {isOwner && (
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
      )}

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
