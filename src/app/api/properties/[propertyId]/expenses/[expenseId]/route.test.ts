// Traceability: finance-expense-tracking
// REQ 2.1 -> it('GET returns 200 with expense when found')
// REQ 3.2 -> it('PUT returns 200 with updated expense')
// REQ 3.3 -> it('PUT returns 200 with updated expense') -- persist and display confirmation
// REQ 3.5 -> it('PUT returns 400 when amount is negative')
// REQ 4.3 -> it('DELETE returns 204 when expense exists')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, PUT, DELETE } from "./route";
import { createExpense } from "@/test/fixtures/expense";

const propertyId = "prop-123";
const expenseId = "exp-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/expense-service-instance", () => ({
  expenseService: {
    getExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
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

describe("GET /api/properties/[propertyId]/expenses/[expenseId]", () => {
  describe("good cases", () => {
    it("GET returns 200 with expense when found", async () => {
      const expense = createExpense({ id: expenseId, propertyId });
      vi.mocked(expenseService.getExpense).mockResolvedValue(expense);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(expenseId);
      expect(data.category).toBe(expense.category);
      expect(data.amount).toBe(expense.amount);
    });
  });

  describe("bad cases", () => {
    it("GET returns 404 when expense not found", async () => {
      vi.mocked(expenseService.getExpense).mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 with expense when id exists", async () => {
      const expense = createExpense({ id: expenseId, propertyId });
      vi.mocked(expenseService.getExpense).mockResolvedValue(expense);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(expenseId);
    });
  });
});

describe("PUT /api/properties/[propertyId]/expenses/[expenseId]", () => {
  describe("good cases", () => {
    it("PUT returns 200 with updated expense", async () => {
      const updated = createExpense({
        id: expenseId,
        propertyId,
        category: "water",
        amount: 200,
      });
      vi.mocked(expenseService.updateExpense).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "water", amount: 200 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(expenseId);
      expect(data.category).toBe("water");
      expect(data.amount).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("PUT returns 400 when amount is negative", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: -1 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(400);
    });

    it("PUT returns 404 when expense not found", async () => {
      vi.mocked(expenseService.updateExpense).mockRejectedValueOnce(
        new Error("Expense not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 100 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(404);
    });

    it("PUT returns 403 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 100 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("PUT returns 200 when updating only description", async () => {
      const updated = createExpense({
        id: expenseId,
        propertyId,
        description: "Updated",
      });
      vi.mocked(expenseService.updateExpense).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: "Updated" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.description).toBe("Updated");
    });
  });
});

describe("DELETE /api/properties/[propertyId]/expenses/[expenseId]", () => {
  describe("good cases", () => {
    it("DELETE returns 204 when expense exists", async () => {
      vi.mocked(expenseService.deleteExpense).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe("bad cases", () => {
    it("DELETE returns 404 when expense not found", async () => {
      vi.mocked(expenseService.deleteExpense).mockRejectedValueOnce(
        new Error("Expense not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, expenseId }),
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
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("edge cases", () => {
    it("DELETE returns 204 and calls service with expenseId", async () => {
      vi.mocked(expenseService.deleteExpense).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/expenses/${expenseId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, expenseId }),
      });

      expect(response.status).toBe(204);
      expect(expenseService.deleteExpense).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        expenseId
      );
    });
  });
});
