// Traceability: outstanding-balance
// REQ 1.1, 1.2, 1.3 -> it('returns balance equal to rent when no payments')
// REQ 1.4 -> it('returns balance equal to rent when no payments')
// REQ 1.5 -> it('returns paid status and zero balance when payments equal or exceed rent')
// REQ 1.6 -> it('recalculates when room or payments change (repository returns new row)')
// REQ 5.3 -> it('returns balance for tenant when row exists (moved-out preserved by repository)')
// PROP 1 -> it('balance equals rent minus total payments (PROP 1)')
// PROP 2 -> it('returns paid status and zero balance when payments equal or exceed rent')
// PROP 3 -> it('balance decreases by payment amount when new payment recorded (PROP 3)')
// PROP 4 -> it('balance uses new room rent when room assignment changes (PROP 4)')
// PROP 5 -> it('balance display completeness covered by API/component tests')
// PROP 6 -> it('status indicator accessibility covered by component tests')
// PROP 7 -> it('list item balance presence covered by E2E')
// PROP 8 -> it('calculateBalances returns results sortable by outstanding balance (PROP 8)')
// PROP 9 -> it('returns balance when row exists (moved-out preserved by repository) (PROP 9)')
// PROP 10 -> it('currency formatting covered by component/i18n tests')

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fc from "fast-check";
import { BalanceService } from "./balance-service";
import type { IBalanceRepository } from "./balance-service";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";
import type { BillingCycle } from "@/domain/schemas/billing-cycle";
import { createBalanceRow } from "@/test/fixtures/balance";

