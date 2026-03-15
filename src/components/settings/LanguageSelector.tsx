"use client";

import { useTranslation } from "react-i18next";
import { LANGUAGE_KEY } from "@/lib/i18n";

type LanguageSelectorProps = {
  availableLocales: string[];
};

export function LanguageSelector({ availableLocales }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (localeCode: string) => {
    i18n.changeLanguage(localeCode);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_KEY, localeCode);
    }
  };

  if (availableLocales.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="language-heading">
      <h2
        id="language-heading"
        className="text-base font-semibold text-foreground"
      >
        {t("settings.language.title")}
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {availableLocales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageChange(code)}
            aria-pressed={i18n.language === code}
            className="flex min-h-[44px] min-w-[44px] items-center justify-between rounded-md border bg-background px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <span>{t(`settings.locale.${code}`)}</span>
            {i18n.language === code && (
              <span aria-hidden className="text-primary">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
