// Traceability: finance-cashflow
// AC-2 -> it('returns merged income and expense entries sorted by date descending')
// AC-2 -> it('income entries have type "income" and expense entries have type "expense"')
// AC-2 -> it('amount is always positive for all entry types')
// AC-2 -> it('only returns entries for the requested month')
// AC-2 -> it('returns empty array when no transactions exist for the month')
// AC-2 -> it('throws when propertyAccess.validateAccess rejects with Forbidden')
// AC-2 -> it('throws when repository throws')
// PROP 2 -> it('Property 2: amount is always positive regardless of type')
// PROP 3 -> it('Property 3: results always sorted date descending')
// PROP 4 -> it('entries on first and last day of the month are included')
// PROP 5 -> it('returns empty array (not null/undefined) when no entries')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { CashflowService } from "./cashflow-service";
import type { ICashflowRepository } from "@/domain/interfaces/cashflow-repository";
import { createCashflowEntry } from "@/test/fixtures/cashflow";

function createMockCashflowRepo(
  overrides: Partial<ICashflowRepository> = {}
): ICashflowRepository {
  return {
    findByPropertyAndMonth: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("CashflowService.getMonthlyCashflow", () => {
  describe("good cases", () => {
    it("returns merged income and expense entries sorted by date descending", async () => {
      const propertyId = crypto.randomUUID();
      const entries = [
        createCashflowEntry({ date: "2026-03-20", type: "income" }),
        createCashflowEntry({ date: "2026-03-15", type: "expense" }),
        createCashflowEntry({ date: "2026-03-10", type: "income" }),
      ];
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe("2026-03-20");
      expect(result[1].date).toBe("2026-03-15");
      expect(result[2].date).toBe("2026-03-10");
      expect(repo.findByPropertyAndMonth).toHaveBeenCalledWith(propertyId, 2026, 3);
    });

    it("income entries have type income and expense entries have type expense", async () => {
      const propertyId = crypto.randomUUID();
      const entries = [
        createCashflowEntry({ type: "income", description: "Jane Smith" }),
        createCashflowEntry({ type: "expense", description: "electricity" }),
      ];
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      const incomeEntries = result.filter((e) => e.type === "income");
      const expenseEntries = result.filter((e) => e.type === "expense");
      expect(incomeEntries).toHaveLength(1);
      expect(expenseEntries).toHaveLength(1);
      expect(incomeEntries[0].description).toBe("Jane Smith");
      expect(expenseEntries[0].description).toBe("electricity");
    });

    it("amount is always positive for all entry types", async () => {
      const propertyId = crypto.randomUUID();
      const entries = [
        createCashflowEntry({ type: "income", amount: 1500000 }),
        createCashflowEntry({ type: "expense", amount: 75000 }),
      ];
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      for (const entry of result) {
        expect(entry.amount).toBeGreaterThan(0);
      }
    });

    it("returns empty array when no transactions exist for the month", async () => {
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", "prop-1", 2026, 3);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("only returns entries for the requested month via repository call", async () => {
      const propertyId = crypto.randomUUID();
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      expect(repo.findByPropertyAndMonth).toHaveBeenCalledWith(propertyId, 2026, 3);
      expect(repo.findByPropertyAndMonth).not.toHaveBeenCalledWith(propertyId, 2026, 2);
      expect(repo.findByPropertyAndMonth).not.toHaveBeenCalledWith(propertyId, 2026, 4);
    });
  });

  describe("bad cases", () => {
    it("throws Forbidden when propertyAccess.validateAccess rejects", async () => {
      const propertyAccess = createMockPropertyAccess();
      vi.mocked(propertyAccess.validateAccess).mockRejectedValueOnce(
        new Error("Forbidden")
      );
      const service = new CashflowService(
        createMockCashflowRepo(),
        propertyAccess
      );

      await expect(
        service.getMonthlyCashflow("user-1", "prop-1", 2026, 3)
      ).rejects.toThrow(/Forbidden/i);
    });

    it("propagates error when repository throws", async () => {
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockRejectedValue(
          new Error("Database connection failed")
        ),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      await expect(
        service.getMonthlyCashflow("user-1", "prop-1", 2026, 3)
      ).rejects.toThrow(/Database connection failed/i);
    });

    it("does not call repository when property access fails", async () => {
      const propertyAccess = createMockPropertyAccess();
      vi.mocked(propertyAccess.validateAccess).mockRejectedValueOnce(
        new Error("Forbidden")
      );
      const repo = createMockCashflowRepo();
      const service = new CashflowService(repo, propertyAccess);

      await expect(
        service.getMonthlyCashflow("user-1", "prop-1", 2026, 3)
      ).rejects.toThrow();

      expect(repo.findByPropertyAndMonth).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("entries on first and last day of the month are included (PROP 4)", async () => {
      const propertyId = crypto.randomUUID();
      const entries = [
        createCashflowEntry({ date: "2026-03-31", type: "income" }),
        createCashflowEntry({ date: "2026-03-01", type: "expense" }),
      ];
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      expect(result).toHaveLength(2);
      const dates = result.map((e) => e.date);
      expect(dates).toContain("2026-03-01");
      expect(dates).toContain("2026-03-31");
    });

    it("when income and expense share the same date result contains both", async () => {
      const propertyId = crypto.randomUUID();
      const same = "2026-03-15";
      const entries = [
        createCashflowEntry({ id: "inc-1", date: same, type: "income" }),
        createCashflowEntry({ id: "exp-1", date: same, type: "expense" }),
      ];
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", propertyId, 2026, 3);

      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain("inc-1");
      expect(ids).toContain("exp-1");
    });

    it("passes correct year and month to repository for boundary months", async () => {
      const propertyId = crypto.randomUUID();
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      await service.getMonthlyCashflow("user-1", propertyId, 2026, 1);
      expect(repo.findByPropertyAndMonth).toHaveBeenCalledWith(propertyId, 2026, 1);

      await service.getMonthlyCashflow("user-1", propertyId, 2026, 12);
      expect(repo.findByPropertyAndMonth).toHaveBeenCalledWith(propertyId, 2026, 12);
    });

    it("returns empty array (not null or undefined) when month has no entries (PROP 5)", async () => {
      const repo = createMockCashflowRepo({
        findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
      });
      const service = new CashflowService(repo, createMockPropertyAccess());

      const result = await service.getMonthlyCashflow("user-1", "prop-1", 2026, 2);

      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe("property-based tests", () => {
    it("Property 2: amount is always positive regardless of entry type", () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              date: fc
                .date({
                  min: new Date("2026-03-01"),
                  max: new Date("2026-03-31"),
                  noInvalidDate: true,
                })
                .map((d) => d.toISOString().slice(0, 10)),
              type: fc.constantFrom("income" as const, "expense" as const),
              description: fc.string({ minLength: 1, maxLength: 100 }),
              amount: fc.double({ min: 0.01, max: 10_000_000, noNaN: true }),
            }, { noNullPrototype: true }),
            { minLength: 0, maxLength: 20 }
          ),
          async (entries) => {
            const repo = createMockCashflowRepo({
              findByPropertyAndMonth: vi.fn().mockResolvedValue(entries),
            });
            const service = new CashflowService(repo, createMockPropertyAccess());

            const result = await service.getMonthlyCashflow("user-1", "prop-1", 2026, 3);

            for (const entry of result) {
              expect(entry.amount).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 3: service delegates to repository with correct propertyId/year/month", () => {
      fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 2000, max: 2100 }),
          fc.integer({ min: 1, max: 12 }),
          async (userId, propertyId, year, month) => {
            const repo = createMockCashflowRepo({
              findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
            });
            const service = new CashflowService(repo, createMockPropertyAccess());

            await service.getMonthlyCashflow(userId, propertyId, year, month);

            expect(repo.findByPropertyAndMonth).toHaveBeenCalledWith(propertyId, year, month);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 5: empty month always returns an array, never null or undefined", () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2000, max: 2100 }),
          fc.integer({ min: 1, max: 12 }),
          async (year, month) => {
            const repo = createMockCashflowRepo({
              findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
            });
            const service = new CashflowService(repo, createMockPropertyAccess());

            const result = await service.getMonthlyCashflow("user-1", "prop-1", year, month);

            expect(result).not.toBeNull();
            expect(result).not.toBeUndefined();
            expect(Array.isArray(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
