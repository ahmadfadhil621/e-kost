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

    it("returns 3 items + totalPages when ?limit=3", async () => {
      const payments = Array.from({ length: 3 }, () => createPayment({ tenantId }));
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments,
        count: 15,
        totalPages: 5,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=3`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toHaveLength(3);
      expect(data.count).toBe(15);
      expect(data.totalPages).toBe(5);
    });

    it("returns correct page when ?limit=20&page=2", async () => {
      const payments = Array.from({ length: 20 }, () => createPayment({ tenantId }));
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments,
        count: 50,
        totalPages: 3,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=20&page=2`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toHaveLength(20);
      expect(data.count).toBe(50);
      expect(data.totalPages).toBe(3);
    });

    it("calls service with parsed limit + page options", async () => {
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments: [],
        count: 100,
        totalPages: 10,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=10&page=5`
      );

      await GET(request, { params: Promise.resolve({ propertyId, tenantId }) });

      expect(paymentService.listTenantPayments).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId,
        { limit: 10, page: 5 }
      );
    });

    it("does not include totalPages in response when no limit given", async () => {
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
      expect(data).not.toHaveProperty("totalPages");
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

    it("returns 400 when limit is non-numeric", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=abc`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 when page is non-numeric", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?page=xyz`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 when page is less than 1", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?page=0`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("returns 400 when limit is less than 1", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=0`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
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

    it("returns empty payments when page is beyond last page", async () => {
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments: [],
        count: 10,
        totalPages: 2,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?limit=5&page=99`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payments).toEqual([]);
      expect(data.count).toBe(10);
      expect(data.totalPages).toBe(2);
    });

    it("calls service with no options when only unknown params are given", async () => {
      vi.mocked(paymentService.listTenantPayments).mockResolvedValue({
        payments: [],
        count: 0,
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/payments?unknown=value`
      );

      await GET(request, { params: Promise.resolve({ propertyId, tenantId }) });

      expect(paymentService.listTenantPayments).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId,
        undefined
      );
    });
  });
});
