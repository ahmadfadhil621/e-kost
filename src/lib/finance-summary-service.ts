import type { ExpenseService } from "@/lib/expense-service";
import type { FinanceSummary } from "@/domain/schemas/expense";

export interface IMonthlyIncomeSource {
  getMonthlyIncome(
    propertyId: string,
    year: number,
    month: number
  ): Promise<number>;
}

export class FinanceSummaryService {
  constructor(
    private readonly incomeSource: IMonthlyIncomeSource,
    private readonly expenseService: ExpenseService
  ) {}

  async getMonthlySummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<FinanceSummary> {
    const [income, expenseSummary] = await Promise.all([
      this.incomeSource.getMonthlyIncome(propertyId, year, month),
      this.expenseService.getMonthlyExpenseSummary(
        userId,
        propertyId,
        year,
        month
      ),
    ]);
    const expenses = expenseSummary.totalExpenses;
    const netIncome = income - expenses;
    return {
      year,
      month,
      income,
      expenses,
      netIncome,
      categoryBreakdown: expenseSummary.categories,
    };
  }
}
