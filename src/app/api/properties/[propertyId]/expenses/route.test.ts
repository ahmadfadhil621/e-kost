// Traceability: finance-expense-tracking
// REQ 1.3 -> it('POST returns 201 and expense when body is valid')
// REQ 1.4 -> it('POST returns 400 when required fields are missing')
// REQ 1.5 -> it('POST returns 400 when amount is zero or negative')
// REQ 2.1, 2.3 -> it('GET returns 200 with expenses array')
// REQ 2.5 -> it('GET accepts year, month, category query params')
// PROP 1 -> it('POST returns 201 and expense when body is valid')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST, GET } from "./route";
import { createExpense } from "@/test/fixtures/expense";

const propertyId = "prop-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/expense-service-instance", () => ({
  expenseService: {
    createExpense: vi.fn(),
    listExpenses: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { expenseService } = await import("@/lib/expense-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("POST /api/properties/[propertyId]/expenses", () => {
  describe("good cases", () => {
    it("POST returns 201 and expense when body is valid", async () => {
      const created = createExpense({
        propertyId,
        category: "electricity",
        amount: 50000,
        date: new Date("2026-03-15"),
      });
      vi.mocked(expenseService.createExpense).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "electricity",
            amount: 50000,
            date: "2026-03-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(created.id);
      expect(data.propertyId).toBe(propertyId);
      expect(data.category).toBe("electricity");
      expect(data.amount).toBe(50000);
      expect(data).toHaveProperty("date");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });

    it("POST accepts optional description", async () => {
      const created = createExpense({
        propertyId,
        description: "Monthly bill",
      });
      vi.mocked(expenseService.createExpense).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "water",
            amount: 100,
            date: "2026-03-01",
            description: "Monthly bill",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.description).toBe("Monthly bill");
    });
  });

  describe("bad cases", () => {
    it("POST returns 400 when required fields are missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 50000,
            date: "2026-03-15",
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
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "electricity",
            amount: 0,
            date: "2026-03-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 400 when category is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "invalid",
            amount: 100,
            date: "2026-03-15",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "electricity",
            amount: 100,
            date: "2026-03-15",
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
    it("POST returns 400 when date is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "electricity",
            amount: 100,
            date: "not-a-date",
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

describe("GET /api/properties/[propertyId]/expenses", () => {
  describe("good cases", () => {
    it("GET returns 200 with expenses array", async () => {
      const expenses = [
        createExpense({ propertyId, amount: 50000 }),
        createExpense({ propertyId, amount: 60000 }),
      ];
      vi.mocked(expenseService.listExpenses).mockResolvedValue(expenses);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("category");
      expect(data[0]).toHaveProperty("amount");
      expect(data[0]).toHaveProperty("date");
      expect(data[0]).toHaveProperty("createdAt");
    });

    it("GET returns empty array when no expenses", async () => {
      vi.mocked(expenseService.listExpenses).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("GET accepts year, month, category query params", async () => {
      vi.mocked(expenseService.listExpenses).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses?year=2026&month=3&category=electricity`
      );

      await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(expenseService.listExpenses).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        { year: 2026, month: 3, category: "electricity" }
      );
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
        `http://localhost:3000/api/properties/${propertyId}/expenses`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 with single expense when list has one", async () => {
      const one = createExpense({ propertyId });
      vi.mocked(expenseService.listExpenses).mockResolvedValue([one]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(one.id);
    });
  });
});
