// Traceability: finance-expense-tracking
// REQ 1.2 -> it('rejects when category is invalid (PROP 6)')
// REQ 1.3 -> it('creates expense with valid data and returns expense with id and timestamp')
// REQ 1.4 -> it('rejects when required fields are missing')
// REQ 1.5 -> it('rejects when amount is zero or negative (PROP 7)')
// REQ 1.6 -> it('creates expense with valid data and returns expense with id and timestamp')
// REQ 2.1, 2.3 -> it('listExpenses returns expenses sorted by date descending')
// REQ 2.5 -> it('listExpenses supports year and month filters')
// REQ 3.2, 3.3 -> it('updateExpense updates and returns expense'), it('updateExpense preserves id and createdAt')
// REQ 3.4 -> it('updateExpense preserves id and createdAt')
// REQ 3.5 -> it('rejects update when amount is negative')
// REQ 4.3 -> it('deleteExpense removes expense')
// REQ 6.2 -> it('getMonthlyExpenseSummary returns total and category breakdown (PROP 3)')
// REQ 6.3 -> it('getMonthlyExpenseSummary returns categories sorted by total descending (PROP 5)')
// PROP 1 -> it('expense creation round trip (PROP 1)')
// PROP 3 -> it('getMonthlyExpenseSummary returns total and category breakdown (PROP 3)')
// PROP 5 -> it('getMonthlyExpenseSummary returns categories sorted by total descending (PROP 5)')
// PROP 6 -> it('rejects when category is invalid (PROP 6)')
// PROP 7 -> it('rejects when amount is zero or negative (PROP 7)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { ExpenseService } from "./expense-service";
import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type { CategoryBreakdown } from "@/domain/schemas/expense";
import { createExpense } from "@/test/fixtures/expense";

