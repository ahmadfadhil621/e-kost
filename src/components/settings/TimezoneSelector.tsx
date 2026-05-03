"use client";

import { useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { CURATED_TIMEZONES } from "@/domain/schemas/user";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TimezoneSelector() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const currentTz = user?.timezone ?? null;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(currentTz);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const listboxId = useId();

  const filtered = CURATED_TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(search.toLowerCase())
  );

  const isDirty = selected !== currentTz && selected !== null;

  function handleSelect(tz: string) {
    setSelected(tz);
    setOpen(false);
    setSearch("");
    setSaved(false);
  }

  async function handleSave() {
    if (!selected) { return; }
    setSaving(true);
    try {
      await fetch("/api/user/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: selected }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const triggerLabel = selected ?? t("settings.timezone.placeholder");

  return (
    <section aria-labelledby="timezone-heading" aria-label={t("settings.timezone.label")}>
      <h2 id="timezone-heading" className="text-base font-semibold text-foreground">
        {t("settings.timezone.label")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.timezone.description")}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={t("settings.timezone.label")}
              className="w-full justify-start font-normal"
            >
              {triggerLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-2" align="start">
            <Input
              placeholder={t("settings.timezone.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t("settings.timezone.label")}
              className="max-h-60 overflow-y-auto"
            >
              {filtered.map((tz) => (
                <li
                  key={tz}
                  role="option"
                  aria-selected={selected === tz}
                  onClick={() => handleSelect(tz)}
                  className="cursor-pointer rounded px-3 py-2 text-sm hover:bg-muted aria-selected:font-medium"
                >
                  {tz}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {t("settings.timezone.noResults")}
                </li>
              )}
            </ul>
          </PopoverContent>
        </Popover>

        {isDirty && (
          <Button onClick={handleSave} disabled={saving} className="self-start">
            {t("common.save")}
          </Button>
        )}

        {saved && (
          <p role="status" className="text-sm text-primary">
            {t("settings.timezone.saved")}
          </p>
        )}
      </div>
    </section>
  );
}
