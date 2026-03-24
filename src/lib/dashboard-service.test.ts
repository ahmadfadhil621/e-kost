// Traceability: dashboard-overview
// REQ 1.1, 1.2, 1.3 -> it('returns occupancy stats with total, occupied, available, underRenovation, occupancyRate')
// REQ 1.4 -> it('returns 100% occupancy rate when all rooms occupied')
// REQ 1.5 -> it('returns zero rooms and 0% rate when no rooms exist')
// REQ 2.1, 2.2, 2.3 -> it('returns finance summary with income, expenses, netIncome for current month')
// REQ 3.1, 3.2, 3.3, 3.5 -> it('returns outstandingBalances and outstandingCount sorted by balance descending, limit 5')
// REQ 3.4 -> it('returns empty outstanding list and count 0 when all tenants paid up')
// REQ 4.1, 4.2, 4.3 -> it('returns recentPayments sorted by date descending, limit 5')
// REQ 4.4 -> it('returns empty recent payments when none exist')
// REQ 5.2 -> it('aggregates data from all sources in parallel')
// PROP 1 -> it('occupancy rate equals (occupied/total)*100, 0 when total 0 (PROP 1)')
// PROP 2 -> it('occupied + available + underRenovation equals totalRooms (PROP 2)')
// PROP 3 -> it('finance netIncome equals income minus expenses (PROP 3)')
// PROP 4 -> it('outstanding balances sorted by balance descending (PROP 4)')
// PROP 5 -> it('recent payments sorted by date descending (PROP 5)')
// PROP 6 -> it('getDashboardData called with same propertyId for all sources (PROP 6)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { DashboardService } from "./dashboard-service";
import type {
  IRoomStatsSource,
  IFinanceSummarySnapshotSource,
  IOutstandingBalancesSource,
  IRecentPaymentsSource,
} from "./dashboard-service";
import type { OccupancyStats, OutstandingBalance, RecentPayment } from "@/domain/schemas/dashboard";
import {
  createOccupancyStats,
  createFinanceSummarySnapshot,
  createOutstandingBalance,
  createRecentPayment,
} from "@/test/fixtures/dashboard";

function createMockRoomStats(
  overrides: Partial<IRoomStatsSource> = {}
): IRoomStatsSource {
  return {
    getRoomStats: vi.fn().mockResolvedValue(createOccupancyStats()),
    ...overrides,
  };
}

function createMockFinanceSummary(
  overrides: Partial<IFinanceSummarySnapshotSource> = {}
): IFinanceSummarySnapshotSource {
  return {
    getMonthlySummary: vi.fn().mockResolvedValue(createFinanceSummarySnapshot()),
    ...overrides,
  };
}

function createMockOutstandingBalances(
  overrides: Partial<IOutstandingBalancesSource> = {}
): IOutstandingBalancesSource {
  return {
    getTopOutstandingBalances: vi.fn().mockResolvedValue({
      balances: [],
      totalCount: 0,
    }),
    ...overrides,
  };
}

