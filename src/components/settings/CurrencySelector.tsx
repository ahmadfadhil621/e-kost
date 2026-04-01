"use client";

import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <Select value={code} onValueChange={setCurrency}>
          <SelectTrigger
            id="currency-selector"
            aria-labelledby="currency-heading"
            className="w-full min-h-[44px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
