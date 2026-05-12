// Traceability: finance-cashflow-export (issue #125)
// AC-6  -> it('GET returns 200 with correct Content-Type header')
// AC-6  -> it('GET returns correct Content-Disposition header with filename')
// AC-6  -> it('GET passes year and month filters to service when provided')
// AC-4  -> it('GET returns 200 for export with 0 data rows')
// AC-5  -> it('GET returns 400 with error message when service throws ExportRowCapError')
// AC-6  -> it('GET returns 401 when unauthenticated')
// AC-6  -> it('GET returns 403 when user has no property access')
// AC-8  -> it('GET returns 400 when year is out of range')
// AC-8  -> it('GET returns 400 when month is out of range')
// EDGE-1 -> it('passes only year when month is omitted')
// EDGE-2 -> it('passes no filters when neither year nor month is provided')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { ExportRowCapError } from "@/lib/cashflow-service";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/cashflow-service-instance", () => ({
  cashflowService: {
    exportCashflow: vi.fn(),
  },
}));

vi.mock("@/lib/user-service", () => ({
  userService: {
    getTimezone: vi.fn().mockResolvedValue("Asia/Jakarta"),
    getLanguage: vi.fn().mockResolvedValue("en"),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { cashflowService } = await import("@/lib/cashflow-service-instance");
const { userService } = await import("@/lib/user-service");
const { GET } = await import("./route");

const propertyId = "prop-123";
const userId = "user-456";
const fakeBuffer = Buffer.from("fake-xlsx-content");
const fakeFilename = "cashflow-2025-05.xlsx";

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId,
    role: "owner",
    property: null,
    errorResponse: null,
  });
  vi.mocked(cashflowService.exportCashflow).mockResolvedValue({
    buffer: fakeBuffer,
    filename: fakeFilename,
  });
  vi.mocked(userService.getTimezone).mockResolvedValue("Asia/Jakarta");
  vi.mocked(userService.getLanguage).mockResolvedValue("en");
});

function makeRequest(queryString = "") {
  return new Request(
    `http://localhost:3000/api/properties/${propertyId}/finance/cashflow/export${queryString}`
  );
}

describe("GET /api/properties/[propertyId]/finance/cashflow/export", () => {
  describe("good cases", () => {
    it("returns 200 with correct Content-Type header (AC-6)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("returns correct Content-Disposition header with filename (AC-6)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename="${fakeFilename}"`
      );
    });

    it("passes year and month filters to service when provided (AC-6)", async () => {
      const response = await GET(
        makeRequest("?year=2025&month=5"),
        { params: Promise.resolve({ propertyId }) }
      );

      expect(response.status).toBe(200);
      expect(cashflowService.exportCashflow).toHaveBeenCalledWith(
        userId,
        propertyId,
        { year: 2025, month: 5 },
        "Asia/Jakarta",
        "en"
      );
    });

    it("returns 200 for export with 0 data rows (AC-4)", async () => {
      vi.mocked(cashflowService.exportCashflow).mockResolvedValueOnce({
        buffer: Buffer.from("empty-xlsx"),
        filename: "cashflow-2025-05.xlsx",
      });

      const response = await GET(makeRequest("?year=2025&month=5"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
    });

    it("calls userService.getTimezone and getLanguage with userId (AC-6)", async () => {
      await GET(makeRequest(), { params: Promise.resolve({ propertyId }) });

      expect(userService.getTimezone).toHaveBeenCalledWith(userId);
      expect(userService.getLanguage).toHaveBeenCalledWith(userId);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated (AC-6)", async () => {
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

    it("returns 403 when user has no property access (AC-6)", async () => {
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
      vi.mocked(cashflowService.exportCashflow).mockRejectedValueOnce(
        new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
      const body = await response.json() as { error: string };
      expect(body.error).toContain("10,000");
    });

    it("returns 400 when year is out of range (AC-8)", async () => {
      const response = await GET(makeRequest("?year=1999"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when month is out of range (AC-8)", async () => {
      const response = await GET(makeRequest("?month=13"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("edge cases", () => {
    it("passes only year when month is omitted (EDGE-1)", async () => {
      const response = await GET(makeRequest("?year=2025"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(cashflowService.exportCashflow).toHaveBeenCalledWith(
        userId,
        propertyId,
        { year: 2025 },
        expect.any(String),
        expect.any(String)
      );
    });

    it("passes no filters when neither year nor month is provided (EDGE-2)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(cashflowService.exportCashflow).toHaveBeenCalledWith(
        userId,
        propertyId,
        {},
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