function createMockRecentPayments(
  overrides: Partial<IRecentPaymentsSource> = {}
): IRecentPaymentsSource {
  return {
    getRecentPayments: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("DashboardService", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  describe("getDashboardData", () => {
    describe("good cases", () => {
      it("returns occupancy stats with total, occupied, available, underRenovation, occupancyRate", async () => {
        const occupancy = createOccupancyStats({
          totalRooms: 10,
          occupied: 6,
          available: 3,
          underRenovation: 1,
          occupancyRate: 60,
        });
        const roomStats = createMockRoomStats({
          getRoomStats: vi.fn().mockResolvedValue(occupancy),
        });
        const service = new DashboardService(
          roomStats,
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.occupancy).toEqual(occupancy);
        expect(result.occupancy.totalRooms).toBe(10);
        expect(result.occupancy.occupied).toBe(6);
        expect(result.occupancy.available).toBe(3);
        expect(result.occupancy.underRenovation).toBe(1);
        expect(result.occupancy.occupancyRate).toBe(60);
        expect(roomStats.getRoomStats).toHaveBeenCalledWith(userId, propertyId);
      });

      it("returns 100% occupancy rate when all rooms occupied", async () => {
        const occupancy = createOccupancyStats({
          totalRooms: 5,
          occupied: 5,
          available: 0,
          underRenovation: 0,
          occupancyRate: 100,
        });
        const roomStats = createMockRoomStats({
          getRoomStats: vi.fn().mockResolvedValue(occupancy),
        });
        const service = new DashboardService(
          roomStats,
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.occupancy.occupancyRate).toBe(100);
        expect(result.occupancy.occupied).toBe(5);
        expect(result.occupancy.totalRooms).toBe(5);
      });

      it("returns finance summary with income, expenses, netIncome for current month", async () => {
        const finance = createFinanceSummarySnapshot({
          year: 2026,
          month: 3,
          income: 3000000,
          expenses: 500000,
          netIncome: 2500000,
        });
        const financeSource = createMockFinanceSummary({
          getMonthlySummary: vi.fn().mockResolvedValue(finance),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          financeSource,
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.finance.income).toBe(3000000);
        expect(result.finance.expenses).toBe(500000);
        expect(result.finance.netIncome).toBe(2500000);
        expect(result.finance.month).toBe(3);
        expect(result.finance.year).toBe(2026);
        const now = new Date();
        expect(financeSource.getMonthlySummary).toHaveBeenCalledWith(
          userId,
          propertyId,
          now.getUTCFullYear(),
          now.getUTCMonth() + 1
        );
      });

      it("returns outstandingBalances and outstandingCount sorted by balance descending, limit 5", async () => {
        const balances: OutstandingBalance[] = [
          createOutstandingBalance({ tenantName: "A", balance: 1000 }),
          createOutstandingBalance({ tenantName: "B", balance: 500 }),
        ];
        const outstandingSource = createMockOutstandingBalances({
          getTopOutstandingBalances: vi.fn().mockResolvedValue({
            balances,
            totalCount: 2,
          }),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          createMockFinanceSummary(),
          outstandingSource,
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.outstandingBalances).toHaveLength(2);
        expect(result.outstandingCount).toBe(2);
        expect(result.outstandingBalances[0].balance).toBe(1000);
        expect(result.outstandingBalances[1].balance).toBe(500);
        expect(outstandingSource.getTopOutstandingBalances).toHaveBeenCalledWith(
          userId,
          propertyId,
          5
        );
      });

      it("returns recentPayments sorted by date descending, limit 5", async () => {
        const d1 = new Date("2026-03-01");
        const d2 = new Date("2026-02-15");
        const payments: RecentPayment[] = [
          createRecentPayment({ tenantName: "X", amount: 1000, date: d1 }),
          createRecentPayment({ tenantName: "Y", amount: 500, date: d2 }),
        ];
        const recentSource = createMockRecentPayments({
          getRecentPayments: vi.fn().mockResolvedValue(payments),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          recentSource
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.recentPayments).toHaveLength(2);
        expect(result.recentPayments[0].date).toEqual(d1);
        expect(result.recentPayments[1].date).toEqual(d2);
        expect(recentSource.getRecentPayments).toHaveBeenCalledWith(
          userId,
          propertyId,
          5
        );
      });

      it("aggregates data from all sources in parallel", async () => {
        const roomStats = createMockRoomStats();
        const financeSource = createMockFinanceSummary();
        const outstandingSource = createMockOutstandingBalances();
        const recentSource = createMockRecentPayments();

        const service = new DashboardService(
          roomStats,
          financeSource,
          outstandingSource,
          recentSource
        );

        await service.getDashboardData(userId, propertyId);

        expect(roomStats.getRoomStats).toHaveBeenCalledWith(
          userId,
          propertyId
        );
        expect(financeSource.getMonthlySummary).toHaveBeenCalled();
        expect(outstandingSource.getTopOutstandingBalances).toHaveBeenCalledWith(
          userId,
          propertyId,
          5
        );
        expect(recentSource.getRecentPayments).toHaveBeenCalledWith(
          userId,
          propertyId,
          5
        );
      });
    });

    describe("bad cases", () => {
      it("propagates error when room stats fail", async () => {
        const roomStats = createMockRoomStats({
          getRoomStats: vi.fn().mockRejectedValue(new Error("DB error")),
        });
        const service = new DashboardService(
          roomStats,
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        await expect(
          service.getDashboardData(userId, propertyId)
        ).rejects.toThrow("DB error");
      });

      it("propagates error when finance summary fails", async () => {
        const financeSource = createMockFinanceSummary({
          getMonthlySummary: vi.fn().mockRejectedValue(new Error("Forbidden")),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          financeSource,
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        await expect(
          service.getDashboardData(userId, propertyId)
        ).rejects.toThrow("Forbidden");
      });
    });

    describe("edge cases", () => {
      it("returns zero rooms and 0% rate when no rooms exist", async () => {
        const occupancy = createOccupancyStats({
          totalRooms: 0,
          occupied: 0,
          available: 0,
          underRenovation: 0,
          occupancyRate: 0,
        });
        const roomStats = createMockRoomStats({
          getRoomStats: vi.fn().mockResolvedValue(occupancy),
        });
        const service = new DashboardService(
          roomStats,
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.occupancy.totalRooms).toBe(0);
        expect(result.occupancy.occupancyRate).toBe(0);
      });

      it("returns empty outstanding list and count 0 when all tenants paid up", async () => {
        const outstandingSource = createMockOutstandingBalances({
          getTopOutstandingBalances: vi.fn().mockResolvedValue({
            balances: [],
            totalCount: 0,
          }),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          createMockFinanceSummary(),
          outstandingSource,
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.outstandingBalances).toEqual([]);
        expect(result.outstandingCount).toBe(0);
      });

      it("returns empty recent payments when none exist", async () => {
        const recentSource = createMockRecentPayments({
          getRecentPayments: vi.fn().mockResolvedValue([]),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          createMockFinanceSummary(),
          createMockOutstandingBalances(),
          recentSource
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.recentPayments).toEqual([]);
      });

      it("returns finance with zero income and expenses when none", async () => {
        const finance = createFinanceSummarySnapshot({
          income: 0,
          expenses: 0,
          netIncome: 0,
        });
        const financeSource = createMockFinanceSummary({
          getMonthlySummary: vi.fn().mockResolvedValue(finance),
        });
        const service = new DashboardService(
          createMockRoomStats(),
          financeSource,
          createMockOutstandingBalances(),
          createMockRecentPayments()
        );

        const result = await service.getDashboardData(userId, propertyId);

        expect(result.finance.income).toBe(0);
        expect(result.finance.expenses).toBe(0);
        expect(result.finance.netIncome).toBe(0);
      });
    });
  });

  describe("property-based tests", () => {
    it("Property 1: occupancy rate equals (occupied/total)*100, 0 when total 0 (PROP 1)", () => {
      fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 100 }),
          fc.nat({ max: 100 }),
          fc.nat({ max: 100 }),
          async (occupied, available, underRenovation) => {
            const totalRooms = occupied + available + underRenovation;
            const rate =
              totalRooms > 0
                ? Math.round((occupied / totalRooms) * 1000) / 10
                : 0;
            const occupancy: OccupancyStats = {
              totalRooms,
              occupied,
              available,
              underRenovation,
              occupancyRate: rate,
            };
            const roomStats = createMockRoomStats({
              getRoomStats: vi.fn().mockResolvedValue(occupancy),
            });
            const service = new DashboardService(
              roomStats,
              createMockFinanceSummary(),
              createMockOutstandingBalances(),
              createMockRecentPayments()
            );

            const result = await service.getDashboardData(userId, propertyId);

            expect(result.occupancy.totalRooms).toBe(totalRooms);
            expect(result.occupancy.occupancyRate).toBe(rate);
            if (totalRooms > 0) {
              expect(
                Math.abs(
                  result.occupancy.occupancyRate -
                    (result.occupancy.occupied / result.occupancy.totalRooms) *
                      100
                )
              ).toBeLessThanOrEqual(0.1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 2: occupied + available + underRenovation equals totalRooms (PROP 2)", () => {
      fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 50 }),
          fc.nat({ max: 50 }),
          fc.nat({ max: 20 }),
          async (occupied, available, underRenovation) => {
            const totalRooms = occupied + available + underRenovation;
            const occupancy: OccupancyStats = {
              totalRooms,
              occupied,
              available,
              underRenovation,
              occupancyRate:
                totalRooms > 0
                  ? Math.round((occupied / totalRooms) * 1000) / 10
                  : 0,
            };
            const roomStats = createMockRoomStats({
              getRoomStats: vi.fn().mockResolvedValue(occupancy),
            });
            const service = new DashboardService(
              roomStats,
              createMockFinanceSummary(),
              createMockOutstandingBalances(),
              createMockRecentPayments()
            );

            const result = await service.getDashboardData(userId, propertyId);

            expect(
              result.occupancy.occupied +
                result.occupancy.available +
                result.occupancy.underRenovation
            ).toBe(result.occupancy.totalRooms);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 3: finance netIncome equals income minus expenses (PROP 3)", () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000000 }),
          fc.integer({ min: 0, max: 10000000 }),
          async (income, expenses) => {
            const netIncome = income - expenses;
            const financeSource = createMockFinanceSummary({
              getMonthlySummary: vi.fn().mockResolvedValue({
                year: 2026,
                month: 3,
                income,
                expenses,
                netIncome,
              }),
            });
            const service = new DashboardService(
              createMockRoomStats(),
              financeSource,
              createMockOutstandingBalances(),
              createMockRecentPayments()
            );

            const result = await service.getDashboardData(userId, propertyId);

            expect(result.finance.netIncome).toBe(income - expenses);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 4: outstanding balances sorted by balance descending (PROP 4)", () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              tenantName: fc.string({ minLength: 1, maxLength: 50 }),
              balance: fc.double({ min: 0.01, max: 100000, noNaN: true }),
            }, { noNullPrototype: true }),
            { minLength: 1, maxLength: 5 }
          ),
          async (entries) => {
            const sorted = [...entries].sort(
              (a, b) => b.balance - a.balance
            );
            const balances: OutstandingBalance[] = sorted.map((e) =>
              createOutstandingBalance({
                tenantName: e.tenantName,
                balance: e.balance,
              })
            );
            const outstandingSource = createMockOutstandingBalances({
              getTopOutstandingBalances: vi.fn().mockResolvedValue({
                balances,
                totalCount: balances.length,
              }),
            });
            const service = new DashboardService(
              createMockRoomStats(),
              createMockFinanceSummary(),
              outstandingSource,
              createMockRecentPayments()
            );

            const result = await service.getDashboardData(userId, propertyId);

            for (let i = 1; i < result.outstandingBalances.length; i++) {
              expect(result.outstandingBalances[i].balance).toBeLessThanOrEqual(
                result.outstandingBalances[i - 1].balance
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 5: recent payments sorted by date descending (PROP 5)", () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31"), noInvalidDate: true }),
            { minLength: 1, maxLength: 5 }
          ),
          async (dates) => {
            const sorted = [...dates].sort(
              (a, b) => b.getTime() - a.getTime()
            );
            const payments: RecentPayment[] = sorted.map((d) =>
              createRecentPayment({ date: d })
            );
            const recentSource = createMockRecentPayments({
              getRecentPayments: vi.fn().mockResolvedValue(payments),
            });
            const service = new DashboardService(
              createMockRoomStats(),
              createMockFinanceSummary(),
              createMockOutstandingBalances(),
              recentSource
            );

            const result = await service.getDashboardData(userId, propertyId);

            for (let i = 1; i < result.recentPayments.length; i++) {
              expect(
                result.recentPayments[i].date.getTime()
              ).toBeLessThanOrEqual(
                result.recentPayments[i - 1].date.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 6: getDashboardData called with same propertyId for all sources (PROP 6)", async () => {
      const roomStats = createMockRoomStats();
      const financeSource = createMockFinanceSummary();
      const outstandingSource = createMockOutstandingBalances();
      const recentSource = createMockRecentPayments();
      const service = new DashboardService(
        roomStats,
        financeSource,
        outstandingSource,
        recentSource
      );

      await service.getDashboardData(userId, propertyId);

      expect(roomStats.getRoomStats).toHaveBeenCalledWith(
        userId,
        propertyId
      );
      expect(financeSource.getMonthlySummary).toHaveBeenCalledWith(
        userId,
        propertyId,
        expect.any(Number),
        expect.any(Number)
      );
      expect(outstandingSource.getTopOutstandingBalances).toHaveBeenCalledWith(
        userId,
        propertyId,
        5
      );
      expect(recentSource.getRecentPayments).toHaveBeenCalledWith(
        userId,
        propertyId,
        5
      );
    });
  });
});
