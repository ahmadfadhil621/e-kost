// Traceability: settings-invite-management
// REQ 2.1 -> it('returns 403 when creating owner invite as non-dev when DEV_EMAILS is set')
// REQ 2.2 -> it('returns 201 when creating owner invite when DEV_EMAILS is not set')
// REQ 2.3 -> it('returns 201 when creating staff invite regardless of dev status')
// REQ 2.4 -> it('returns 201 when creating owner invite as dev user')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

const mockSession = {
  user: { id: "test-user-id", name: "Dev User", email: "dev@example.com" },
  session: {} as unknown,
};

const mockNonDevSession = {
  user: { id: "other-user-id", name: "Other User", email: "other@example.com" },
  session: {} as unknown,
};

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/invite-service-instance", () => ({
  inviteService: {
    createInvite: vi.fn().mockResolvedValue({
      id: "invite-1",
      token: "token-abc",
      email: "user@example.com",
      role: "owner",
      propertyId: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usedAt: null,
      createdBy: "test-user-id",
      createdAt: new Date(),
    }),
    listInvites: vi.fn().mockResolvedValue([]),
  },
}));

const { getSession } = await import("@/lib/auth-api");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  process.env.DEV_EMAILS = "dev@example.com";
});

afterEach(() => {
  delete process.env.DEV_EMAILS;
  vi.resetModules();
});

describe("POST /api/invites", () => {
  describe("good cases", () => {
    it("returns 201 when creating owner invite as dev user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newowner@example.com", role: "owner", expiresInDays: 7 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("returns 201 when creating owner invite when DEV_EMAILS is not set", async () => {
      delete process.env.DEV_EMAILS;
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "anyone@example.com", role: "owner", expiresInDays: 7 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("returns 201 when creating staff invite as non-dev", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "staff@example.com", role: "staff", expiresInDays: 7 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe("bad cases", () => {
    it("returns 403 when creating owner invite as non-dev when DEV_EMAILS is set", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockNonDevSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newowner@example.com", role: "owner", expiresInDays: 7 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", role: "staff", expiresInDays: 7 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("returns 400 when body is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", role: "owner" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("edge cases", () => {
    it("returns 201 when creating staff invite as dev user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockSession });
      const { POST } = await import("./route");

      const request = new Request("http://localhost/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "staff@example.com", role: "staff", expiresInDays: 1 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });
});

describe("GET /api/invites", () => {
  describe("good cases", () => {
    it("returns 200 and list of invites", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockSession });
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/invites");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/invites");
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns empty array when no invites exist", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({ session: mockSession });
      const { GET } = await import("./route");

      const request = new Request("http://localhost/api/invites");
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });
});
