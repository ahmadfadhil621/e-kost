"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type StaffMember = {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
};

export function StaffManagement({
  propertyId,
  ownerId,
  staffList,
  onRefetch,
}: {
  propertyId: string;
  ownerId: string;
  staffList: StaffMember[];
  onRefetch: () => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const isOwner = user?.id === ownerId;

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data?.error ?? t("auth.error.generic"),
          variant: "destructive",
        });
        return;
      }
      toast({ title: t("property.staff.invited", "Staff invited") });
      setEmail("");
      onRefetch();
    } catch {
      toast({
        title: t("auth.error.generic"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setIsRemoving(userId);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/staff/${userId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json();
        toast({
          title: data?.error ?? t("auth.error.generic"),
          variant: "destructive",
        });
        return;
      }
      onRefetch();
    } catch {
      toast({
        title: t("auth.error.generic"),
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold">
        {t("property.staff.title", "Staff")}
      </h3>
      <ul className="space-y-2">
        {staffList.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{s.user.name}</p>
              <p className="text-sm text-muted-foreground">{s.user.email}</p>
            </div>
            {isOwner && s.userId !== ownerId && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
                disabled={isRemoving === s.userId}
                onClick={() => handleRemove(s.userId)}
              >
                {t("common.delete")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={handleAddStaff} className="flex flex-col gap-2">
          <Label htmlFor="staff-email">{t("property.staff.addByEmail", "Add by email")}</Label>
          <div className="flex gap-2">
            <Input
              id="staff-email"
              type="email"
              placeholder={t("auth.register.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[44px] flex-1"
            />
            <Button
              type="submit"
              disabled={isAdding}
              className="min-h-[44px] min-w-[44px]"
            >
              {t("property.staff.invite", "Invite")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
