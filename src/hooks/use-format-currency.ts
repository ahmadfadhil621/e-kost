"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useFormatCurrency(): (value: number) => string {
  const { t } = useTranslation();
  const code = t("currency.code") || "EUR";
  const locale = t("currency.locale") || "en-IE";
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
      }),
    [locale, code],
  );

  return (value: number) => formatter.format(value);
}
