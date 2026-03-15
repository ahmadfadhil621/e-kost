"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PropertySelector() {
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = usePropertyContext();
  const properties = ctx?.properties ?? [];

  const handleSelect = (id: string) => {
    ctx?.setActivePropertyId(id);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <h2 className="text-lg font-semibold text-foreground">
        {t("property.selector.title")}
      </h2>
      <ul className="flex flex-col gap-3">
        {properties.map((p) => (
          <li key={p.id}>
            <Card
              role="button"
              tabIndex={0}
              className={cn(
                "cursor-pointer border border-border bg-card transition-colors",
                "hover:bg-accent active:bg-accent",
                "min-h-[44px]"
              )}
              onClick={() => handleSelect(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(p.id);
                }
              }}
            >
              <CardContent className="flex flex-row items-center gap-3 p-4">
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{p.name}</p>
                  {p.address ? (
                    <p className="text-sm text-muted-foreground truncate">{p.address}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
