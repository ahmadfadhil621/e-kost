import type { CashflowEntry } from "@/domain/schemas/cashflow";

export function calculateNetIncome(entries: CashflowEntry[]): number {
  return entries.reduce(
    (sum, entry) => (entry.type === "income" ? sum + entry.amount : sum - entry.amount),
    0
  );
}
