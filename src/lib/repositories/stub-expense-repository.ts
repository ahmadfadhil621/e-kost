import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type { Expense, CategoryBreakdown } from "@/domain/schemas/expense";

export class StubExpenseRepository implements IExpenseRepository {
  async create(): Promise<Expense> {
    throw new Error("Not implemented");
  }

  async findById(): Promise<Expense | null> {
    throw new Error("Not implemented");
  }

  async findByProperty(): Promise<Expense[]> {
    throw new Error("Not implemented");
  }

  async update(): Promise<Expense> {
    throw new Error("Not implemented");
  }

  async delete(): Promise<void> {
    throw new Error("Not implemented");
  }

  async sumByMonth(): Promise<number> {
    throw new Error("Not implemented");
  }

  async sumByMonthGroupedByCategory(): Promise<CategoryBreakdown[]> {
    throw new Error("Not implemented");
  }
}
