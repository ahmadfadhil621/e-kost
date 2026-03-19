"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, DoorOpen, Users, Wallet } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { cn } from "@/lib/utils";

const navItems = [
  { hrefSegment: "/", pathMatch: (p: string) => p === "/", icon: LayoutDashboard, key: "overview" },
  { hrefSegment: "/rooms", pathMatch: (p: string) => p.includes("/rooms"), icon: DoorOpen, key: "rooms" },
  { hrefSegment: "/tenants", pathMatch: (p: string) => p.includes("/tenants"), icon: Users, key: "tenants" },
  { hrefSegment: "/finance", pathMatch: (p: string) => p.includes("/finance"), icon: Wallet, key: "finance" },
] as const;

export function AppNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const activeId = usePropertyContext()?.activePropertyId ?? null;

  const baseHref = activeId ? `/properties/${activeId}` : "#";

  return (
    <nav
      role="navigation"
      aria-label={t("nav.overview")}
      className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-center gap-2 border-t border-border bg-card px-2"
    >
      {navItems.map(({ hrefSegment, pathMatch, icon: Icon, key }) => {
        const href =
          activeId
            ? hrefSegment === "/"
              ? "/"
              : `${baseHref}${hrefSegment}`
            : "#";
        const isActive = pathMatch(pathname);
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-2 text-[11px] font-semibold transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{t(`nav.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