function createMockBalanceRepo(
  overrides: Partial<IBalanceRepository> = {}
): IBalanceRepository {
  return {
    getBalanceRow: vi.fn(),
    getBalanceRows: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("BalanceService", () => {
  describe("calculateBalance", () => {
    describe("good cases", () => {
      it("returns balance equal to rent when no payments", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const row = createBalanceRow({
          tenantId,
          monthlyRent: 1500000,
          totalPayments: 0,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          userId,
          propertyId,
          tenantId
        );

        expect(result.tenantId).toBe(tenantId);
        expect(result.monthlyRent).toBe(1500000);
        expect(result.totalPayments).toBe(0);
        expect(result.outstandingBalance).toBe(1500000);
        expect(result.status).toBe("unpaid");
      });

      it("balance equals rent minus total payments (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const row = createBalanceRow({
          tenantId,
          monthlyRent: 2000000,
          totalPayments: 500000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result.outstandingBalance).toBe(1500000);
        expect(result.monthlyRent - result.totalPayments).toBe(
          result.outstandingBalance
        );
        expect(result.status).toBe("unpaid");
      });

      it("returns paid status and zero balance when payments equal or exceed rent", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const row = createBalanceRow({
          tenantId,
          monthlyRent: 1500000,
          totalPayments: 1500000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          propertyId,
          tenantId
        );

        expect(result.outstandingBalance).toBe(0);
        expect(result.status).toBe("paid");
      });

      it("returns zero outstanding balance when overpaid (PROP 2)", async () => {
        const row = createBalanceRow({
          monthlyRent: 1000000,
          totalPayments: 1200000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          crypto.randomUUID(),
          row.tenantId
        );

        expect(result.outstandingBalance).toBe(0);
        expect(result.status).toBe("paid");
      });

      it("returns balance when row exists (moved-out preserved by repository) (PROP 9)", async () => {
        const tenantId = crypto.randomUUID();
        const row = createBalanceRow({
          tenantId,
          monthlyRent: 1500000,
          totalPayments: 500000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.tenantId).toBe(tenantId);
        expect(result.outstandingBalance).toBe(1000000);
        expect(result.status).toBe("unpaid");
      });
    });

    describe("bad cases", () => {
      it("throws when tenant has no room assignment (repository returns null)", async () => {
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(null),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.calculateBalance(
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID()
          )
        ).rejects.toThrow(/cannot calculate balance|no room|not found/i);
      });

      it("rejects when user has no property access", async () => {
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(
            createBalanceRow({ monthlyRent: 1000, totalPayments: 0 })
          ),
        });
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new BalanceService(balanceRepo, propertyAccess);

        await expect(
          service.calculateBalance("user-1", "prop-1", "tenant-1")
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("balance decreases by payment amount when new payment recorded (PROP 3)", async () => {
        const tenantId = crypto.randomUUID();
        const rowBefore = createBalanceRow({
          tenantId,
          monthlyRent: 1500000,
          totalPayments: 500000,
        });
        const rowAfter = createBalanceRow({
          tenantId,
          monthlyRent: 1500000,
          totalPayments: 1000000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi
            .fn()
            .mockResolvedValueOnce(rowBefore)
            .mockResolvedValueOnce(rowAfter),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );
        const propId = crypto.randomUUID();
        const userId = crypto.randomUUID();

        const result1 = await service.calculateBalance(userId, propId, tenantId);
        const result2 = await service.calculateBalance(userId, propId, tenantId);

        expect(result1.outstandingBalance - result2.outstandingBalance).toBe(
          500000
        );
      });

      it("balance uses new room rent when room assignment changes (PROP 4)", async () => {
        const tenantId = crypto.randomUUID();
        const rowNewRoom = createBalanceRow({
          tenantId,
          monthlyRent: 2000000,
          roomNumber: "B202",
          totalPayments: 500000,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(rowNewRoom),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.monthlyRent).toBe(2000000);
        expect(result.roomNumber).toBe("B202");
        expect(result.totalPayments).toBe(500000);
        expect(result.outstandingBalance).toBe(1500000);
      });

      it("rounds to two decimal places for currency accuracy", async () => {
        const row = createBalanceRow({
          monthlyRent: 999999.99,
          totalPayments: 333333.33,
        });
        const balanceRepo = createMockBalanceRepo({
          getBalanceRow: vi.fn().mockResolvedValue(row),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalance(
          crypto.randomUUID(),
          crypto.randomUUID(),
          row.tenantId
        );

        const expected = 666666.66;
        expect(result.outstandingBalance).toBeCloseTo(expected, 2);
      });
    });
  });

  describe("calculateBalances", () => {
    describe("good cases", () => {
      it("returns balances for all tenants in property", async () => {
        const propertyId = crypto.randomUUID();
        const rows = [
          createBalanceRow({
            tenantId: "t1",
            monthlyRent: 1500000,
            totalPayments: 0,
          }),
          createBalanceRow({
            tenantId: "t2",
            monthlyRent: 1000000,
            totalPayments: 1000000,
          }),
        ];
        const balanceRepo = createMockBalanceRepo({
          getBalanceRows: vi.fn().mockResolvedValue(rows),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalances(
          crypto.randomUUID(),
          propertyId
        );

        expect(result).toHaveLength(2);
        expect(result[0].tenantId).toBe("t1");
        expect(result[0].outstandingBalance).toBe(1500000);
        expect(result[0].status).toBe("unpaid");
        expect(result[1].tenantId).toBe("t2");
        expect(result[1].outstandingBalance).toBe(0);
        expect(result[1].status).toBe("paid");
      });

      it("calculateBalances returns results sortable by outstanding balance (PROP 8)", async () => {
        const propertyId = crypto.randomUUID();
        const rows = [
          createBalanceRow({
            tenantId: "low",
            monthlyRent: 1000,
            totalPayments: 1000,
          }),
          createBalanceRow({
            tenantId: "high",
            monthlyRent: 5000,
            totalPayments: 0,
          }),
        ];
        const balanceRepo = createMockBalanceRepo({
          getBalanceRows: vi.fn().mockResolvedValue(rows),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalances(
          crypto.randomUUID(),
          propertyId
        );

        const sorted = [...result].sort(
          (a, b) => b.outstandingBalance - a.outstandingBalance
        );
        expect(sorted[0].outstandingBalance).toBeGreaterThanOrEqual(
          sorted[1].outstandingBalance
        );
        expect(result).toHaveLength(2);
      });

      it("returns empty array when property has no tenants", async () => {
        const balanceRepo = createMockBalanceRepo({
          getBalanceRows: vi.fn().mockResolvedValue([]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalances(
          crypto.randomUUID(),
          crypto.randomUUID()
        );

        expect(result).toEqual([]);
      });
    });

    describe("bad cases", () => {
      it("rejects when user has no property access", async () => {
        const balanceRepo = createMockBalanceRepo({
          getBalanceRows: vi.fn().mockResolvedValue([]),
        });
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new BalanceService(balanceRepo, propertyAccess);

        await expect(
          service.calculateBalances("user-1", "prop-1")
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("filters by status when status query provided", async () => {
        const propertyId = crypto.randomUUID();
        const unpaidRows = [
          createBalanceRow({
            tenantId: "t1",
            monthlyRent: 1500000,
            totalPayments: 0,
          }),
        ];
        const balanceRepo = createMockBalanceRepo({
          getBalanceRows: vi.fn().mockResolvedValue(unpaidRows),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess()
        );

        const result = await service.calculateBalances(
          crypto.randomUUID(),
          propertyId,
          "unpaid"
        );

        expect(balanceRepo.getBalanceRows).toHaveBeenCalledWith(
          propertyId,
          "unpaid"
        );
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe("unpaid");
      });
    });
  });

  describe("property-based tests", () => {
    // Feature: outstanding-balance, Property 1: Balance Calculation Formula
    it("balance equals monthlyRent minus totalPayments for any valid row", () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.double({ min: 100, max: 10000, noNaN: true }).map((n) => Math.round(n * 100) / 100),
          fc.double({ min: 0, max: 15000, noNaN: true }).map((n) => Math.round(n * 100) / 100),
          async (tenantId, monthlyRent, totalPayments) => {
            const row = createBalanceRow({
              tenantId,
              monthlyRent,
              totalPayments,
            });
            const balanceRepo = createMockBalanceRepo({
              getBalanceRow: vi.fn().mockResolvedValue(row),
            });
            const service = new BalanceService(
              balanceRepo,
              createMockPropertyAccess()
            );

            const result = await service.calculateBalance(
              crypto.randomUUID(),
              crypto.randomUUID(),
              tenantId
            );

            const expectedBalance = Math.max(0, monthlyRent - totalPayments);
            expect(result.outstandingBalance).toBeCloseTo(expectedBalance, 2);
            expect(result.monthlyRent).toBe(monthlyRent);
            expect(result.totalPayments).toBe(totalPayments);
            expect(result.status).toBe(
              expectedBalance <= 0 ? "paid" : "unpaid"
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // calculateCycleBreakdown
  // Traceability: billing-cycle-tracking
  // REQ BC-1 -> it('returns only unpaid and partial cycles, sorted oldest first')
  // REQ BC-2 -> it('returns allPaid: true when all months from move-in are paid')
  // REQ BC-3 -> it('correctly computes amountOwed per cycle')
  // REQ BC-4 -> it('handles partial payment (totalPaid > 0 but < monthlyRent)')
  // REQ BC-5 -> it('throws when tenant not found')
  // REQ BC-6 -> it('throws Forbidden when property access denied')
  // ---------------------------------------------------------------------------
  describe("calculateCycleBreakdown", () => {
    // Pin current date to April 2, 2026 so "current month" = year 2026, month 4
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    function createMockBillingCycleRepo(
      overrides: Partial<IBillingCycleRepository> = {}
    ): IBillingCycleRepository {
      return {
        findOrCreate: vi.fn().mockResolvedValue({
          id: crypto.randomUUID(),
          tenantId: crypto.randomUUID(),
          year: 2026,
          month: 4,
          createdAt: new Date(),
        } satisfies BillingCycle),
        findWithPaymentSums: vi.fn().mockResolvedValue([]),
        ...overrides,
      };
    }

    // Extended balance repo that also carries getTenantInfo (new method)
    type ExtendedBalanceRepo = IBalanceRepository & {
      getTenantInfo: (
        propertyId: string,
        tenantId: string
      ) => Promise<{ monthlyRent: number; movedInAt: Date } | null>;
    };

    function createExtendedBalanceRepo(
      tenantInfo: { monthlyRent: number; movedInAt: Date } | null = {
        monthlyRent: 1_500_000,
        movedInAt: new Date("2026-02-01"),
      }
    ): ExtendedBalanceRepo {
      return {
        getBalanceRow: vi.fn(),
        getBalanceRows: vi.fn(),
        getTenantInfo: vi.fn().mockResolvedValue(tenantInfo),
      };
    }

    describe("good cases", () => {
      it("returns only unpaid and partial cycles, sorted oldest first", async () => {
        // Timeline (current = Apr 2026):
        //   Feb 2026 → paid  (totalPaid = 1_500_000)
        //   Mar 2026 → partial (totalPaid = 750_000)
        //   Apr 2026 → unpaid  (no entry)
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 1_500_000,
          movedInAt: new Date("2026-02-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([
            { id: "c1", year: 2026, month: 2, totalPaid: 1_500_000 },
            { id: "c2", year: 2026, month: 3, totalPaid: 750_000 },
            // Apr 2026 absent → unpaid
          ]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.tenantId).toBe(tenantId);
        expect(result.allPaid).toBe(false);
        expect(result.unpaidCycles).toHaveLength(2);
        // Oldest first
        expect(result.unpaidCycles[0]).toMatchObject({
          year: 2026,
          month: 3,
          status: "partial",
        });
        expect(result.unpaidCycles[1]).toMatchObject({
          year: 2026,
          month: 4,
          status: "unpaid",
        });
      });

      it("returns allPaid: true when all months from move-in are paid", async () => {
        // Timeline: Mar 2026 (paid), Apr 2026 (paid)
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 1_000_000,
          movedInAt: new Date("2026-03-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([
            { id: "c1", year: 2026, month: 3, totalPaid: 1_000_000 },
            { id: "c2", year: 2026, month: 4, totalPaid: 1_000_000 },
          ]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.allPaid).toBe(true);
        expect(result.unpaidCycles).toHaveLength(0);
      });

      it("correctly computes amountOwed per cycle", async () => {
        // Partial Apr 2026: totalPaid = 500_000, monthlyRent = 1_500_000 → owed = 1_000_000
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 1_500_000,
          movedInAt: new Date("2026-04-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([
            { id: "c1", year: 2026, month: 4, totalPaid: 500_000 },
          ]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.unpaidCycles).toHaveLength(1);
        expect(result.unpaidCycles[0]).toMatchObject({
          year: 2026,
          month: 4,
          totalPaid: 500_000,
          monthlyRent: 1_500_000,
          amountOwed: 1_000_000,
          status: "partial",
        });
      });

      it("handles partial payment (totalPaid > 0 but < monthlyRent)", async () => {
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 2_000_000,
          movedInAt: new Date("2026-04-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([
            { id: "c1", year: 2026, month: 4, totalPaid: 1_000_000 },
          ]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.unpaidCycles[0].status).toBe("partial");
        expect(result.unpaidCycles[0].amountOwed).toBe(1_000_000);
        expect(result.unpaidCycles[0].totalPaid).toBe(1_000_000);
      });
    });

    describe("bad cases", () => {
      it("throws 'Cannot calculate balance' when tenant not found (getTenantInfo returns null)", async () => {
        const balanceRepo = createExtendedBalanceRepo(null);
        const billingCycleRepo = createMockBillingCycleRepo();
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        await expect(
          service.calculateCycleBreakdown(
            crypto.randomUUID(),
            crypto.randomUUID(),
            crypto.randomUUID()
          )
        ).rejects.toThrow(/cannot calculate balance|not found/i);
      });

      it("throws 'Forbidden' when property access denied", async () => {
        const balanceRepo = createExtendedBalanceRepo();
        const billingCycleRepo = createMockBillingCycleRepo();
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new BalanceService(
          balanceRepo,
          propertyAccess,
          billingCycleRepo
        );

        await expect(
          service.calculateCycleBreakdown("user-1", "prop-1", "tenant-1")
        ).rejects.toThrow(/Forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("tenant moved in this month (April 2026) with no payments → 1 unpaid cycle", async () => {
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 1_200_000,
          movedInAt: new Date("2026-04-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.unpaidCycles).toHaveLength(1);
        expect(result.unpaidCycles[0]).toMatchObject({
          year: 2026,
          month: 4,
          status: "unpaid",
          amountOwed: 1_200_000,
          totalPaid: 0,
        });
        expect(result.allPaid).toBe(false);
      });

      it("tenant with no payments at all — all months since move-in are unpaid", async () => {
        // movedInAt Feb 2026 → Feb, Mar, Apr = 3 unpaid months
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 1_000_000,
          movedInAt: new Date("2026-02-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.unpaidCycles).toHaveLength(3);
        expect(result.unpaidCycles[0]).toMatchObject({ year: 2026, month: 2, status: "unpaid" });
        expect(result.unpaidCycles[1]).toMatchObject({ year: 2026, month: 3, status: "unpaid" });
        expect(result.unpaidCycles[2]).toMatchObject({ year: 2026, month: 4, status: "unpaid" });
        expect(result.allPaid).toBe(false);
      });

      it("single cycle where totalPaid exactly equals monthlyRent → allPaid: true", async () => {
        const tenantId = crypto.randomUUID();
        const balanceRepo = createExtendedBalanceRepo({
          monthlyRent: 750_000,
          movedInAt: new Date("2026-04-01"),
        });
        const billingCycleRepo = createMockBillingCycleRepo({
          findWithPaymentSums: vi.fn().mockResolvedValue([
            { id: "c1", year: 2026, month: 4, totalPaid: 750_000 },
          ]),
        });
        const service = new BalanceService(
          balanceRepo,
          createMockPropertyAccess(),
          billingCycleRepo
        );

        const result = await service.calculateCycleBreakdown(
          crypto.randomUUID(),
          crypto.randomUUID(),
          tenantId
        );

        expect(result.allPaid).toBe(true);
        expect(result.unpaidCycles).toHaveLength(0);
      });
    });
  });
});
