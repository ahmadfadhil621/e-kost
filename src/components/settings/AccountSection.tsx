"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/get-initials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
};

type AccountSectionProps = {
  user: User;
  onUserUpdated: (user: User) => void;
};

export function AccountSection({ user, onUserUpdated }: AccountSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  const initials = getInitials(user.name);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("settings.validation.nameRequired"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data: _data, error: updateError } = await authClient.updateUser({
        name: trimmed,
      });
      if (updateError) {
        throw updateError;
      }
      const updatedUser: User = { ...user, name: trimmed };
      onUserUpdated(updatedUser);
      const message = t("settings.account.updateSuccess");
      setSuccessMessage(message);
      toast({
        title: message,
        variant: "default",
      });
      setEditing(false);
    } catch {
      setError(t("settings.account.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setError(null);
    setSuccessMessage(null);
    setEditing(false);
  };

  return (
    <section aria-labelledby="account-heading">
      <h2
        id="account-heading"
        className="text-base font-semibold text-foreground"
      >
        {t("settings.account.title")}
      </h2>
      {successMessage && (
        <p className="mt-2 text-sm text-foreground" role="status">
          {successMessage}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
            aria-hidden
          >
            {initials}
          </div>
          {!editing ? (
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-medium">{user.name}</p>
              <Label id="account-email-label" className="text-sm text-muted-foreground">
                {t("settings.account.email")}
              </Label>
              <p
                id="account-email"
                aria-labelledby="account-email-label"
                className="text-sm text-muted-foreground"
              >
                {user.email}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 min-h-[44px] min-w-[44px]"
                onClick={() => setEditing(true)}
              >
                {t("settings.account.edit")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="account-name">{t("settings.account.name")}</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px]"
                disabled={saving}
                aria-invalid={!!error}
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {saving && (
                <p className="text-sm text-muted-foreground" role="status">
                  {t("common.loading")}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {t("settings.account.save")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {t("settings.account.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
