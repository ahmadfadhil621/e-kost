"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronDown, Plus, List } from "lucide-react";
import { usePropertyContext } from "@/contexts/property-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  if (properties.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="min-h-[44px] min-w-[44px]"
        onClick={() => router.push("/properties")}
      >
        {t("property.list.title")}
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] gap-1"
          aria-label={t("property.list.title")}
        >
          <span className="max-w-[120px] truncate">{activeName}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{t("property.list.title")}</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 flex flex-col gap-1">
          {properties.map((p) => (
            <li key={p.id}>
              <Button
                variant={p.id === activeId ? "secondary" : "ghost"}
                className="h-12 w-full justify-start min-h-[44px] min-w-[44px]"
                onClick={() => handleSelect(p.id)}
              >
                {p.name}
              </Button>
            </li>
          ))}
          <li className="mt-2 border-t pt-2">
            <Button
              variant="ghost"
              className="h-12 w-full justify-start gap-2 min-h-[44px] min-w-[44px]"
              onClick={() => closeAndGo("/properties/new")}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t("property.list.addProperty")}
            </Button>
            <Button
              variant="ghost"
              className="h-12 w-full justify-start gap-2 min-h-[44px] min-w-[44px]"
              onClick={() => closeAndGo("/properties")}
            >
              <List className="h-4 w-4 shrink-0" aria-hidden />
              {t("property.list.viewAll")}
            </Button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}
