"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  registrationSchema,
  type RegistrationInput,
} from "@/domain/schemas/auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteData = {
  email: string;
  role: string;
  propertyId: string | null;
};

type InviteState =
  | { status: "loading" }
  | { status: "error"; messageKey: string }
  | { status: "valid"; invite: InviteData };

type Props = {
  token?: string | null;
};

export function RegistrationForm({ token }: Props) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<InviteState>(
    token ? { status: "loading" } : { status: "error", messageKey: "auth.register.inviteRequired" }
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
  });

  useEffect(() => {
    if (!token) {return;}

    fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setInviteState({ status: "error", messageKey: "auth.register.inviteInvalid" });
        } else {
          setInviteState({ status: "valid", invite: json.data });
          setValue("email", json.data.email);
        }
      })
      .catch(() => {
        setInviteState({ status: "error", messageKey: "auth.register.inviteInvalid" });
      });
  }, [token, setValue]);

  const onSubmit = async (data: RegistrationInput) => {
    setServerError(null);
    try {
      const user = await signUp(data.email, data.password, data.name);
      if (token && user?.id) {
        await fetch("/api/invites/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userId: user.id }),
        });
      }
      window.location.href = "/";
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : t("auth.error.generic");
      setServerError(message);
    }
  };

  if (inviteState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">{t("auth.register.inviteLoading")}</p>
      </div>
    );
  }

  if (inviteState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold">{t("auth.register.title")}</h1>
          <div role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {t(inviteState.messageKey)}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-primary underline">
              {t("auth.login.title")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const invite = inviteState.invite;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("auth.register.title")}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.register.name")}</Label>
            <Input
              id="name"
              type="text"
              className="min-h-[44px]"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.register.emailPreFilled", { defaultValue: t("auth.register.email") })}</Label>
            <Input
              id="email"
              type="email"
              readOnly
              className="min-h-[44px] bg-muted"
              defaultValue={invite.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.register.password")}</Label>
            <Input
              id="password"
              type="password"
              className="min-h-[44px]"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="min-h-[44px] w-full" disabled={isSubmitting}>
            {t("auth.register.submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-primary underline">
            {t("auth.login.title")}
          </Link>
        </p>
      </div>
    </div>
  );
}
