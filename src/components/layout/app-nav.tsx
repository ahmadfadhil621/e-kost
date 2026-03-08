"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, key: "dashboard" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function AppNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label={t("nav.settings")}
      className="flex items-center justify-center gap-4 border-t bg-background px-4 py-3"
    >
      {navItems.map(({ href, icon: Icon, key }) => {
        const isActive =
          (href === "/" && pathname === "/") ||
          (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "font-semibold text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
