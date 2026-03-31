import type { Currency } from "@/domain/schemas/currency";

export function createCurrency(overrides: Partial<Currency> = {}): Currency {
  return {
    id: crypto.randomUUID(),
    code: "EUR",
    locale: "en-IE",
    label: "Euro",
    createdAt: new Date(),
    ...overrides,
  };
}
