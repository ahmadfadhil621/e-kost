import type { CashflowEntry } from "@/domain/schemas/cashflow";

export function createCashflowEntry(
  overrides: Partial<CashflowEntry> = {}
): CashflowEntry {
  return {
    id: crypto.randomUUID(),
    date: "2026-03-15",
    type: "income",
    description: "John Doe",
    amount: 650,
    ...overrides,
  };
}
