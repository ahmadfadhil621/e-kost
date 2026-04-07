import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseFilters,
  ExpenseSummary,
  UpdateExpenseInput,
} from "@/domain/schemas/expense";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/domain/schemas/expense";
import type { PropertyRole } from "@/domain/schemas/property";
import type { LogActivityFn } from "@/lib/activity-log-service";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class ExpenseService {
  constructor(
    private readonly repo: IExpenseRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly logActivity?: LogActivityFn
  ) {}

  async createExpense(
    userId: string,
    propertyId: string,
    data: CreateExpenseInput
  ): Promise<Expense> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createExpenseSchema.parse(data);
    const date = new Date(parsed.date);
    const expense = await this.repo.create({
      propertyId,
      category: parsed.category,
      amount: parsed.amount,
      date,
      description: parsed.description,
    });
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_CREATED",
      entityType: "EXPENSE",
      entityId: expense.id,
      metadata: { amount: parsed.amount, category: parsed.category },
    });
    return expense;
  }

  async listExpenses(
    userId: string,
    propertyId: string,
    filters?: ExpenseFilters
  ): Promise<Expense[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const list = await this.repo.findByProperty(propertyId, {
      year: filters?.year,
      month: filters?.month,
      category: filters?.category,
    });
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpense(
    userId: string,
    propertyId: string,
    expenseId: string
  ): Promise<Expense | null> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const expense = await this.repo.findById(expenseId);
    if (!expense || expense.propertyId !== propertyId) {
      return null;
    }
    return expense;
  }

  async updateExpense(
    userId: string,
    propertyId: string,
    expenseId: string,
    data: UpdateExpenseInput
  ): Promise<Expense> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(expenseId);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Expense not found");
    }
    const parsed = updateExpenseSchema.parse(data);
    const updateData: Partial<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }> = {};
    if (parsed.category !== undefined) {
      updateData.category = parsed.category;
    }
    if (parsed.amount !== undefined) {
      updateData.amount = parsed.amount;
    }
    if (parsed.date !== undefined) {
      updateData.date = new Date(parsed.date);
    }
    if (parsed.description !== undefined) {
      updateData.description = parsed.description;
    }
    if (Object.keys(updateData).length === 0) {
      return existing;
    }
    const updated = await this.repo.update(expenseId, updateData);
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_UPDATED",
      entityType: "EXPENSE",
      entityId: expenseId,
      metadata: { amount: updated.amount, category: updated.category },
    });
    return updated;
  }

  async deleteExpense(
    userId: string,
    propertyId: string,
    expenseId: string
  ): Promise<void> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(expenseId);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Expense not found");
    }
    await this.repo.delete(expenseId);
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_DELETED",
      entityType: "EXPENSE",
      entityId: expenseId,
      metadata: { amount: existing.amount, category: existing.category },
    });
  }

  async getMonthlyExpenseSummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<ExpenseSummary> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const [totalExpenses, categories] = await Promise.all([
      this.repo.sumByMonth(propertyId, year, month),
      this.repo.sumByMonthGroupedByCategory(propertyId, year, month),
    ]);
    const sorted = [...categories].sort((a, b) => b.total - a.total);
    return { totalExpenses, categories: sorted };
  }
}
