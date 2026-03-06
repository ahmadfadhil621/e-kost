// Traceability: outstanding-balance
// REQ 2.1, 2.2, 2.3, 2.4 -> it('GET returns 200 with balance breakdown')
// REQ 5.4, 5.5 -> it('GET returns 200 with balance breakdown')
// REQ 1.4, 1.5 -> it('GET returns 200 with paid status when payments exceed rent')
// PROP 5 -> it('GET returns 200 with balance breakdown (monthlyRent, totalPayments, outstanding)')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/balance-service-instance", () => ({
  balanceService: {
    calculateBalance: vi.fn(),
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

describe("GET /api/properties/[propertyId]/tenants/[tenantId]/balance", () => {
  describe("good cases", () => {
    it("GET returns 200 with balance breakdown (monthlyRent, totalPayments, outstanding)", async () => {
      const balance = {
        tenantId,
        tenantName: "Jane Doe",
        roomNumber: "A101",
        monthlyRent: 1500000,
        totalPayments: 500000,
        outstandingBalance: 1000000,
        status: "unpaid" as const,
      };
      vi.mocked(balanceService.calculateBalance).mockResolvedValue(balance);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/balance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tenantId).toBe(tenantId);
      expect(data.monthlyRent).toBe(1500000);
      expect(data.totalPayments).toBe(500000);
      expect(data.outstandingBalance).toBe(1000000);
      expect(data.status).toBe("unpaid");
    });

    it("GET returns 200 with paid status when payments exceed rent", async () => {
      vi.mocked(balanceService.calculateBalance).mockResolvedValue({
        tenantId,
        tenantName: "Jane",
        roomNumber: "B202",
        monthlyRent: 1000000,
        totalPayments: 1000000,
        outstandingBalance: 0,
        status: "paid",
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/balance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.outstandingBalance).toBe(0);
      expect(data.status).toBe("paid");
    });
  });

  describe("bad cases", () => {
    it("GET returns 400 when tenant has no room assignment", async () => {
      vi.mocked(balanceService.calculateBalance).mockRejectedValueOnce(
        new Error("Cannot calculate balance: tenant not found or has no room assignment")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/balance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/cannot calculate balance|no room|not found/i);
    });

    it("GET returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/balance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET returns 500 on unexpected error", async () => {
      vi.mocked(balanceService.calculateBalance).mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/balance`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toMatch(/internal|error/i);
    });
  });
});
