"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createInviteFormSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "staff"]),
  expiresInDays: z.number().int().min(1).max(30),
});
type CreateInviteFormInput = z.infer<typeof createInviteFormSchema>;

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  usedAt: string | null;
  token: string;
  createdAt: string;
};

type InviteSectionProps = {
  userRole: "owner" | "staff" | null;
};

export function InviteSection({ userRole }: InviteSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: invites = [], isLoading } = useQuery<Invite[]>({
    queryKey: ["invites"],
    queryFn: async () => {
      const res = await fetch("/api/invites");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: userRole === "owner",
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateInviteFormInput) => {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? t("settings.invites.error.createFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      setShowForm(false);
      reset();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? t("settings.invites.error.revokeFailed"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateInviteFormInput>({
    resolver: zodResolver(createInviteFormSchema),
    defaultValues: { role: "staff", expiresInDays: 7 },
  });

  const onSubmit = (data: CreateInviteFormInput) => {
    createMutation.mutate(data);
  };

  const copyLink = async (invite: Invite) => {
    const url = `${window.location.origin}/register?token=${invite.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (userRole !== "owner") {return null;}

  const pendingInvites = invites.filter((i) => !i.usedAt);
  const usedInvites = invites.filter((i) => i.usedAt);

  return (
    <section aria-labelledby="invites-heading">
      <div className="flex items-center justify-between">
        <h2 id="invites-heading" className="text-base font-semibold text-foreground">
          {t("settings.invites.title")}
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
        >
          {t("settings.invites.generate")}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 rounded-md border p-4">
          <div className="space-y-1">
            <Label htmlFor="invite-email">{t("settings.invites.form.email")}</Label>
            <Input id="invite-email" type="email" className="min-h-[44px]" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-role">{t("settings.invites.form.role")}</Label>
            <select
              id="invite-role"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
              {...register("role")}
            >
              <option value="owner">{t("settings.invites.form.roleOwner")}</option>
              <option value="staff">{t("settings.invites.form.roleStaff")}</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-expires">{t("settings.invites.form.expiresIn")}</Label>
            <Input
              id="invite-expires"
              type="number"
              min={1}
              max={30}
              className="min-h-[44px]"
              {...register("expiresInDays", { valueAsNumber: true })}
            />
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive">{(createMutation.error as Error).message}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending}>
              {t("settings.invites.form.submit")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>
              {t("settings.invites.form.cancel")}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? null : (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t("settings.invites.list.title")}</h3>
            {pendingInvites.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.invites.list.empty")}</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {pendingInvites.map((invite) => {
                  const link = typeof window !== "undefined"
                    ? `${window.location.origin}/register?token=${invite.token}`
                    : `/register?token=${invite.token}`;
                  return (
                    <li key={invite.id} className="rounded-md border px-3 py-3 text-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium break-all">{invite.email}</span>
                          <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                            <span>{invite.role}</span>
                            <span>·</span>
                            <span>{t("settings.invites.list.expires")}: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive shrink-0"
                          onClick={() => revokeMutation.mutate(invite.id)}
                          disabled={revokeMutation.isPending}
                        >
                          {t("settings.invites.list.revoke")}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={link}
                          className="min-w-0 flex-1 rounded border bg-muted px-2 py-1 text-xs text-muted-foreground"
                          onFocus={(e) => e.target.select()}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => copyLink(invite)}
                        >
                          {copiedId === invite.id ? t("settings.invites.success.copied") : t("settings.invites.list.link")}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {usedInvites.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t("settings.invites.list.used")}</h3>
              <ul className="mt-2 space-y-2">
                {usedInvites.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm opacity-60">
                    <span>{invite.email}</span>
                    <span className="text-xs">{t("settings.invites.list.used")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