function createMockExpenseRepo(
  overrides: Partial<IExpenseRepository> = {}
): IExpenseRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    sumByMonth: vi.fn(),
    sumByMonthGroupedByCategory: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("ExpenseService", () => {
  describe("createExpense", () => {
    describe("good cases", () => {
      it("creates expense with valid data and returns expense with id and timestamp", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createExpense({
          propertyId,
          category: "electricity",
          amount: 50000,
          date: new Date("2026-03-15"),
        });
        const repo = createMockExpenseRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.createExpense(userId, propertyId, {
          category: "electricity",
          amount: 50000,
          date: "2026-03-15",
        });

        expect(result.id).toBe(created.id);
        expect(result.propertyId).toBe(propertyId);
        expect(result.category).toBe("electricity");
        expect(result.amount).toBe(50000);
        expect(result.date).toEqual(new Date("2026-03-15"));
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(repo.create).toHaveBeenCalledWith({
          propertyId,
          category: "electricity",
          amount: 50000,
          date: new Date("2026-03-15"),
          description: undefined,
        });
      });

      it("expense creation round trip (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createExpense({
          propertyId,
          category: "water",
          amount: 100000,
          date: new Date("2026-02-01"),
          description: "Monthly bill",
        });
        const repo = createMockExpenseRepo({
          create: vi.fn().mockResolvedValue(created),
          findByProperty: vi.fn().mockResolvedValue([created]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.createExpense(userId, propertyId, {
          category: "water",
          amount: 100000,
          date: "2026-02-01",
          description: "Monthly bill",
        });

        expect(result.id).toBe(created.id);
        expect(result.category).toBe(created.category);
        expect(result.amount).toBe(created.amount);
        expect(result.description).toBe(created.description);

        const list = await service.listExpenses(userId, propertyId);
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe(created.id);
        expect(list[0].amount).toBe(100000);
      });
    });

    describe("bad cases", () => {
      it("rejects when required fields are missing", async () => {
        const repo = createMockExpenseRepo();
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "electricity",
            amount: -1,
            date: "2026-03-01",
          })
        ).rejects.toThrow(/positive|amount/i);

        expect(repo.create).not.toHaveBeenCalled();
      });

      it("rejects when amount is zero or negative (PROP 7)", async () => {
        const repo = createMockExpenseRepo();
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "electricity",
            amount: 0,
            date: "2026-03-01",
          })
        ).rejects.toThrow();

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "water",
            amount: -100,
            date: "2026-03-01",
          })
        ).rejects.toThrow();

        expect(repo.create).not.toHaveBeenCalled();
      });

      it("rejects when category is invalid (PROP 6)", async () => {
        const repo = createMockExpenseRepo();
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "invalid_category" as "electricity",
            amount: 100,
            date: "2026-03-01",
          })
        ).rejects.toThrow();

        expect(repo.create).not.toHaveBeenCalled();
      });

      it("rejects when date is invalid", async () => {
        const repo = createMockExpenseRepo();
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "electricity",
            amount: 100,
            date: "not-a-date",
          })
        ).rejects.toThrow();

        expect(repo.create).not.toHaveBeenCalled();
      });

      it("returns 403 when not authenticated", async () => {
        const repo = createMockExpenseRepo();
        const propertyAccess = createMockPropertyAccess();
        vi.mocked(propertyAccess.validateAccess).mockRejectedValueOnce(
          new Error("Forbidden")
        );
        const service = new ExpenseService(repo, propertyAccess);

        await expect(
          service.createExpense("user-1", "prop-1", {
            category: "electricity",
            amount: 100,
            date: "2026-03-01",
          })
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("accepts optional description and passes to repo", async () => {
        const propertyId = crypto.randomUUID();
        const created = createExpense({
          propertyId,
          description: "Long description here",
        });
        const repo = createMockExpenseRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.createExpense("user-1", propertyId, {
          category: "other",
          amount: 1,
          date: "2026-03-01",
          description: "Long description here",
        });

        expect(repo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            description: "Long description here",
          })
        );
      });

      it("accepts all valid categories", async () => {
        const categories = [
          "electricity",
          "water",
          "internet",
          "maintenance",
          "cleaning",
          "supplies",
          "tax",
          "transfer",
          "other",
        ] as const;
        const propertyId = crypto.randomUUID();
        for (const category of categories) {
          const created = createExpense({ propertyId, category });
          const repo = createMockExpenseRepo({
            create: vi.fn().mockResolvedValue(created),
          });
          const service = new ExpenseService(
            repo,
            createMockPropertyAccess()
          );
          const result = await service.createExpense("user-1", propertyId, {
            category,
            amount: 1,
            date: "2026-03-01",
          });
          expect(result.category).toBe(category);
        }
      });
    });
  });

  describe("listExpenses", () => {
    describe("good cases", () => {
      it("listExpenses returns expenses sorted by date descending", async () => {
        const propertyId = crypto.randomUUID();
        const expenses = [
          createExpense({
            propertyId,
            date: new Date("2026-03-01"),
          }),
          createExpense({
            propertyId,
            date: new Date("2026-03-15"),
          }),
        ];
        const repo = createMockExpenseRepo({
          findByProperty: vi.fn().mockResolvedValue(expenses),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.listExpenses("user-1", propertyId);

        expect(result).toHaveLength(2);
        expect(new Date(result[0].date).getTime()).toBeGreaterThanOrEqual(
          new Date(result[1].date).getTime()
        );
        expect(repo.findByProperty).toHaveBeenCalledWith(propertyId, {
          year: undefined,
          month: undefined,
          category: undefined,
        });
      });

      it("listExpenses supports year and month filters", async () => {
        const propertyId = crypto.randomUUID();
        const repo = createMockExpenseRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.listExpenses("user-1", propertyId, {
          year: 2026,
          month: 3,
        });

        expect(repo.findByProperty).toHaveBeenCalledWith(propertyId, {
          year: 2026,
          month: 3,
          category: undefined,
        });
      });

      it("returns empty array when property has no expenses", async () => {
        const repo = createMockExpenseRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.listExpenses("user-1", "prop-1");

        expect(result).toEqual([]);
      });
    });

    describe("bad cases", () => {
      it("returns 403 when not authenticated", async () => {
        const propertyAccess = createMockPropertyAccess();
        vi.mocked(propertyAccess.validateAccess).mockRejectedValueOnce(
          new Error("Forbidden")
        );
        const service = new ExpenseService(
          createMockExpenseRepo(),
          propertyAccess
        );

        await expect(
          service.listExpenses("user-1", "prop-1")
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("passes category filter to repo", async () => {
        const propertyId = crypto.randomUUID();
        const repo = createMockExpenseRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.listExpenses("user-1", propertyId, {
          category: "electricity",
        });

        expect(repo.findByProperty).toHaveBeenCalledWith(propertyId, {
          year: undefined,
          month: undefined,
          category: "electricity",
        });
      });
    });
  });

  describe("getExpense", () => {
    describe("good cases", () => {
      it("returns expense when found and belongs to property", async () => {
        const propertyId = crypto.randomUUID();
        const expense = createExpense({ propertyId });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(expense),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getExpense(
          "user-1",
          propertyId,
          expense.id
        );

        expect(result).toEqual(expense);
        expect(result?.id).toBe(expense.id);
        expect(result?.amount).toBe(expense.amount);
      });
    });

    describe("bad cases", () => {
      it("returns null when expense not found", async () => {
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getExpense(
          "user-1",
          "prop-1",
          "non-existent"
        );

        expect(result).toBeNull();
        expect(repo.findById).toHaveBeenCalledWith("non-existent");
      });

      it("returns null when expense belongs to another property", async () => {
        const expense = createExpense({ propertyId: "other-prop" });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(expense),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getExpense(
          "user-1",
          "prop-1",
          expense.id
        );

        expect(result).toBeNull();
        expect(repo.findById).toHaveBeenCalledWith(expense.id);
      });
    });

    describe("edge cases", () => {
      it("calls findById with expenseId and returns result when found", async () => {
        const propertyId = crypto.randomUUID();
        const expense = createExpense({ propertyId, id: "exp-1" });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(expense),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getExpense("user-1", propertyId, "exp-1");

        expect(repo.findById).toHaveBeenCalledWith("exp-1");
        expect(result?.id).toBe("exp-1");
      });
    });
  });

  describe("updateExpense", () => {
    describe("good cases", () => {
      it("updateExpense updates and returns expense", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({
          propertyId,
          category: "electricity",
          amount: 100,
        });
        const updated = createExpense({
          ...existing,
          category: "water",
          amount: 200,
        });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.updateExpense(
          "user-1",
          propertyId,
          existing.id,
          { category: "water", amount: 200 }
        );

        expect(result.category).toBe("water");
        expect(result.amount).toBe(200);
        expect(repo.update).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({ category: "water", amount: 200 })
        );
      });

      it("updateExpense preserves id and createdAt", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({ propertyId });
        const updated = createExpense({
          ...existing,
          amount: 999,
        });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.updateExpense(
          "user-1",
          propertyId,
          existing.id,
          { amount: 999 }
        );

        expect(result.id).toBe(existing.id);
        expect(result.createdAt).toEqual(existing.createdAt);
      });
    });

    describe("bad cases", () => {
      it("rejects when expense not found", async () => {
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.updateExpense("user-1", "prop-1", "bad-id", { amount: 100 })
        ).rejects.toThrow(/not found/i);
      });

      it("rejects update when amount is negative", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({ propertyId });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.updateExpense("user-1", propertyId, existing.id, {
            amount: -1,
          })
        ).rejects.toThrow();
      });
    });

    describe("edge cases", () => {
      it("update with only description does not require amount or category", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({ propertyId });
        const updated = createExpense({
          ...existing,
          description: "Updated note",
        });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.updateExpense(
          "user-1",
          propertyId,
          existing.id,
          { description: "Updated note" }
        );

        expect(result.description).toBe("Updated note");
        expect(repo.update).toHaveBeenCalledWith(
          existing.id,
          expect.objectContaining({ description: "Updated note" })
        );
      });
    });
  });

  describe("deleteExpense", () => {
    describe("good cases", () => {
      it("deleteExpense removes expense", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({ propertyId });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.deleteExpense("user-1", propertyId, existing.id);

        expect(repo.delete).toHaveBeenCalledWith(existing.id);
      });
    });

    describe("bad cases", () => {
      it("rejects when expense not found", async () => {
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await expect(
          service.deleteExpense("user-1", "prop-1", "bad-id")
        ).rejects.toThrow(/not found/i);
        expect(repo.delete).not.toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("calls delete with expenseId when expense belongs to property", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createExpense({ propertyId, id: "exp-del-1" });
        const repo = createMockExpenseRepo({
          findById: vi.fn().mockResolvedValue(existing),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.deleteExpense("user-1", propertyId, "exp-del-1");

        expect(repo.delete).toHaveBeenCalledWith("exp-del-1");
      });
    });
  });

  describe("getMonthlyExpenseSummary", () => {
    describe("good cases", () => {
      it("getMonthlyExpenseSummary returns total and category breakdown (PROP 3)", async () => {
        const propertyId = crypto.randomUUID();
        const categories: CategoryBreakdown[] = [
          { category: "electricity", total: 500000, count: 2 },
          { category: "water", total: 200000, count: 1 },
        ];
        const repo = createMockExpenseRepo({
          sumByMonth: vi.fn().mockResolvedValue(700000),
          sumByMonthGroupedByCategory: vi.fn().mockResolvedValue(categories),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getMonthlyExpenseSummary(
          "user-1",
          propertyId,
          2026,
          3
        );

        expect(result.totalExpenses).toBe(700000);
        expect(result.categories).toHaveLength(2);
        expect(result.categories[0].category).toBe("electricity");
        expect(result.categories[0].total).toBe(500000);
        expect(result.categories[1].total).toBe(200000);
      });

      it("getMonthlyExpenseSummary returns categories sorted by total descending (PROP 5)", async () => {
        const propertyId = crypto.randomUUID();
        const categories: CategoryBreakdown[] = [
          { category: "water", total: 100, count: 1 },
          { category: "electricity", total: 500, count: 1 },
        ];
        const repo = createMockExpenseRepo({
          sumByMonth: vi.fn().mockResolvedValue(600),
          sumByMonthGroupedByCategory: vi.fn().mockResolvedValue(categories),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getMonthlyExpenseSummary(
          "user-1",
          propertyId,
          2026,
          3
        );

        expect(result.categories[0].total).toBe(500);
        expect(result.categories[1].total).toBe(100);
      });

      it("returns zero total and empty categories when no expenses", async () => {
        const repo = createMockExpenseRepo({
          sumByMonth: vi.fn().mockResolvedValue(0),
          sumByMonthGroupedByCategory: vi.fn().mockResolvedValue([]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        const result = await service.getMonthlyExpenseSummary(
          "user-1",
          "prop-1",
          2026,
          3
        );

        expect(result.totalExpenses).toBe(0);
        expect(result.categories).toEqual([]);
      });
    });

    describe("bad cases", () => {
      it("rejects when not authenticated", async () => {
        const propertyAccess = createMockPropertyAccess();
        vi.mocked(propertyAccess.validateAccess).mockRejectedValueOnce(
          new Error("Forbidden")
        );
        const service = new ExpenseService(
          createMockExpenseRepo(),
          propertyAccess
        );

        await expect(
          service.getMonthlyExpenseSummary("user-1", "prop-1", 2026, 3)
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("calls sumByMonth and sumByMonthGroupedByCategory with year and month", async () => {
        const propertyId = crypto.randomUUID();
        const repo = createMockExpenseRepo({
          sumByMonth: vi.fn().mockResolvedValue(0),
          sumByMonthGroupedByCategory: vi.fn().mockResolvedValue([]),
        });
        const service = new ExpenseService(
          repo,
          createMockPropertyAccess()
        );

        await service.getMonthlyExpenseSummary(
          "user-1",
          propertyId,
          2025,
          12
        );

        expect(repo.sumByMonth).toHaveBeenCalledWith(propertyId, 2025, 12);
        expect(repo.sumByMonthGroupedByCategory).toHaveBeenCalledWith(
          propertyId,
          2025,
          12
        );
      });
    });
  });

  describe("property-based tests", () => {
    const expenseCategoryArbitrary = fc.constantFrom(
      "electricity",
      "water",
      "internet",
      "maintenance",
      "cleaning",
      "supplies",
      "tax",
      "transfer",
      "other"
    );
    const expenseDataArbitrary = fc.record({
      category: expenseCategoryArbitrary,
      amount: fc.double({ min: 0.01, max: 1000000, noNaN: true }),
      date: fc
        .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
        .map((d) => d.toISOString().split("T")[0]),
      description: fc.option(fc.string({ maxLength: 1000 }), {
        nil: undefined,
      }),
    });

    it("Property 1: expense creation round trip - created expense has id, timestamps, and matches input", () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          expenseDataArbitrary,
          async (userId, propertyId, data) => {
            const created = createExpense({
              propertyId,
              category: data.category,
              amount: data.amount,
              date: new Date(data.date),
              description: data.description ?? null,
            });
            const repo = createMockExpenseRepo({
              create: vi.fn().mockResolvedValue(created),
              findByProperty: vi.fn().mockImplementation(async () => [created]),
            });
            const service = new ExpenseService(
              repo,
              createMockPropertyAccess()
            );
            const result = await service.createExpense(userId, propertyId, {
              category: data.category,
              amount: data.amount,
              date: data.date,
              description: data.description,
            });
            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.category).toBe(data.category);
            expect(result.amount).toBe(data.amount);
            expect(result.propertyId).toBe(propertyId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 6: category validation - invalid category rejected", () => {
      const invalidCategories = ["invalid", "unknown", "foo", "bar", ""];
      fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...invalidCategories),
          async (invalidCategory) => {
            const repo = createMockExpenseRepo();
            const service = new ExpenseService(
              repo,
              createMockPropertyAccess()
            );
            await expect(
              service.createExpense("user-1", "prop-1", {
                category: invalidCategory as "electricity",
                amount: 100,
                date: "2026-03-01",
              })
            ).rejects.toThrow();
            expect(repo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 7: amount validation - zero or negative amount rejected", () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ max: 0, noNaN: true }).filter((n) => n <= 0),
          async (badAmount) => {
            const repo = createMockExpenseRepo();
            const service = new ExpenseService(
              repo,
              createMockPropertyAccess()
            );
            await expect(
              service.createExpense("user-1", "prop-1", {
                category: "electricity",
                amount: badAmount,
                date: "2026-03-01",
              })
            ).rejects.toThrow();
            await expect(repo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
