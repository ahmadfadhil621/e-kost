"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/domain/schemas/auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginForm() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await signIn(data.email, data.password);
      window.location.href = "/";
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : t("auth.error.generic");
      setServerError(message);
    }
  };

  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        setServerError(body.error ?? t("auth.error.generic"));
      } else {
        window.location.href = "/";
      }
    } catch {
      setServerError(t("auth.error.generic"));
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm border border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <Building2 className="h-8 w-8 text-foreground" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("app.name")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("app.tagline")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                {t("auth.login.email")}
              </Label>
              <Input
                id="email"
                type="email"
                className="min-h-[44px] border-input bg-background text-foreground"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                {t("auth.login.password")}
              </Label>
              <Input
                id="password"
                type="password"
                className="min-h-[44px] border-input bg-background text-foreground"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="min-h-[44px] w-full bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {t("auth.login.signIn")}
            </Button>
          </form>

          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] w-full border-input bg-background text-muted-foreground"
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
          >
            {t("auth.login.demo")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary underline">
              {t("auth.register.title")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
