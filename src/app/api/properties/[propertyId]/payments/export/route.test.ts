// Traceability: finance-payment-export (issue #121)
// AC-1  -> it('GET returns 200 with correct Content-Type header')
// AC-1  -> it('GET returns correct Content-Disposition header with filename')
// AC-1  -> it('GET passes dateFrom and dateTo filters to service when provided')
// AC-5  -> it('GET returns 400 with error message when service throws ExportRowCapError')
// AC-6  -> it('GET returns 200 for export with 0 data rows')
// AC-9  -> (enforced by server-only import — not testable at route level)
// REQ-auth-1 -> it('GET returns 401 when unauthenticated')
// REQ-auth-2 -> it('GET returns 403 when user has no property access')
// REQ-filter-1 -> it('GET returns 400 when dateFrom format is invalid')
// REQ-filter-2 -> it('GET returns 400 when dateTo format is invalid')
// EDGE-1 -> it('passes only dateFrom when dateTo is omitted')
// EDGE-2 -> it('passes only dateTo when dateFrom is omitted')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { ExportRowCapError } from "@/lib/payment-service";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/payment-service-instance", () => ({
  paymentService: {
    exportPayments: vi.fn(),
  },
}));

vi.mock("@/lib/user-service", () => ({
  userService: {
    getTimezone: vi.fn().mockResolvedValue("Asia/Jakarta"),
    getLanguage: vi.fn().mockResolvedValue("en"),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { paymentService } = await import("@/lib/payment-service-instance");
const { userService } = await import("@/lib/user-service");
const { GET } = await import("./route");

const propertyId = "prop-123";
const userId = "user-456";
const fakeBuffer = Buffer.from("fake-xlsx-content");
const fakeFilename = "payments-2025-05-03.xlsx";

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId,
    role: "owner",
    property: null,
    errorResponse: null,
  });
  vi.mocked(paymentService.exportPayments).mockResolvedValue({
    buffer: fakeBuffer,
    filename: fakeFilename,
  });
  vi.mocked(userService.getTimezone).mockResolvedValue("Asia/Jakarta");
  vi.mocked(userService.getLanguage).mockResolvedValue("en");
});

function makeRequest(queryString = "") {
  return new Request(
    `http://localhost:3000/api/properties/${propertyId}/payments/export${queryString}`
  );
}

describe("GET /api/properties/[propertyId]/payments/export", () => {
  describe("good cases", () => {
    it("returns 200 with correct Content-Type header (AC-1)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("returns correct Content-Disposition header with filename (AC-1)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename="${fakeFilename}"`
      );
    });

    it("passes dateFrom and dateTo filters to service when provided (AC-1)", async () => {
      const response = await GET(
        makeRequest("?dateFrom=2025-01-01&dateTo=2025-05-31"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(200);
      expect(paymentService.exportPayments).toHaveBeenCalledWith(
        userId,
        propertyId,
        { dateFrom: "2025-01-01", dateTo: "2025-05-31" },
        "Asia/Jakarta",
        "en"
      );
    });

    it("calls exportPayments with empty filters when no query params (AC-1)", async () => {
      await GET(makeRequest(), { params: Promise.resolve({ propertyId }) });

      expect(paymentService.exportPayments).toHaveBeenCalledWith(
        userId,
        propertyId,
        {},
        "Asia/Jakarta",
        "en"
      );
    });

    it("returns 200 for export with 0 data rows — buffer returned regardless (AC-6)", async () => {
      vi.mocked(paymentService.exportPayments).mockResolvedValue({
        buffer: fakeBuffer,
        filename: "payments-2025-05-03.xlsx",
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 403 when user has no property access", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 400 with error message when service throws ExportRowCapError (AC-5)", async () => {
      vi.mocked(paymentService.exportPayments).mockRejectedValueOnce(
        new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
    });

    it("returns 400 when dateFrom format is invalid (REQ-filter-1)", async () => {
      const response = await GET(
        makeRequest("?dateFrom=not-a-date"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when dateTo format is invalid (REQ-filter-2)", async () => {
      const response = await GET(
        makeRequest("?dateTo=2025/05/01"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(400);
    });

    it("returns 500 when service throws an unexpected error", async () => {
      vi.mocked(paymentService.exportPayments).mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("passes only dateFrom when dateTo is omitted", async () => {
      const response = await GET(
        makeRequest("?dateFrom=2025-01-01"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(200);
      expect(paymentService.exportPayments).toHaveBeenCalledWith(
        userId,
        propertyId,
        { dateFrom: "2025-01-01" },
        expect.any(String),
        expect.any(String)
      );
    });

    it("passes only dateTo when dateFrom is omitted", async () => {
      const response = await GET(
        makeRequest("?dateTo=2025-05-31"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(200);
      expect(paymentService.exportPayments).toHaveBeenCalledWith(
        userId,
        propertyId,
        { dateTo: "2025-05-31" },
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
