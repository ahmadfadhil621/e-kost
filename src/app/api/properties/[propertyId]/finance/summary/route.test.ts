// Traceability: finance-expense-tracking
// REQ 5.1, 5.2 -> it('GET returns 200 with income, expenses, netIncome, categoryBreakdown')
// REQ 6.2, 6.3 -> it('GET returns 200 with income, expenses, netIncome, categoryBreakdown')
// REQ 7.1 -> it('GET returns netIncome as income minus expenses')
// REQ 8.2 -> it('GET accepts year and month query params')
// PROP 2, 3, 4, 5 -> it('GET returns 200 with income, expenses, netIncome, categoryBreakdown')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const propertyId = "prop-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/finance-summary-service-instance", () => ({
  financeSummaryService: {
    getMonthlySummary: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { financeSummaryService } = await import(
  "@/lib/finance-summary-service-instance"
);

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("GET /api/properties/[propertyId]/finance/summary", () => {
  describe("good cases", () => {
    it("GET returns 200 with income, expenses, netIncome, categoryBreakdown", async () => {
      vi.mocked(financeSummaryService.getMonthlySummary).mockResolvedValue({
        year: 2026,
        month: 3,
        income: 2000000,
        expenses: 500000,
        netIncome: 1500000,
        categoryBreakdown: [
          { category: "electricity", total: 300000, count: 1 },
          { category: "water", total: 200000, count: 1 },
        ],
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2026&month=3`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.year).toBe(2026);
      expect(data.month).toBe(3);
      expect(data.income).toBe(2000000);
      expect(data.expenses).toBe(500000);
      expect(data.netIncome).toBe(1500000);
      expect(Array.isArray(data.categoryBreakdown)).toBe(true);
      expect(data.categoryBreakdown).toHaveLength(2);
      expect(financeSummaryService.getMonthlySummary).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2026,
        3
      );
    });

    it("GET returns netIncome as income minus expenses", async () => {
      vi.mocked(financeSummaryService.getMonthlySummary).mockResolvedValue({
        year: 2026,
        month: 3,
        income: 1000000,
        expenses: 600000,
        netIncome: 400000,
        categoryBreakdown: [],
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2026&month=3`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(data.netIncome).toBe(400000);
    });

    it("GET accepts year and month query params", async () => {
      vi.mocked(financeSummaryService.getMonthlySummary).mockResolvedValue({
        year: 2025,
        month: 12,
        income: 0,
        expenses: 0,
        netIncome: 0,
        categoryBreakdown: [],
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2025&month=12`
      );

      await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(financeSummaryService.getMonthlySummary).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        2025,
        12
      );
    });

    it("GET returns zeros when no data for month", async () => {
      vi.mocked(financeSummaryService.getMonthlySummary).mockResolvedValue({
        year: 2026,
        month: 1,
        income: 0,
        expenses: 0,
        netIncome: 0,
        categoryBreakdown: [],
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2026&month=1`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.income).toBe(0);
      expect(data.expenses).toBe(0);
      expect(data.netIncome).toBe(0);
      expect(data.categoryBreakdown).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("GET returns 400 when year or month missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("GET returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2026&month=3`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET returns 400 when month out of range", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/finance/summary?year=2026&month=13`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });
  });
});
