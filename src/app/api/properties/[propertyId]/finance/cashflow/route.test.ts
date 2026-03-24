// Traceability: finance-cashflow
// AC-2 -> it('GET returns 200 with cashflow entries for valid year and month')
// AC-2 -> it('GET returns empty array for month with no transactions')
// AC-2 -> it('GET returns 400 when year param is missing')
// AC-2 -> it('GET returns 400 when month param is missing')
// AC-2 -> it('GET returns 400 for invalid year below minimum')
// AC-2 -> it('GET returns 400 for non-numeric year')
// AC-2 -> it('GET returns 400 for month out of range')
// AC-2 -> it('GET returns 403 when property access is denied')
// AC-2 -> it('GET returns 200 for minimum boundary year=2000 month=1')
// AC-2 -> it('GET returns 200 for maximum boundary year=2100 month=12')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";
import { createCashflowEntry } from "@/test/fixtures/cashflow";

const propertyId = "prop-cashflow-123";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/cashflow-service-instance", () => ({
  cashflowService: {
    getMonthlyCashflow: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { cashflowService } = await import("@/lib/cashflow-service-instance");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

function makeRequest(url: string): Request {
  return new Request(url);
}

function routeParams(id: string = propertyId) {
  return { params: Promise.resolve({ propertyId: id }) };
}

describe("GET /api/properties/[propertyId]/finance/cashflow", () => {
  describe("good cases", () => {
    it("GET returns 200 with cashflow entries for valid year and month", async () => {
      const entries = [
        createCashflowEntry({ date: "2026-03-20", type: "income", description: "John Doe", amount: 1500000 }),
        createCashflowEntry({ date: "2026-03-15", type: "expense", description: "electricity", amount: 75000 }),
      ];
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue(entries);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=3`
      );

      const response = await GET(request, routeParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        date: "2026-03-20",
        type: "income",
        description: "John Doe",
        amount: 1500000,
      });
      expect(data[1]).toMatchObject({
        date: "2026-03-15",
        type: "expense",
        description: "electricity",
        amount: 75000,
      });
      expect(cashflowService.getMonthlyCashflow).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2026,
        3
      );
    });

    it("GET returns empty array for month with no transactions", async () => {
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=2`
      );

      const response = await GET(request, routeParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("GET calls service with correct parsed year and month", async () => {
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2025&month=11`
      );

      await GET(request, routeParams());

      expect(cashflowService.getMonthlyCashflow).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2025,
        11
      );
    });
  });

  describe("bad cases", () => {
    it("GET returns 400 when year param is missing", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?month=3`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
      expect(cashflowService.getMonthlyCashflow).not.toHaveBeenCalled();
    });

    it("GET returns 400 when month param is missing", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
      expect(cashflowService.getMonthlyCashflow).not.toHaveBeenCalled();
    });

    it("GET returns 400 for year below minimum (1999)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=1999&month=3`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for non-numeric year", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=abc&month=3`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for month above maximum (13)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=13`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 400 for month below minimum (0)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=0`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 403 when property access is denied", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=3`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(403);
      expect(cashflowService.getMonthlyCashflow).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 for minimum boundary year=2000 month=1", async () => {
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2000&month=1`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(200);
      expect(cashflowService.getMonthlyCashflow).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2000,
        1
      );
    });

    it("GET returns 200 for maximum boundary year=2100 month=12", async () => {
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue([]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2100&month=12`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(200);
      expect(cashflowService.getMonthlyCashflow).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2100,
        12
      );
    });

    it("GET returns 400 for year above maximum (2101)", async () => {
      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2101&month=3`
      );

      const response = await GET(request, routeParams());

      expect(response.status).toBe(400);
    });

    it("GET returns 200 with single entry when list has exactly one", async () => {
      const single = createCashflowEntry({ type: "expense", amount: 50000 });
      vi.mocked(cashflowService.getMonthlyCashflow).mockResolvedValue([single]);

      const request = makeRequest(
        `http://localhost:3000/api/properties/${propertyId}/finance/cashflow?year=2026&month=3`
      );

      const response = await GET(request, routeParams());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(single.id);
    });
  });
});
