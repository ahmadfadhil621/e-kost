"use client";

import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/currency-context";

export function CurrencySelector() {
  const { t } = useTranslation();
  const { code, availableCurrencies, setCurrency } = useCurrency();

  if (availableCurrencies.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="currency-heading">
      <h2
        id="currency-heading"
        className="text-base font-semibold text-foreground"
      >
        {t("settings.currency.label")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.currency.description")}
      </p>
      <div className="mt-2">
        <label htmlFor="currency-selector" className="sr-only">
          {t("settings.currency.label")}
        </label>
        <select
          id="currency-selector"
          role="combobox"
          value={code}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]"
        >
          {availableCurrencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
