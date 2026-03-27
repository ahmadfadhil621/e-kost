"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, DoorOpen, Users, Wallet, LockKeyhole } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { hrefSegment: "/", pathMatch: (p: string) => p === "/", icon: LayoutDashboard, key: "overview", requiresProperty: false },
  { hrefSegment: "/rooms", pathMatch: (p: string) => p.includes("/rooms"), icon: DoorOpen, key: "rooms", requiresProperty: true },
  { hrefSegment: "/tenants", pathMatch: (p: string) => p.includes("/tenants"), icon: Users, key: "tenants", requiresProperty: true },
  { hrefSegment: "/finance", pathMatch: (p: string) => p.includes("/finance"), icon: Wallet, key: "finance", requiresProperty: true },
] as const;

export function AppNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const activeId = usePropertyContext()?.activePropertyId ?? null;

  const baseHref = activeId ? `/properties/${activeId}` : "#";

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        role="navigation"
        aria-label={t("nav.overview")}
        className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-center border-t border-border bg-card"
      >
        {/* Shared max-width scale: max-w-[480px] md:max-w-2xl lg:max-w-3xl — keep in sync with layout.tsx and app-header.tsx */}
        <div className="flex w-full max-w-[480px] md:max-w-2xl lg:max-w-3xl items-center justify-center gap-2 px-2">
          {navItems.map(({ hrefSegment, pathMatch, icon: Icon, key, requiresProperty }) => {
            const isDisabled = requiresProperty && !activeId;
            const href =
              activeId
                ? hrefSegment === "/"
                  ? "/"
                  : `${baseHref}${hrefSegment}`
                : "#";
            const isActive = pathMatch(pathname);

            const itemContent = (
              <span className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold">
                {isDisabled ? (
                  <LockKeyhole className="h-5 w-5" aria-hidden />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden />
                )}
                <span>{t(`nav.${key}`)}</span>
              </span>
            );

            const baseItemClass = cn(
              "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center rounded-md px-2 py-2 transition-colors",
              isActive && !isDisabled
                ? "text-primary"
                : "text-muted-foreground",
              isDisabled
                ? "pointer-events-none cursor-not-allowed opacity-50"
                : "hover:text-foreground"
            );

            if (isDisabled) {
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <span
                      role="link"
                      aria-disabled="true"
                      tabIndex={0}
                      className={baseItemClass}
                    >
                      {itemContent}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{t("nav.noActiveProperty.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={key}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={baseItemClass}
              >
                {itemContent}
              </Link>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}

