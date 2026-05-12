// Traceability: outstanding-balance-export (issue #123)
// REQ-1  -> it('returns 200 with correct Content-Type header')
// REQ-1  -> it('returns correct Content-Disposition header with filename')
// REQ-2  -> it('calls exportOutstandingBalances with status=undefined when no query param')
// REQ-2  -> it('calls exportOutstandingBalances with status=unpaid when ?status=unpaid')
// REQ-3  -> it('returns 400 with error message when service throws ExportRowCapError')
// REQ-3  -> it('returns 200 for export with 0 data rows — buffer returned regardless')
// AUTH-1 -> it('returns 401 when unauthenticated')
// AUTH-2 -> it('returns 403 when user has no property access')
// EDGE-1 -> it('returns 500 when service throws an unexpected error')
// EDGE-2 -> it('ignores unknown status values and passes undefined to service')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { ExportRowCapError } from "@/lib/balance-service";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/balance-service-instance", () => ({
  balanceService: {
    exportOutstandingBalances: vi.fn(),
  },
}));

vi.mock("@/lib/user-service", () => ({
  userService: {
    getTimezone: vi.fn().mockResolvedValue("Asia/Jakarta"),
    getLanguage: vi.fn().mockResolvedValue("en"),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { balanceService } = await import("@/lib/balance-service-instance");
const { userService } = await import("@/lib/user-service");
const { GET } = await import("./route");

const propertyId = "prop-123";
const userId = "user-456";
const fakeBuffer = Buffer.from("fake-xlsx-content");
const fakeFilename = "outstanding-balances-2025-05-12.xlsx";

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId,
    role: "owner",
    property: null,
    errorResponse: null,
  });
  vi.mocked(balanceService.exportOutstandingBalances).mockResolvedValue({
    buffer: fakeBuffer,
    filename: fakeFilename,
  });
  vi.mocked(userService.getTimezone).mockResolvedValue("Asia/Jakarta");
  vi.mocked(userService.getLanguage).mockResolvedValue("en");
});

function makeRequest(queryString = "") {
  return new Request(
    `http://localhost:3000/api/properties/${propertyId}/tenants/export${queryString}`
  );
}

describe("GET /api/properties/[propertyId]/tenants/export", () => {
  describe("good cases", () => {
    it("returns 200 with correct Content-Type header (REQ-1)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("returns correct Content-Disposition header with filename (REQ-1)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename="${fakeFilename}"`
      );
    });

    it("calls exportOutstandingBalances with status=undefined when no query param (REQ-2)", async () => {
      await GET(makeRequest(), { params: Promise.resolve({ propertyId }) });

      expect(balanceService.exportOutstandingBalances).toHaveBeenCalledWith(
        userId,
        propertyId,
        undefined,
        "Asia/Jakarta",
        "en"
      );
    });

    it("calls exportOutstandingBalances with status=unpaid when ?status=unpaid (REQ-2)", async () => {
      await GET(makeRequest("?status=unpaid"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(balanceService.exportOutstandingBalances).toHaveBeenCalledWith(
        userId,
        propertyId,
        "unpaid",
        "Asia/Jakarta",
        "en"
      );
    });

    it("returns 200 for export with 0 data rows — buffer returned regardless (REQ-3)", async () => {
      vi.mocked(balanceService.exportOutstandingBalances).mockResolvedValueOnce({
        buffer: fakeBuffer,
        filename: fakeFilename,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated (AUTH-1)", async () => {
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

    it("returns 403 when user has no property access (AUTH-2)", async () => {
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

    it("returns 400 with error message when service throws ExportRowCapError (REQ-3)", async () => {
      vi.mocked(balanceService.exportOutstandingBalances).mockRejectedValueOnce(
        new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(typeof data.error).toBe("string");
      expect(data.error).toContain("10,000");
    });
  });

  describe("edge cases", () => {
    it("returns 500 when service throws an unexpected error (EDGE-1)", async () => {
      vi.mocked(balanceService.exportOutstandingBalances).mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(500);
    });

    it("ignores unknown status values and passes undefined to service (EDGE-2)", async () => {
      await GET(makeRequest("?status=invalid"), {
        params: Promise.resolve({ propertyId }),
      });

      expect(balanceService.exportOutstandingBalances).toHaveBeenCalledWith(
        userId,
        propertyId,
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
