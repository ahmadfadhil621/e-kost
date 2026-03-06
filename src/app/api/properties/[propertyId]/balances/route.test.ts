// Traceability: outstanding-balance
// REQ 4.1, 4.2 -> it('GET returns 200 with balances array')
// REQ 4.4 -> it('GET accepts status=unpaid filter')
// PROP 7, 8 -> it('GET returns 200 with balances array')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import { createBalanceResult } from "@/test/fixtures/balance";

const propertyId = "prop-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/balance-service-instance", () => ({
  balanceService: {
    calculateBalances: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { balanceService } = await import("@/lib/balance-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("GET /api/properties/[propertyId]/balances", () => {
  describe("good cases", () => {
    it("GET returns 200 with balances array", async () => {
      const balances = [
        createBalanceResult({
          tenantId: "t1",
          tenantName: "Alice",
          monthlyRent: 1500000,
          totalPayments: 0,
          outstandingBalance: 1500000,
          status: "unpaid",
        }),
        createBalanceResult({
          tenantId: "t2",
          tenantName: "Bob",
          monthlyRent: 1000000,
          totalPayments: 1000000,
          outstandingBalance: 0,
          status: "paid",
        }),
      ];
      vi.mocked(balanceService.calculateBalances).mockResolvedValue(balances);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/balances`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balances).toHaveLength(2);
      expect(data.balances[0]).toHaveProperty("tenantId");
      expect(data.balances[0]).toHaveProperty("monthlyRent");
      expect(data.balances[0]).toHaveProperty("totalPayments");
      expect(data.balances[0]).toHaveProperty("outstandingBalance");
      expect(data.balances[0]).toHaveProperty("status");
    });

    it("GET returns empty balances when property has no tenants", async () => {
      vi.mocked(balanceService.calculateBalances).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/balances`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balances).toEqual([]);
    });

    it("GET accepts status=unpaid filter", async () => {
      const unpaidOnly = [
        createBalanceResult({
          tenantId: "t1",
          outstandingBalance: 500000,
          status: "unpaid",
        }),
      ];
      vi.mocked(balanceService.calculateBalances).mockResolvedValue(unpaidOnly);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/balances?status=unpaid`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.balances).toHaveLength(1);
      expect(data.balances[0].status).toBe("unpaid");
      expect(balanceService.calculateBalances).toHaveBeenCalledWith(
        expect.any(String),
        propertyId,
        "unpaid"
      );
    });
  });

  describe("bad cases", () => {
    it("GET returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/balances`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET accepts status=paid filter", async () => {
      vi.mocked(balanceService.calculateBalances).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/balances?status=paid`
      );

      await GET(request, { params: Promise.resolve({ propertyId }) });

      expect(balanceService.calculateBalances).toHaveBeenCalledWith(
        expect.any(String),
        propertyId,
        "paid"
      );
    });
  });
});
