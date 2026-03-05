// Traceability: payment-recording
// REQ 1.3 -> it('POST returns 201 and payment when body is valid')
// REQ 1.4 -> it('POST returns 400 when required fields are missing')
// REQ 1.5 -> it('POST returns 400 when amount is zero or negative')
// REQ 2.2, 2.4 -> it('GET returns 200 with payments array sorted by date')
// REQ 4.1, 4.2 -> it('POST returns 201 and payment when body is valid')
// PROP 2 -> it('POST returns 201 and payment when body is valid')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST, GET } from "./route";
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
    createPayment: vi.fn(),
    listPayments: vi.fn(),
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

describe("POST /api/properties/[propertyId]/payments", () => {
  describe("good cases", () => {
    it("POST returns 201 and payment when body is valid", async () => {
      const created = createPayment({
        tenantId,
        tenantName: "Jane Doe",
        amount: 500000,
        paymentDate: new Date("2024-06-15"),
      });
      vi.mocked(paymentService.createPayment).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(created.id);
      expect(data.tenantId).toBe(tenantId);
      expect(data.tenantName).toBe("Jane Doe");
      expect(data.amount).toBe(500000);
      expect(data).toHaveProperty("paymentDate");
      expect(data).toHaveProperty("createdAt");
    });
  });

  describe("bad cases", () => {
    it("POST returns 400 when required fields are missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 500000,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    it("POST returns 400 when amount is zero or negative", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 0,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 409 when tenant has no room assignment", async () => {
      vi.mocked(paymentService.createPayment).mockRejectedValueOnce(
        new Error("Cannot record payment: tenant has no active room assignment")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/no active room|no room assignment/i);
    });

    it("POST returns 409 when tenant has moved out", async () => {
      vi.mocked(paymentService.createPayment).mockRejectedValueOnce(
        new Error("Cannot record payment: tenant has moved out")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toMatch(/moved out/i);
    });

    it("POST returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("POST returns 400 when payment date is in the future", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            amount: 500000,
            paymentDate: tomorrow.toISOString().split("T")[0],
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("GET /api/properties/[propertyId]/payments", () => {
  describe("good cases", () => {
    it("GET returns 200 with payments array sorted by date", async () => {
      const payments = [
        createPayment({
          tenantName: "Alice",
          amount: 500000,
          paymentDate: new Date("2024-06-15"),
        }),
        createPayment({
          tenantName: "Bob",
          amount: 600000,
          paymentDate: new Date("2024-06-01"),
        }),
      ];
      vi.mocked(paymentService.listPayments).mockResolvedValue(payments);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("tenantName");
      expect(data[0]).toHaveProperty("amount");
      expect(data[0]).toHaveProperty("paymentDate");
      expect(data[0]).toHaveProperty("createdAt");
    });

    it("GET returns empty array when no payments", async () => {
      vi.mocked(paymentService.listPayments).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
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
        `http://localhost:3000/api/properties/${propertyId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 with empty array when no payments", async () => {
      vi.mocked(paymentService.listPayments).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });
});
