// Traceability: dashboard-overview
// REQ 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1 -> it('GET returns 200 with occupancy, finance, outstandingBalances, recentPayments')
// REQ 1.5, 3.4, 4.4 -> it('GET returns 200 with zeros and empty arrays for empty property')
// REQ 5.1 -> it('GET returns within 3 seconds (performance)')
// REQ 5.2 -> it('GET returns 200 with occupancy, finance, outstandingBalances, recentPayments') -- data reflects current state
// (covered by E2E) -> REQ 5.3, 5.4, 6.x
// REQ 5.1 (partial) -> it('GET returns within 3 seconds (performance)')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import {
  createOccupancyStats,
  createFinanceSummarySnapshot,
  createOutstandingBalance,
  createRecentPayment,
} from "@/test/fixtures/dashboard";

const propertyId = "prop-dashboard-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/dashboard-service-instance", () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { dashboardService } = await import(
  "@/lib/dashboard-service-instance"
);

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("GET /api/properties/[propertyId]/dashboard", () => {
  describe("good cases", () => {
    it("GET returns 200 with occupancy, finance, outstandingBalances, recentPayments", async () => {
      const occupancy = createOccupancyStats({
        totalRooms: 10,
        occupied: 6,
        available: 3,
        underRenovation: 1,
        occupancyRate: 60,
      });
      const finance = createFinanceSummarySnapshot({
        year: 2026,
        month: 3,
        income: 3000000,
        expenses: 500000,
        netIncome: 2500000,
      });
      const balances = [
        createOutstandingBalance({
          tenantId: "t1",
          tenantName: "Alice",
          roomNumber: "A1",
          balance: 500000,
        }),
      ];
      const paymentDate = new Date("2026-03-05");
      const recentPayments = [
        createRecentPayment({
          paymentId: "p1",
          tenantName: "Bob",
          amount: 1500000,
          date: paymentDate,
        }),
      ];

      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        occupancy,
        finance,
        outstandingBalances: balances,
        outstandingCount: 1,
        recentPayments,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/dashboard`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.occupancy).toBeDefined();
      expect(data.occupancy.totalRooms).toBe(10);
      expect(data.occupancy.occupied).toBe(6);
      expect(data.occupancy.available).toBe(3);
      expect(data.occupancy.underRenovation).toBe(1);
      expect(data.occupancy.occupancyRate).toBe(60);

      expect(data.finance).toBeDefined();
      expect(data.finance.year).toBe(2026);
      expect(data.finance.month).toBe(3);
      expect(data.finance.income).toBe(3000000);
      expect(data.finance.expenses).toBe(500000);
      expect(data.finance.netIncome).toBe(2500000);

      expect(Array.isArray(data.outstandingBalances)).toBe(true);
      expect(data.outstandingBalances).toHaveLength(1);
      expect(data.outstandingBalances[0].tenantName).toBe("Alice");
      expect(data.outstandingBalances[0].roomNumber).toBe("A1");
      expect(data.outstandingBalances[0].balance).toBe(500000);
      expect(data.outstandingCount).toBe(1);

      expect(Array.isArray(data.recentPayments)).toBe(true);
      expect(data.recentPayments).toHaveLength(1);
      expect(data.recentPayments[0].tenantName).toBe("Bob");
      expect(data.recentPayments[0].amount).toBe(1500000);
      expect(new Date(data.recentPayments[0].date).toISOString()).toBe(
        paymentDate.toISOString()
      );

      expect(dashboardService.getDashboardData).toHaveBeenCalledWith(
        "test-user-id",
        propertyId
      );
    });

    it("GET returns 200 with zeros and empty arrays for empty property", async () => {
      const occupancy = createOccupancyStats({
        totalRooms: 0,
        occupied: 0,
        available: 0,
        underRenovation: 0,
        occupancyRate: 0,
      });
      const finance = createFinanceSummarySnapshot({
        income: 0,
        expenses: 0,
        netIncome: 0,
      });

      vi.mocked(dashboardService.getDashboardData).mockResolvedValue({
        occupancy,
        finance,
        outstandingBalances: [],
        outstandingCount: 0,
        recentPayments: [],
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/dashboard`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.occupancy.totalRooms).toBe(0);
      expect(data.occupancy.occupancyRate).toBe(0);
      expect(data.finance.income).toBe(0);
      expect(data.finance.expenses).toBe(0);
      expect(data.finance.netIncome).toBe(0);
      expect(data.outstandingBalances).toEqual([]);
      expect(data.outstandingCount).toBe(0);
      expect(data.recentPayments).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("GET returns 403 when not authenticated", async () => {
      vi.mocked(dashboardService.getDashboardData).mockClear();
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        ),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/dashboard`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
      expect(dashboardService.getDashboardData).not.toHaveBeenCalled();
    });

    it("GET returns 404 when property not found", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: "user-1",
        role: null,
        errorResponse: NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        ),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/nonexistent/dashboard`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId: "nonexistent" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("edge cases", () => {
    it("GET returns 500 when dashboard service throws", async () => {
      vi.mocked(dashboardService.getDashboardData).mockRejectedValueOnce(
        new Error("DB error")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/dashboard`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("GET returns within 3 seconds (performance)", async () => {
      vi.mocked(dashboardService.getDashboardData).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  occupancy: createOccupancyStats(),
                  finance: createFinanceSummarySnapshot(),
                  outstandingBalances: [],
                  outstandingCount: 0,
                  recentPayments: [],
                }),
              10
            )
          )
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/dashboard`
      );
      const start = Date.now();
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      expect(elapsed).toBeLessThan(3000);
    });
  });
});
