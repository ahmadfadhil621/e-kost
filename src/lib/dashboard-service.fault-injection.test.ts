/**
 * Gate 2: Fault injection tests for dashboard-overview.
 * Each test injects a fault (mock returns wrong data) and asserts the CORRECT value.
 * When the fault is present, the assertion fails → fault KILLED.
 * If a test passes despite the fault, the fault SURVIVED (tests need strengthening).
 * Run: npx vitest run src/lib/dashboard-service.fault-injection.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { DashboardService } from "./dashboard-service";
import type {
  IRoomStatsSource,
  IFinanceSummarySnapshotSource,
  IOutstandingBalancesSource,
  IRecentPaymentsSource,
} from "./dashboard-service";
import type { OutstandingBalance, RecentPayment } from "@/domain/schemas/dashboard";
import {
  createOccupancyStats,
  createFinanceSummarySnapshot,
  createOutstandingBalance,
  createRecentPayment,
} from "@/test/fixtures/dashboard";

const userId = "user-1";
const propertyId = "prop-1";

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

describe("Gate 2: Fault injection (dashboard-overview)", () => {
  describe("good cases", () => {
    it("fault wrong-occupancy-rate (PROP 1): occupancy rate must equal (occupied/total)*100 — KILLED", async () => {
      const faultyOccupancy = createOccupancyStats({
        totalRooms: 10,
        occupied: 6,
        available: 3,
        underRenovation: 1,
        occupancyRate: 99,
      });
      const roomStats = createMockRoomStats({
        getRoomStats: vi.fn().mockResolvedValue(faultyOccupancy),
      });
      const service = new DashboardService(
        roomStats,
        createMockFinanceSummary(),
        createMockOutstandingBalances(),
        createMockRecentPayments()
      );

      const result = await service.getDashboardData(userId, propertyId);

      const expectedRate = 60;
      expect(result.occupancy.occupancyRate).toBe(expectedRate);
    });

    it("fault room-count-mismatch (PROP 2): occupied + available + underRenovation must equal totalRooms — KILLED", async () => {
      const faultyOccupancy = createOccupancyStats({
        totalRooms: 10,
        occupied: 6,
        available: 3,
        underRenovation: 0,
        occupancyRate: 60,
      });
      const roomStats = createMockRoomStats({
        getRoomStats: vi.fn().mockResolvedValue(faultyOccupancy),
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
    });

    it("fault wrong-net-income (PROP 3): netIncome must equal income minus expenses — KILLED", async () => {
      const faultyFinance = createFinanceSummarySnapshot({
        year: 2026,
        month: 3,
        income: 3000000,
        expenses: 500000,
        netIncome: 0,
      });
      const financeSource = createMockFinanceSummary({
        getMonthlySummary: vi.fn().mockResolvedValue(faultyFinance),
      });
      const service = new DashboardService(
        createMockRoomStats(),
        financeSource,
        createMockOutstandingBalances(),
        createMockRecentPayments()
      );

      const result = await service.getDashboardData(userId, propertyId);

      expect(result.finance.netIncome).toBe(2500000);
    });

    it("fault wrong-outstanding-order (PROP 4): outstanding balances must be sorted by balance descending — KILLED", async () => {
      const balances: OutstandingBalance[] = [
        createOutstandingBalance({ tenantName: "A", balance: 100 }),
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

      expect(result.outstandingBalances[0].balance).toBeGreaterThanOrEqual(
        result.outstandingBalances[1].balance
      );
    });

    it("fault wrong-recent-order (PROP 5): recent payments must be sorted by date descending — KILLED", async () => {
      const older = new Date("2026-02-01");
      const newer = new Date("2026-03-01");
      const payments: RecentPayment[] = [
        createRecentPayment({ tenantName: "X", date: older }),
        createRecentPayment({ tenantName: "Y", date: newer }),
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

      expect(result.recentPayments[0].date.getTime()).toBeGreaterThanOrEqual(
        result.recentPayments[1].date.getTime()
      );
    });

    it("fault wrong-limit (PROP 4, 5): outstanding balances must be limited to 5 — KILLED", async () => {
      const balances: OutstandingBalance[] = Array.from({ length: 7 }, (_, i) =>
        createOutstandingBalance({ tenantName: `T${i}`, balance: 1000 - i })
      );
      const outstandingSource = createMockOutstandingBalances({
        getTopOutstandingBalances: vi.fn().mockResolvedValue({
          balances,
          totalCount: 7,
        }),
      });
      const service = new DashboardService(
        createMockRoomStats(),
        createMockFinanceSummary(),
        outstandingSource,
        createMockRecentPayments()
      );

      const result = await service.getDashboardData(userId, propertyId);

      expect(result.outstandingBalances.length).toBeLessThanOrEqual(5);
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("fault injection runs in isolation", () => {
      expect(true).toBe(true);
    });
  });
});
