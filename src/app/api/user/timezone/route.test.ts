// Traceability: settings-timezone (issue #120)
// REQ Session.1 -> it('GET returns 200 with timezone when authenticated')
// REQ Storage.1 -> it('GET returns 200 with null timezone when never set')
// REQ Session.1 -> it('GET returns 401 when unauthenticated')
// REQ API.1     -> it('PATCH returns 200 with updated timezone for valid IANA input')
// REQ API.2     -> it('PATCH returns 401 when unauthenticated')
// REQ API.3     -> it('PATCH returns 400 for invalid IANA string')
// REQ API.3     -> it('PATCH returns 400 for empty string')
// PROP 2        -> it('PATCH returns 400 for invalid IANA strings')

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
    getTimezone: vi.fn(),
    updateTimezone: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { userService } = await import("@/lib/user-service");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(userService.getTimezone).mockResolvedValue("Asia/Jakarta");
  vi.mocked(userService.updateTimezone).mockResolvedValue("Asia/Jakarta");
});

function makeGetRequest() {
  return new Request("http://localhost:3000/api/user/timezone", {
    method: "GET",
  });
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost:3000/api/user/timezone", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/user/timezone", () => {
  describe("good cases", () => {
    it("returns 200 with timezone when authenticated", async () => {
      vi.mocked(userService.getTimezone).mockResolvedValue("Asia/Jakarta");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { timezone: "Asia/Jakarta" } });
      expect(userService.getTimezone).toHaveBeenCalledWith("user-1");
    });

    it("returns 200 with null timezone when never set", async () => {
      vi.mocked(userService.getTimezone).mockResolvedValue(null);

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { timezone: null } });
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
      expect(userService.getTimezone).not.toHaveBeenCalled();
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.getTimezone).mockRejectedValue(new Error("DB error"));

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toHaveProperty("error");
    });
  });

  describe("edge cases", () => {
    it("passes the authenticated userId to getTimezone", async () => {
      vi.mocked(userService.getTimezone).mockResolvedValue("UTC");

      await GET(makeGetRequest());

      expect(userService.getTimezone).toHaveBeenCalledWith("user-1");
    });

    it("response body matches { data: { timezone } } shape exactly", async () => {
      vi.mocked(userService.getTimezone).mockResolvedValue("Europe/Berlin");

      const res = await GET(makeGetRequest());
      const body = await res.json();

      expect(Object.keys(body)).toEqual(["data"]);
      expect(Object.keys(body.data)).toEqual(["timezone"]);
      expect(body.data.timezone).toBe("Europe/Berlin");
    });
  });
});

describe("PATCH /api/user/timezone", () => {
  describe("good cases", () => {
    it("returns 200 with updated timezone for valid IANA input", async () => {
      vi.mocked(userService.updateTimezone).mockResolvedValue("Europe/Berlin");

      const res = await PATCH(makePatchRequest({ timezone: "Europe/Berlin" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ data: { timezone: "Europe/Berlin" } });
      expect(userService.updateTimezone).toHaveBeenCalledWith("user-1", "Europe/Berlin");
    });

    it("accepts UTC as a valid timezone", async () => {
      vi.mocked(userService.updateTimezone).mockResolvedValue("UTC");

      const res = await PATCH(makePatchRequest({ timezone: "UTC" }));

      expect(res.status).toBe(200);
    });

    it("accepts any curated timezone", async () => {
      vi.mocked(userService.updateTimezone).mockResolvedValue("America/New_York");

      const res = await PATCH(makePatchRequest({ timezone: "America/New_York" }));

      expect(res.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await PATCH(makePatchRequest({ timezone: "UTC" }));

      expect(res.status).toBe(401);
      expect(userService.updateTimezone).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid IANA string 'Foo/Bar'", async () => {
      const res = await PATCH(makePatchRequest({ timezone: "Foo/Bar" }));

      expect(res.status).toBe(400);
    });

    it("returns 400 for empty string", async () => {
      const res = await PATCH(makePatchRequest({ timezone: "" }));

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing timezone field", async () => {
      const res = await PATCH(makePatchRequest({}));

      expect(res.status).toBe(400);
    });

    it("returns 500 when service throws", async () => {
      vi.mocked(userService.updateTimezone).mockRejectedValue(new Error("DB error"));

      const res = await PATCH(makePatchRequest({ timezone: "UTC" }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toHaveProperty("error");
    });
  });

  describe("edge cases", () => {
    it("does not call updateTimezone when timezone is invalid", async () => {
      await PATCH(makePatchRequest({ timezone: "Not/Valid" }));

      expect(userService.updateTimezone).not.toHaveBeenCalled();
    });

    it("does not call updateTimezone when body is empty object", async () => {
      await PATCH(makePatchRequest({}));

      expect(userService.updateTimezone).not.toHaveBeenCalled();
    });

    it("response body matches { data: { timezone } } shape exactly", async () => {
      vi.mocked(userService.updateTimezone).mockResolvedValue("Asia/Tokyo");

      const res = await PATCH(makePatchRequest({ timezone: "Asia/Tokyo" }));
      const body = await res.json();

      expect(Object.keys(body)).toEqual(["data"]);
      expect(Object.keys(body.data)).toEqual(["timezone"]);
      expect(body.data.timezone).toBe("Asia/Tokyo");
    });
  });
});
