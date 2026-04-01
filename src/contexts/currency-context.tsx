"use client";
import { createContext, useContext, useState, useEffect } from "react";
import type { Currency } from "@/domain/schemas/currency";
import { usePropertyContext } from "@/contexts/property-context";

type CurrencyContextValue = {
  code: string | null;
  locale: string | null;
  availableCurrencies: Currency[];
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  code: null,
  locale: null,
  availableCurrencies: [],
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  const propertyCtx = usePropertyContext();
  const activePropertyId = propertyCtx?.activePropertyId ?? null;
  const properties = propertyCtx?.properties ?? [];
  const propertiesLoading = propertyCtx?.isLoading ?? true;

  useEffect(() => {
    fetch("/api/currencies")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) { setAvailableCurrencies(res.data); }
        setCurrenciesLoading(false);
      })
      .catch(() => setCurrenciesLoading(false));
  }, []);

  const activeProperty = properties.find((p) => p.id === activePropertyId) ?? null;
  const code: string | null = activeProperty?.currency ?? null;
  const locale: string | null = availableCurrencies.find((c) => c.code === code)?.locale ?? null;
  const isLoading = currenciesLoading || propertiesLoading;

  return (
    <CurrencyContext.Provider value={{ code, locale, availableCurrencies, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
