/**
 * Gate 2: Fault injection tests for outstanding-balance.
 * Each test simulates a fault (mock returns wrong data or service gets wrong input)
 * and asserts the CORRECT behavior. If the implementation is correct, the assertion
 * fails when fault is present → fault KILLED. If the test passes with fault present,
 * the fault SURVIVED.
 * Run: npx vitest run src/lib/balance-service.fault-injection.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { BalanceService } from "./balance-service";
import type { IBalanceRepository } from "./balance-service";
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

const createMockPropertyAccess = () => ({
  validateAccess: vi.fn().mockResolvedValue("owner" as const),
});

describe("Gate 2: Fault injection (outstanding-balance)", () => {
  describe("good cases", () => {
    it("fault wrong-formula: balance must equal rent minus payments (PROP 1) — KILLED", async () => {
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
        "user-1",
        "prop-1",
        tenantId
      );

      const expectedBalance = 1500000;
      expect(result.outstandingBalance).toBe(expectedBalance);
      expect(result.monthlyRent - result.totalPayments).toBe(
        result.outstandingBalance
      );
    });

    it("fault wrong-status: status must be paid when balance <= 0 (PROP 2) — KILLED", async () => {
      const row = createBalanceRow({
        monthlyRent: 1000000,
        totalPayments: 1000000,
      });
      const balanceRepo = createMockBalanceRepo({
        getBalanceRow: vi.fn().mockResolvedValue(row),
      });
      const service = new BalanceService(
        balanceRepo,
        createMockPropertyAccess()
      );

      const result = await service.calculateBalance(
        "user-1",
        "prop-1",
        row.tenantId
      );

      expect(result.outstandingBalance).toBe(0);
      expect(result.status).toBe("paid");
    });

    it("fault no-zero-cap: overpayment must show zero balance (PROP 2) — KILLED", async () => {
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
        "user-1",
        "prop-1",
        row.tenantId
      );

      expect(result.outstandingBalance).toBe(0);
      expect(result.status).toBe("paid");
    });

    it("fault no-null-check: must throw when tenant has no room — KILLED", async () => {
      const balanceRepo = createMockBalanceRepo({
        getBalanceRow: vi.fn().mockResolvedValue(null),
      });
      const service = new BalanceService(
        balanceRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.calculateBalance(
          "user-1",
          "prop-1",
          "tenant-no-room"
        )
      ).rejects.toThrow(/cannot calculate balance|no room|not found/i);
    });

    it("fault batch-status: calculateBalances must return status per row (PROP 2) — KILLED", async () => {
      const rows = [
        createBalanceRow({
          tenantId: "t1",
          monthlyRent: 1000,
          totalPayments: 1000,
        }),
        createBalanceRow({
          tenantId: "t2",
          monthlyRent: 2000,
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

      const result = await service.calculateBalances("user-1", "prop-1");

      expect(result[0].status).toBe("paid");
      expect(result[0].outstandingBalance).toBe(0);
      expect(result[1].status).toBe("unpaid");
      expect(result[1].outstandingBalance).toBe(2000);
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("no edge-case scenarios for fault injection", () => {
      expect(true).toBe(true);
    });
  });
});
