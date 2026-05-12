import type { Expense, ExpenseExportRow } from "@/domain/schemas/expense";

export function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    category: "electricity",
    amount: 80,
    date: new Date("2026-03-01"),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createExpenseExportRow(overrides: Partial<ExpenseExportRow> = {}): ExpenseExportRow {
  return {
    date: new Date("2026-03-01"),
    category: "electricity",
    amount: 150_000,
    description: null,
    ...overrides,
  };
}
