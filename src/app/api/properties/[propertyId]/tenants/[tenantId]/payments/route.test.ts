// Traceability: payment-recording
// REQ 3.1, 3.2, 3.4, 3.5 -> it('GET returns 200 with payments and count')
// PROP 7, 8, 9 -> it('GET returns 200 with payments and count')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import { createPayment } from "@/test/fixtures/payment";

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/payment-service-instance", () => ({
  paymentService: {
    listTenantPayments: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { paymentService } = await import("@/lib/payment-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("GET /api/properties/[propertyId]/tenants/[tenantId]/payments", () => {
  describe("good cases", () => {
    it("GET returns 200 with payments and count", async () => {
      const payments = [
        createPayment({
          tenantId,
          tenantName: "Jane Doe",
          amount: 500000,
          paymentDate: new Date("2024-06-15"),
        }),
        createPayment({
          tenantId,
          tenantName: "Jane Doe",
          amount: 500000,
          paymentDate: new Date("2024-05-01"),
        }),
      ];
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments,
        count: 2,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.payments[0]).toHaveProperty("amount");
      expect(data.payments[0]).toHaveProperty("paymentDate");
      expect(data.payments[0]).toHaveProperty("createdAt");
    });

    it("GET returns empty payments and count 0 when tenant has no payments", async () => {
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments: [],
        count: 0,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe("bad cases", () => {
    it("GET returns 404 when tenant not found", async () => {
      vi.mocked(paymentService.listTenantPayments).mockRejectedValueOnce(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("GET returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 with empty payments when tenant has no payments", async () => {
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments: [],
        count: 0,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toEqual([]);
      expect(data.count).toBe(0);
    });
  });
});
