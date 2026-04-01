"use client";

import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/currency-context";

/**
 * Displays the currently active property's currency.
 * Currency is now property-level and read-only after creation.
 * This component is kept for reference; the currency selector
 * for property creation lives in PropertyForm.
 */
export function CurrencySelector() {
  const { t } = useTranslation();
  const { code, availableCurrencies } = useCurrency();

  if (!code || availableCurrencies.length === 0) {
    return null;
  }

  const currency = availableCurrencies.find((c) => c.code === code);

  return (
    <section aria-labelledby="currency-heading">
      <h2 id="currency-heading" className="text-base font-semibold text-foreground">
        {t("property.currency.label")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {currency?.label ?? code}
      </p>
    </section>
  );
}
