"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Building2, ChevronDown, Plus, List } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PropertySwitcher() {
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = usePropertyContext();
  const [open, setOpen] = useState(false);

  const properties = ctx?.properties ?? [];
  const activeId = ctx?.activePropertyId ?? null;
  const activeName =
    properties.find((p) => p.id === activeId)?.name ?? t("property.list.title");

  const handleSelect = (id: string) => {
    ctx?.setActivePropertyId(id);
    setOpen(false);
    router.push("/");
  };

  const closeAndGo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] gap-1.5 text-foreground font-semibold hover:bg-accent"
          aria-label={t("property.list.title")}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="max-w-[140px] truncate">{activeName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-0"
        role="dialog"
        aria-label={t("property.list.title")}
      >
        {properties.length === 0 ? (
          <div className="p-2 space-y-1">
            <p className="px-2 py-2 text-sm text-muted-foreground">
              {t("property.list.empty")}
            </p>
            <Button
              variant="default"
              className="h-11 w-full justify-start gap-2 min-h-[44px]"
              onClick={() => closeAndGo("/properties/new")}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t("property.list.addProperty")}
            </Button>
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2 min-h-[44px]"
              onClick={() => closeAndGo("/properties")}
            >
              <List className="h-4 w-4 shrink-0" aria-hidden />
              {t("property.list.viewAll")}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 p-2">
            {properties.map((p) => (
              <li key={p.id}>
                <Button
                  variant={p.id === activeId ? "secondary" : "ghost"}
                  className="h-11 w-full justify-start min-h-[44px]"
                  onClick={() => handleSelect(p.id)}
                >
                  {p.name}
                </Button>
              </li>
            ))}
            <li className="mt-2 border-t pt-2 flex flex-col gap-1">
              <Button
                variant="ghost"
                className="h-11 w-full justify-start gap-2 min-h-[44px]"
                onClick={() => closeAndGo("/properties/new")}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t("property.list.addProperty")}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full justify-start gap-2 min-h-[44px]"
                onClick={() => closeAndGo("/properties")}
              >
                <List className="h-4 w-4 shrink-0" aria-hidden />
                {t("property.list.viewAll")}
              </Button>
            </li>
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
