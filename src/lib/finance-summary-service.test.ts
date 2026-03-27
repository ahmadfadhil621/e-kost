// Traceability: finance-expense-tracking
// REQ 5.2 -> it('getMonthlySummary returns income from income source (PROP 2)')
// REQ 6.2 -> it('getMonthlySummary returns expenses from expense service (PROP 3)')
// REQ 7.1 -> it('getMonthlySummary returns net income as income minus expenses (PROP 4)')
// REQ 6.3 -> it('getMonthlySummary includes category breakdown (PROP 5)')
// REQ 8.2, 8.3 -> it('getMonthlySummary uses only selected month data (PROP 8)'), it('getMonthlySummary returns year and month in result') -- month nav updates data
// PROP 2 -> it('getMonthlySummary returns income from income source (PROP 2)')
// PROP 3 -> it('getMonthlySummary returns expenses from expense service (PROP 3)')
// PROP 4 -> it('getMonthlySummary returns net income as income minus expenses (PROP 4)')
// PROP 5 -> it('getMonthlySummary includes category breakdown (PROP 5)')
// PROP 8 -> it('getMonthlySummary uses only selected month data (PROP 8)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { FinanceSummaryService } from "./finance-summary-service";
import type { ExpenseService } from "./expense-service";
import type { IMonthlyIncomeSource } from "./finance-summary-service";
import type { CategoryBreakdown } from "@/domain/schemas/expense";

function createMockIncomeSource(
  overrides: Partial<IMonthlyIncomeSource> = {}
): IMonthlyIncomeSource {
  return {
    getMonthlyIncome: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function createMockExpenseService(
  overrides: Partial<ExpenseService> = {}
): ExpenseService {
  return {
    getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
      totalExpenses: 0,
      categories: [],
    }),
    ...overrides,
  } as unknown as ExpenseService;
}

describe("FinanceSummaryService", () => {
  describe("getMonthlySummary", () => {
    describe("good cases", () => {
      it("getMonthlySummary returns income from income source (PROP 2)", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(1000000),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 0,
            categories: [],
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          userId,
          propertyId,
          2026,
          3
        );

        expect(result.income).toBe(1000000);
        expect(result.expenses).toBe(0);
        expect(result.netIncome).toBe(1000000);
        expect(incomeSource.getMonthlyIncome).toHaveBeenCalledWith(
          userId,
          propertyId,
          2026,
          3
        );
      });

      it("getMonthlySummary returns expenses from expense service (PROP 3)", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const categories: CategoryBreakdown[] = [
          { category: "electricity", total: 300000, count: 1 },
        ];
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(0),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 300000,
            categories,
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          userId,
          propertyId,
          2026,
          3
        );

        expect(result.expenses).toBe(300000);
        expect(result.categoryBreakdown).toEqual(categories);
        expect(expenseService.getMonthlyExpenseSummary).toHaveBeenCalledWith(
          userId,
          propertyId,
          2026,
          3
        );
      });

      it("getMonthlySummary returns net income as income minus expenses (PROP 4)", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(2000000),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 500000,
            categories: [],
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          userId,
          propertyId,
          2026,
          3
        );

        expect(result.income).toBe(2000000);
        expect(result.expenses).toBe(500000);
        expect(result.netIncome).toBe(1500000);
      });

      it("getMonthlySummary returns negative net when expenses exceed income (PROP 4)", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(100000),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 500000,
            categories: [],
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          userId,
          propertyId,
          2026,
          3
        );

        expect(result.netIncome).toBe(-400000);
      });

      it("getMonthlySummary includes category breakdown (PROP 5)", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const categories: CategoryBreakdown[] = [
          { category: "electricity", total: 400000, count: 2 },
          { category: "water", total: 100000, count: 1 },
        ];
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(0),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 500000,
            categories,
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          userId,
          propertyId,
          2026,
          3
        );

        expect(result.categoryBreakdown).toHaveLength(2);
        expect(result.categoryBreakdown[0].category).toBe("electricity");
        expect(result.categoryBreakdown[0].total).toBe(400000);
        expect(result.categoryBreakdown[1].total).toBe(100000);
      });

      it("getMonthlySummary returns year and month in result", async () => {
        const incomeSource = createMockIncomeSource();
        const expenseService = createMockExpenseService();
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          "user-1",
          "prop-1",
          2026,
          5
        );

        expect(result.year).toBe(2026);
        expect(result.month).toBe(5);
      });
    });

    describe("bad cases", () => {
      it("getMonthlySummary propagates error when income source throws", async () => {
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        const expenseService = createMockExpenseService();
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        await expect(
          service.getMonthlySummary("user-1", "prop-1", 2026, 3)
        ).rejects.toThrow("Network error");
      });
    });

    describe("edge cases", () => {
      it("getMonthlySummary uses only selected month data (PROP 8) - calls with correct year and month", async () => {
        const userId = crypto.randomUUID();
        const propertyId = crypto.randomUUID();
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(0),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 0,
            categories: [],
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        await service.getMonthlySummary(userId, propertyId, 2025, 12);

        expect(incomeSource.getMonthlyIncome).toHaveBeenCalledWith(
          userId,
          propertyId,
          2025,
          12
        );
        expect(expenseService.getMonthlyExpenseSummary).toHaveBeenCalledWith(
          userId,
          propertyId,
          2025,
          12
        );
      });

      it("returns zero income and zero expenses when both sources return zero", async () => {
        const incomeSource = createMockIncomeSource({
          getMonthlyIncome: vi.fn().mockResolvedValue(0),
        });
        const expenseService = createMockExpenseService({
          getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
            totalExpenses: 0,
            categories: [],
          }),
        });
        const service = new FinanceSummaryService(
          incomeSource,
          expenseService
        );

        const result = await service.getMonthlySummary(
          "user-1",
          "prop-1",
          2026,
          1
        );

        expect(result.income).toBe(0);
        expect(result.expenses).toBe(0);
        expect(result.netIncome).toBe(0);
        expect(result.categoryBreakdown).toEqual([]);
      });
    });
  });

  describe("property-based tests", () => {
    it("Property 2: monthly income equals value from income source", () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 0, max: 10000000 }),
          fc.integer({ min: 0, max: 10000000 }),
          async (userId, propertyId, income, expenses) => {
            const incomeSource = createMockIncomeSource({
              getMonthlyIncome: vi.fn().mockResolvedValue(income),
            });
            const expenseService = createMockExpenseService({
              getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
                totalExpenses: expenses,
                categories: [],
              }),
            });
            const service = new FinanceSummaryService(
              incomeSource,
              expenseService
            );
            const result = await service.getMonthlySummary(
              userId,
              propertyId,
              2026,
              3
            );
            expect(result.income).toBe(income);
            expect(result.expenses).toBe(expenses);
            expect(result.netIncome).toBe(income - expenses);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 4: net income = income - expenses for any values", () => {
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000000 }),
          fc.integer({ min: 0, max: 10000000 }),
          async (income, expenses) => {
            const incomeSource = createMockIncomeSource({
              getMonthlyIncome: vi.fn().mockResolvedValue(income),
            });
            const expenseService = createMockExpenseService({
              getMonthlyExpenseSummary: vi.fn().mockResolvedValue({
                totalExpenses: expenses,
                categories: [],
              }),
            });
            const service = new FinanceSummaryService(
              incomeSource,
              expenseService
            );
            const result = await service.getMonthlySummary(
              "user-1",
              "prop-1",
              2026,
              3
            );
            expect(result.netIncome).toBe(income - expenses);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
