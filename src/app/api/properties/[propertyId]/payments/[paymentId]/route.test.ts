// Traceability: finance-inline-cards (issue #86)
// AC-API-1 -> it('DELETE returns 204 when payment exists')
// AC-API-2 -> it('DELETE returns 404 when payment not found')
// AC-API-3 -> it('DELETE returns 403 when not authenticated')
// AC-API-4 -> it('DELETE returns 204 and calls service with correct arguments')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { DELETE } from "./route";

const propertyId = "prop-123";
const paymentId = "pay-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/payment-service-instance", () => ({
  paymentService: {
    deletePayment: vi.fn(),
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

describe("DELETE /api/properties/[propertyId]/payments/[paymentId]", () => {
  describe("good cases", () => {
    it("DELETE returns 204 when payment exists", async () => {
      vi.mocked(paymentService.deletePayment).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments/${paymentId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, paymentId }),
      });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe("bad cases", () => {
    it("DELETE returns 404 when payment not found", async () => {
      vi.mocked(paymentService.deletePayment).mockRejectedValueOnce(
        new Error("Payment not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments/${paymentId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, paymentId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("DELETE returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments/${paymentId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, paymentId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("DELETE returns 204 and calls service with correct arguments", async () => {
      vi.mocked(paymentService.deletePayment).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/payments/${paymentId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, paymentId }),
      });

      expect(response.status).toBe(204);
      expect(paymentService.deletePayment).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        paymentId
      );
    });
  });
});
