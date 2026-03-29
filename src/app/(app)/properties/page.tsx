"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PropertiesListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = usePropertyContext();
  const { properties, activePropertyId, setActivePropertyId, isLoading } =
    ctx ?? {
      properties: [],
      activePropertyId: null,
      setActivePropertyId: () => {},
      isLoading: true,
    };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <p className="text-muted-foreground">{t("property.list.empty")}</p>
        <Button asChild className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("property.list.title")}</h2>
        <Button asChild size="sm" className="min-h-[44px] min-w-[44px]">
          <Link href="/properties/new">{t("property.create.submit")}</Link>
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {properties.map((p) => {
          const isActive = activePropertyId === p.id;
          return (
            <li key={p.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActivePropertyId(p.id);
                  router.push("/");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setActivePropertyId(p.id);
                    router.push("/");
                  }
                }}
                className="cursor-pointer"
              >
                <Card
                  className={`transition-colors hover:bg-muted/50 ${isActive ? "border-primary" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary">
                          {isActive && (
                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                          )}
                        </div>
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                      <Link
                        href={`/properties/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={p.name}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.address || "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
