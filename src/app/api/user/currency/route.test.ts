// Traceability: settings-currency-management
// AC-2 -> it('GET returns 200 with current currency code when authenticated')
// AC-2 -> it('GET returns 401 when not authenticated')
// AC-2 -> it('PATCH returns 200 when updating to a valid currency code')
// AC-2 -> it('PATCH returns 400 when currency code is invalid')
// AC-2 -> it('PATCH returns 401 when not authenticated')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, PATCH } from "./route";

const mockSession = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
  session: {} as unknown,
};

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/user-service", () => ({
  userService: {
    getCurrency: vi.fn(),
    updateCurrency: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { userService } = await import("@/lib/user-service");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(userService.getCurrency).mockResolvedValue("EUR");
  vi.mocked(userService.updateCurrency).mockResolvedValue("IDR");
});

function makeGetRequest() {
  return new Request("http://localhost:3000/api/user/currency", { method: "GET" });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost:3000/api/user/currency", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/user/currency", () => {
  describe("good cases", () => {
    it("returns 200 with current currency code when authenticated", async () => {
      vi.mocked(userService.getCurrency).mockResolvedValue("IDR");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { currency: "IDR" } });
      expect(userService.getCurrency).toHaveBeenCalledWith("user-1");
    });

    it("returns the default EUR currency when user has not changed preference", async () => {
      vi.mocked(userService.getCurrency).mockResolvedValue("EUR");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { currency: "EUR" } });
    });
  });

  describe("bad cases", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await GET(makeGetRequest());

      expect(res.status).toBe(401);
      expect(userService.getCurrency).not.toHaveBeenCalled();
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.getCurrency).mockRejectedValue(new Error("DB error"));

      const res = await GET(makeGetRequest());

      expect(res.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("passes the authenticated userId to getCurrency", async () => {
      await GET(makeGetRequest());

      expect(userService.getCurrency).toHaveBeenCalledWith("user-1");
    });

    it("response body matches { data: { currency } } shape exactly", async () => {
      vi.mocked(userService.getCurrency).mockResolvedValue("IDR");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(Object.keys(body)).toEqual(["data"]);
      expect(Object.keys(body.data)).toEqual(["currency"]);
      expect(body.data.currency).toBe("IDR");
    });
  });
});

describe("PATCH /api/user/currency", () => {
  describe("good cases", () => {
    it("returns 200 with updated currency code for valid input", async () => {
      vi.mocked(userService.updateCurrency).mockResolvedValue("IDR");

      const res = await PATCH(makePatchRequest({ currency: "IDR" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { currency: "IDR" } });
      expect(userService.updateCurrency).toHaveBeenCalledWith("user-1", "IDR");
    });

    it('accepts "EUR" as a valid currency code', async () => {
      vi.mocked(userService.updateCurrency).mockResolvedValue("EUR");

      const res = await PATCH(makePatchRequest({ currency: "EUR" }));

      expect(res.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await PATCH(makePatchRequest({ currency: "IDR" }));

      expect(res.status).toBe(401);
      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });

    it("returns 400 when currency code is shorter than 3 characters", async () => {
      const res = await PATCH(makePatchRequest({ currency: "ID" }));

      expect(res.status).toBe(400);
      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });

    it("returns 400 when currency field is missing", async () => {
      const res = await PATCH(makePatchRequest({}));

      expect(res.status).toBe(400);
      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });

    it("returns 400 when currency is empty string", async () => {
      const res = await PATCH(makePatchRequest({ currency: "" }));

      expect(res.status).toBe(400);
      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.updateCurrency).mockRejectedValue(new Error("DB error"));

      const res = await PATCH(makePatchRequest({ currency: "IDR" }));

      expect(res.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("does not call updateCurrency when currency code is invalid", async () => {
      await PATCH(makePatchRequest({ currency: "XX" }));

      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });

    it("does not call updateCurrency when body is empty object", async () => {
      await PATCH(makePatchRequest({}));

      expect(userService.updateCurrency).not.toHaveBeenCalled();
    });
  });
});
