"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Currency } from "@/domain/schemas/currency";

type CurrencyContextValue = {
  code: string;
  locale: string;
  availableCurrencies: Currency[];
  setCurrency: (code: string) => Promise<void>;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  code: "EUR",
  locale: "en-IE",
  availableCurrencies: [],
  setCurrency: async () => {},
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState("EUR");
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/currency").then((r) => r.json()),
      fetch("/api/currencies").then((r) => r.json()),
    ]).then(([currencyRes, listRes]) => {
      if (currencyRes.data?.currency) { setCode(currencyRes.data.currency); }
      if (listRes.data) { setAvailableCurrencies(listRes.data); }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const locale = availableCurrencies.find((c) => c.code === code)?.locale ?? "en-IE";

  const setCurrency = useCallback(async (newCode: string) => {
    setCode(newCode);
    await fetch("/api/user/currency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: newCode }),
    });
  }, []);

  return (
    <CurrencyContext.Provider value={{ code, locale, availableCurrencies, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
