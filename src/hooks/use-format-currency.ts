"use client";

import { useMemo } from "react";
import { useCurrency } from "@/contexts/currency-context";

export function useFormatCurrency(): (value: number) => string {
  const { code, locale } = useCurrency();
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: code }),
    [locale, code],
  );

  return (value: number) => formatter.format(value);
}
