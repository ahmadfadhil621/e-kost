// Traceability: finance-staff-summary (issue #109)
// REQ 2.1  -> it('GET returns 200 with staff summary data for valid year and month')
// REQ 2.2  -> it('GET response contains data array with StaffSummaryEntry fields')
// REQ 2.6  -> it('GET returns 400 when year param is missing')
// REQ 2.6  -> it('GET returns 400 when month param is missing')
// REQ 2.6  -> it('GET returns 400 for invalid year below minimum')
// REQ 2.6  -> it('GET returns 400 for non-numeric month')
// REQ 2.6  -> it('GET returns 400 for month out of range (0 and 13)')
// REQ 2.7  -> it('GET returns 401 when not authenticated')
// REQ 2.8  -> it('GET returns 403 when property access is denied')
// REQ 2.1  -> it('GET returns 200 with empty data array when no activity in period')
// REQ 2.1  -> it('GET returns 200 for boundary year=2000 month=1')
// REQ 2.1  -> it('GET returns 200 for boundary year=2100 month=12')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { createStaffSummaryEntry } from "@/test/fixtures/staff-summary";

const propertyId = "prop-staff-summary-123";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/staff-summary-service-instance", () => ({
  staffSummaryService: {
    getStaffSummary: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { staffSummaryService } = await import("@/lib/staff-summary-service-instance");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    property: null,
    errorResponse: null,
  });
});

function makeRequest(url: string): Request {
  return new Request(url);
}

function routeParams(id: string = propertyId) {
  return { params: Promise.resolve({ propertyId: id }) };
}

describe("GET /api/properties/[propertyId]/finance/staff-summary", () => {
  describe("good cases", () => {
    it("GET returns 200 with staff summary data for valid year and month", async () => {
      const entries = [
        createStaffSummaryEntry({
          actorId: "actor-1",
          actorName: "Ahmad Staff",
          actorRole: "staff",
          totalPayments: 3_500_000,
          totalExpenses: 200_000,
        }),
        createStaffSummaryEntry({
          actorId: "actor-2",
          actorName: "Budi Owner",
          actorRole: "owner",
          totalPayments: 1_000_000,
          totalExpenses: 500_000,
        }),
      ];
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue(entries);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      const response = await GET(request, routeParams());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
    });

    it("GET response data entries contain all required fields", async () => {
      const entry = createStaffSummaryEntry({
        actorId: "actor-1",
        actorName: "Ahmad Staff",
        actorRole: "staff",
        totalPayments: 3_500_000,
        totalExpenses: 200_000,
      });
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([entry]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      const response = await GET(request, routeParams());
      const body = await response.json();

      expect(body.data[0]).toMatchObject({
        actorId: "actor-1",
        actorName: "Ahmad Staff",
        actorRole: "staff",
        totalPayments: 3_500_000,
        totalExpenses: 200_000,
      });
    });

    it("GET returns 200 with empty data array when no activity in period", async () => {
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=1`
      );
      const response = await GET(request, routeParams());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it("GET returns 200 for boundary year=2000 month=1", async () => {
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2000&month=1`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(200);
      expect(staffSummaryService.getStaffSummary).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2000,
        1
      );
    });

    it("GET returns 200 for boundary year=2100 month=12", async () => {
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2100&month=12`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(200);
      expect(staffSummaryService.getStaffSummary).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2100,
        12
      );
    });

    it("GET calls service with the correct userId from withPropertyAccess", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: "specific-user-id",
        role: "staff",
        property: null,
        errorResponse: null,
      });
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      await GET(request, routeParams());

      expect(staffSummaryService.getStaffSummary).toHaveBeenCalledWith(
        "specific-user-id",
        propertyId,
        2026,
        4
      );
    });
  });

  describe("bad cases", () => {
    it("GET returns 401 when not authenticated", async () => {
      const { NextResponse } = await import("next/server");
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(401);
    });

    it("GET returns 403 when property access is denied", async () => {
      const { NextResponse } = await import("next/server");
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(403);
    });

    it("GET returns 400 when year param is missing", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?month=4`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 when month param is missing", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for non-numeric year", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=abc&month=4`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for non-numeric month", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=xyz`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for year below minimum (1999)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=1999&month=4`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for month out of range (0)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=0`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for month out of range (13)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=13`
      );
      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 500 when service throws unexpectedly", async () => {
      vi.mocked(staffSummaryService.getStaffSummary).mockRejectedValue(
        new Error("Unexpected DB failure")
      );

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=4`
      );
      const response = await GET(request, routeParams());
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toHaveProperty("error");
    });
  });

  describe("edge cases", () => {
    it("GET parses year and month as numbers before passing to service", async () => {
      vi.mocked(staffSummaryService.getStaffSummary).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/staff-summary?year=2026&month=04`
      );
      const response = await GET(request, routeParams());
      expect(response.status).toBe(200);
      expect(staffSummaryService.getStaffSummary).toHaveBeenCalledWith(
        expect.any(String),
        propertyId,
        2026,
        4
      );
    });
  });
});
