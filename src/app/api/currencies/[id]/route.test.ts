// Traceability: settings-currency-management (updated for Issue #93: property-level currency)
// AC-1 -> it('DELETE returns 200 when dev account deletes an unused currency')
// AC-1 -> it('DELETE returns 403 when non-dev tries to delete')
// AC-1 -> it('DELETE returns 401 when unauthenticated')
// AC-5 -> it('DELETE returns 409 when currency is in use by a property')
// AC-5 -> it('DELETE returns 409 when it is the last currency')
// AC-1 -> it('DELETE returns 404 when currency not found')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { CurrencyInUseError, LastCurrencyError, CurrencyNotFoundError } from "@/lib/currency-service";

const mockSession = {
  user: { id: "dev-user-id", name: "Dev User", email: "dev@example.com" },
  session: {} as unknown,
};

const mockNonDevSession = {
  user: { id: "user-id", name: "Regular User", email: "user@example.com" },
  session: {} as unknown,
};

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/currency-service-instance", () => ({
  currencyService: {
    remove: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { currencyService } = await import("@/lib/currency-service-instance");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  process.env.DEV_EMAILS = "dev@example.com";
});

afterEach(() => {
  delete process.env.DEV_EMAILS;
  vi.resetModules();
});

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost/api/currencies/${id}`, { method: "DELETE" });
}

describe("DELETE /api/currencies/[id]", () => {
  describe("good cases", () => {
    it("returns 200 when dev account deletes an unused currency", async () => {
      vi.mocked(currencyService.remove).mockResolvedValue(undefined);
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("currency-id-1"), {
        params: Promise.resolve({ id: "currency-id-1" }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("data");
    });
  });

  describe("bad cases", () => {
    it("returns 403 when non-dev account tries to delete", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("currency-id-1"), {
        params: Promise.resolve({ id: "currency-id-1" }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
      expect(currencyService.remove).not.toHaveBeenCalled();
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("currency-id-1"), {
        params: Promise.resolve({ id: "currency-id-1" }),
      });

      expect(response.status).toBe(401);
      expect(currencyService.remove).not.toHaveBeenCalled();
    });

    it("returns 409 when currency is in use by a property", async () => {
      vi.mocked(currencyService.remove).mockRejectedValueOnce(new CurrencyInUseError());
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("currency-id-1"), {
        params: Promise.resolve({ id: "currency-id-1" }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body).toHaveProperty("error");
    });

    it("returns 409 when it is the last currency in the system", async () => {
      vi.mocked(currencyService.remove).mockRejectedValueOnce(new LastCurrencyError());
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("only-currency-id"), {
        params: Promise.resolve({ id: "only-currency-id" }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body).toHaveProperty("error");
    });

    it("returns 404 when currency is not found", async () => {
      vi.mocked(currencyService.remove).mockRejectedValueOnce(new CurrencyNotFoundError());
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("nonexistent-id"), {
        params: Promise.resolve({ id: "nonexistent-id" }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toHaveProperty("error");
    });
  });

  describe("edge cases", () => {
    it("passes the id param to currencyService.remove", async () => {
      vi.mocked(currencyService.remove).mockResolvedValue(undefined);
      const { DELETE } = await import("./route");

      const currencyId = crypto.randomUUID();
      await DELETE(makeDeleteRequest(currencyId), {
        params: Promise.resolve({ id: currencyId }),
      });

      expect(currencyService.remove).toHaveBeenCalledWith(
        currencyId,
        expect.any(Function)
      );
    });

    it("returns 200 when DEV_EMAILS is not set (all users treated as dev)", async () => {
      delete process.env.DEV_EMAILS;
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      vi.mocked(currencyService.remove).mockResolvedValue(undefined);
      const { DELETE } = await import("./route");

      const response = await DELETE(makeDeleteRequest("currency-id-1"), {
        params: Promise.resolve({ id: "currency-id-1" }),
      });

      expect(response.status).toBe(200);
    });
  });
});
