// Traceability: settings-language-persistence
// REQ 2.1 -> it('PATCH returns 200 with updated language for valid input')
// REQ 2.2 -> it('PATCH returns 401 when unauthenticated')
// REQ 2.3 -> it('PATCH returns 400 for invalid language value')
// REQ 2.4 -> it('GET returns 200 with language when authenticated')
// REQ 2.5 -> it('GET returns 401 when unauthenticated')
// REQ 4.1 -> it('PATCH calls updateLanguage with userId and language')
// REQ 4.2 -> it('GET does not call getLanguage when unauthenticated')
// PROP 2  -> it('GET returns 401 when unauthenticated'), it('PATCH returns 401 when unauthenticated')
// PROP 3  -> it('PATCH returns 400 for invalid language value')

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
    getLanguage: vi.fn(),
    updateLanguage: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { userService } = await import("@/lib/user-service");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(userService.getLanguage).mockResolvedValue("en");
  vi.mocked(userService.updateLanguage).mockResolvedValue("id");
});

function makeGetRequest() {
  return new Request("http://localhost:3000/api/user/language", {
    method: "GET",
  });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost:3000/api/user/language", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/user/language", () => {
  describe("good cases", () => {
    it("returns 200 with language when authenticated", async () => {
      vi.mocked(userService.getLanguage).mockResolvedValue("en");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { language: "en" } });
      expect(userService.getLanguage).toHaveBeenCalledWith("user-1");
    });

    it("returns the persisted non-default language", async () => {
      vi.mocked(userService.getLanguage).mockResolvedValue("id");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { language: "id" } });
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await GET(makeGetRequest());

      expect(res.status).toBe(401);
      expect(userService.getLanguage).not.toHaveBeenCalled();
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.getLanguage).mockRejectedValue(new Error("DB error"));

      const res = await GET(makeGetRequest());

      expect(res.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("passes the authenticated userId to getLanguage", async () => {
      vi.mocked(userService.getLanguage).mockResolvedValue("en");

      await GET(makeGetRequest());

      expect(userService.getLanguage).toHaveBeenCalledWith("user-1");
    });

    it("response body matches { data: { language } } shape exactly", async () => {
      vi.mocked(userService.getLanguage).mockResolvedValue("id");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(Object.keys(body)).toEqual(["data"]);
      expect(Object.keys(body.data)).toEqual(["language"]);
      expect(body.data.language).toBe("id");
    });
  });
});

describe("PATCH /api/user/language", () => {
  describe("good cases", () => {
    it("returns 200 with updated language for valid input", async () => {
      vi.mocked(userService.updateLanguage).mockResolvedValue("id");

      const res = await PATCH(makePatchRequest({ language: "id" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { language: "id" } });
      expect(userService.updateLanguage).toHaveBeenCalledWith("user-1", "id");
    });

    it('accepts "en" as a valid language', async () => {
      vi.mocked(userService.updateLanguage).mockResolvedValue("en");

      const res = await PATCH(makePatchRequest({ language: "en" }));

      expect(res.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await PATCH(makePatchRequest({ language: "en" }));

      expect(res.status).toBe(401);
      expect(userService.updateLanguage).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid language value", async () => {
      const res = await PATCH(makePatchRequest({ language: "fr" }));

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing language field", async () => {
      const res = await PATCH(makePatchRequest({}));

      expect(res.status).toBe(400);
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.updateLanguage).mockRejectedValue(new Error("DB error"));

      const res = await PATCH(makePatchRequest({ language: "id" }));

      expect(res.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("does not call updateLanguage when language is invalid", async () => {
      await PATCH(makePatchRequest({ language: "xx" }));

      expect(userService.updateLanguage).not.toHaveBeenCalled();
    });

    it("does not call updateLanguage when body is empty object", async () => {
      await PATCH(makePatchRequest({}));

      expect(userService.updateLanguage).not.toHaveBeenCalled();
    });
  });
});
