import type { Expense } from "@/domain/schemas/expense";

export function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    category: "electricity",
    amount: 150000,
    date: new Date("2026-03-01"),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
