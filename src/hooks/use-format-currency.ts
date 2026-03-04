"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useFormatCurrency(): (value: number) => string {
  const { t, i18n } = useTranslation();
  const formatter = useMemo(() => {
    const code = t("currency.code") || "EUR";
    const locale = t("currency.locale") || "en-IE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    });
  }, [t, i18n.language]);

  return (value: number) => formatter.format(value);
}
