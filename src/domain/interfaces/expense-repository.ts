import type {
  Expense,
  CategoryBreakdown,
} from "@/domain/schemas/expense";

export interface IExpenseRepository {
  create(data: {
    propertyId: string;
    category: string;
    amount: number;
    date: Date;
    description?: string;
    actorId?: string;
  }): Promise<Expense>;
  findById(id: string): Promise<Expense | null>;
  findByProperty(
    propertyId: string,
    filters?: { year?: number; month?: number; category?: string }
  ): Promise<Expense[]>;
  update(
    id: string,
    data: Partial<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }>
  ): Promise<Expense>;
  delete(id: string): Promise<void>;
  sumByMonth(propertyId: string, year: number, month: number): Promise<number>;
  sumByMonthGroupedByCategory(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CategoryBreakdown[]>;
}
