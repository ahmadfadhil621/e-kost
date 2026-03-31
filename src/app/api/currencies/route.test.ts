// Traceability: settings-currency-management
// AC-1 -> it('GET returns 200 with currency list when authenticated')
// AC-1 -> it('GET returns 401 when not authenticated')
// AC-1 -> it('POST returns 201 when dev account creates a valid currency')
// AC-1 -> it('POST returns 403 when non-dev account tries to create')
// AC-1 -> it('POST returns 400 on invalid input')
// AC-1 -> it('POST returns 409 when code already exists')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";
import { createCurrency } from "@/test/fixtures/currency";
import { CurrencyExistsError } from "@/lib/currency-service";

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
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn(),
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

describe("GET /api/currencies", () => {
  describe("good cases", () => {
    it("returns 200 with currency list when authenticated", async () => {
      const currencies = [
        createCurrency({ code: "EUR", locale: "en-IE", label: "Euro" }),
        createCurrency({ code: "IDR", locale: "id-ID", label: "Indonesian Rupiah" }),
      ];
      vi.mocked(currencyService.list).mockResolvedValue(currencies);
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/currencies");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].code).toBe("EUR");
    });
  });

  describe("bad cases", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/currencies");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns empty array when no currencies are configured", async () => {
      vi.mocked(currencyService.list).mockResolvedValue([]);
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/currencies");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });
});

describe("POST /api/currencies", () => {
  describe("good cases", () => {
    it("returns 201 when dev account creates a valid currency", async () => {
      const created = createCurrency({ code: "USD", locale: "en-US", label: "US Dollar" });
      vi.mocked(currencyService.add).mockResolvedValue(created);
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "USD", locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.data.code).toBe("USD");
      expect(body.data.locale).toBe("en-US");
      expect(body.data.label).toBe("US Dollar");
    });
  });

  describe("bad cases", () => {
    it("returns 403 when non-dev account tries to create", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "USD", locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("error");
      expect(currencyService.add).not.toHaveBeenCalled();
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "USD", locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(currencyService.add).not.toHaveBeenCalled();
    });

    it("returns 400 when code is missing", async () => {
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(currencyService.add).not.toHaveBeenCalled();
    });

    it("returns 400 when code is shorter than 3 characters", async () => {
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "US", locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(currencyService.add).not.toHaveBeenCalled();
    });

    it("returns 400 when code is longer than 3 characters", async () => {
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "USDD", locale: "en-US", label: "US Dollar" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(currencyService.add).not.toHaveBeenCalled();
    });

    it("returns 409 when currency code already exists", async () => {
      vi.mocked(currencyService.add).mockRejectedValueOnce(new CurrencyExistsError());
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "EUR", locale: "en-IE", label: "Euro" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body).toHaveProperty("error");
    });
  });

  describe("edge cases", () => {
    it("returns 201 when DEV_EMAILS is not set (all users treated as dev)", async () => {
      delete process.env.DEV_EMAILS;
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const created = createCurrency({ code: "GBP", locale: "en-GB", label: "British Pound" });
      vi.mocked(currencyService.add).mockResolvedValue(created);
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "GBP", locale: "en-GB", label: "British Pound" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });
});
