"use client";

import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = {
  value: string;
  labelKey: string;
  Icon: React.ElementType;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", labelKey: "settings.appearance.light", Icon: Sun },
  { value: "dark", labelKey: "settings.appearance.dark", Icon: Moon },
  { value: "system", labelKey: "settings.appearance.system", Icon: Monitor },
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <section aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="text-base font-semibold text-foreground">
        {t("settings.appearance.title")}
      </h2>
      <div className="mt-3 flex gap-2">
        {THEME_OPTIONS.map(({ value, labelKey, Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              aria-pressed={isActive}
              onClick={() => setTheme(value)}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
