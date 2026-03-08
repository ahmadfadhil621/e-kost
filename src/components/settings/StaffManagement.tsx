"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type StaffMember = {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
};

type StaffManagementProps = {
  propertyId: string;
  propertyName: string;
};

async function fetchStaff(propertyId: string): Promise<StaffMember[]> {
  const res = await fetch(`/api/properties/${propertyId}/staff`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch staff");
  }
  return res.json();
}

export function StaffManagement({
  propertyId,
  propertyName: _propertyName,
}: StaffManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff", propertyId],
    queryFn: () => fetchStaff(propertyId),
    enabled: !!propertyId,
  });

  const inviteMutation = useMutation({
    mutationFn: async (staffEmail: string) => {
      const res = await fetch(`/api/properties/${propertyId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: staffEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to invite");
      }
      return data;
    },
    onSuccess: () => {
      setEmail("");
      setInviteError(null);
      setShowInviteForm(false);
      queryClient.invalidateQueries({ queryKey: ["staff", propertyId] });
      toast({
        title: t("property.staff.invited"),
        variant: "default",
      });
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(
        `/api/properties/${propertyId}/staff/${userId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to remove");
      }
    },
    onSuccess: () => {
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["staff", propertyId] });
      toast({
        title: t("property.staff.removed"),
        variant: "default",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }
    inviteMutation.mutate(trimmed);
  };

  const handleRemoveConfirm = () => {
    if (removeTarget) {
      removeMutation.mutate(removeTarget.userId);
    }
  };

  return (
    <div className="space-y-4" data-testid="staff-management">
      {isLoading && (
        <p className="text-sm text-muted-foreground" role="status">
          {t("common.loading")}
        </p>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => {
            setShowInviteForm(true);
            setInviteError(null);
            setEmail("");
          }}
        >
          {t("settings.staff.addStaff")}
        </Button>

        {showInviteForm && (
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <Label htmlFor="staff-email">{t("common.email")}</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder={t("common.email")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setInviteError(null);
              }}
              className="min-h-[44px]"
              disabled={inviteMutation.isPending}
            />
            {inviteError && (
              <p className="text-sm text-destructive" role="alert">
                {inviteError}
              </p>
            )}
            <Button
              type="submit"
              className="min-h-[44px] min-w-[44px]"
              disabled={inviteMutation.isPending}
            >
              {t("property.staff.invite")}
            </Button>
          </form>
        )}
      </div>

      <ul className="space-y-2" role="list">
        {staffList.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{s.user.name}</p>
              <p className="text-sm text-muted-foreground">{s.user.email}</p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setRemoveTarget(s)}
            >
              {t("common.delete")}
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent role="dialog">
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {removeTarget
              ? t("property.staff.title") + " — " + removeTarget.user.name
              : ""}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setRemoveTarget(null)}
            >
              {t("settings.account.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-[44px] min-w-[44px]"
              onClick={handleRemoveConfirm}
              disabled={removeMutation.isPending}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
