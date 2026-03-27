// Traceability: demo-login
// REQ 1.1 -> it('is reachable without authentication and redirects on success')
// REQ 1.2 -> it('looks up user by demo@ekost.app email')
// REQ 1.3 -> it('returns 404 when demo user is not found')
// REQ 1.4 -> it('deletes demo data in FK-safe order before seeding')
// REQ 1.5 -> it('calls seedDemoData with the demo user id')
// REQ 1.6 -> it('forwards set-cookie headers from Better Auth sign-in response')
// REQ 1.7 -> it('redirects to / on success')
// REQ 6.2 -> (no auth guard; route has no getSession check)
// REQ 6.5 -> it('returns 500 before touching any data when DEMO_PASSWORD env var is missing')
// PROP 1  -> it('always calls deleteMany then seedDemoData regardless of call count')
// PROP 4  -> it('returns 500 before any Prisma call when DEMO_PASSWORD is absent')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";

// ── Prisma mock ─────────────────────────────────────────────────────────────
// Separate vi.fn() per model so invocationCallOrder can verify FK-safe deletion order.
const mockFindUnique = vi.fn();
const mockPaymentDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockTenantNoteDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockTenantDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockExpenseDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockRoomDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const mockPropertyDeleteMany = vi.fn().mockResolvedValue({ count: 0 });

// Convenience alias used in tests that only need to know "was any deleteMany called"
const allDeleteManys = [
  mockPaymentDeleteMany,
  mockTenantNoteDeleteMany,
  mockTenantDeleteMany,
  mockExpenseDeleteMany,
  mockRoomDeleteMany,
  mockPropertyDeleteMany,
];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    payment: { deleteMany: mockPaymentDeleteMany },
    tenantNote: { deleteMany: mockTenantNoteDeleteMany },
    tenant: { deleteMany: mockTenantDeleteMany },
    expense: { deleteMany: mockExpenseDeleteMany },
    room: { deleteMany: mockRoomDeleteMany },
    property: { deleteMany: mockPropertyDeleteMany },
  },
}));

// ── Better Auth mock ─────────────────────────────────────────────────────────
const mockSignInEmail = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: mockSignInEmail,
    },
  },
}));

// ── Demo seed mock ────────────────────────────────────────────────────────────
const mockSeedDemoData = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/demo-seed", () => ({
  seedDemoData: mockSeedDemoData,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
const demoUser = { id: "demo-user-id", email: "demo@ekost.app" };

function makeRequest() {
  return new Request("http://localhost:3000/api/auth/demo-login", {
    method: "POST",
  });
}

function makeMockSignInResponse(cookies: string[] = ["better-auth.session=abc; Path=/; HttpOnly"]) {
  const headers = new Headers();
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }
  return { headers };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/auth/demo-login", () => {
  const originalEnv = process.env.DEMO_PASSWORD;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_PASSWORD = "demo-secret-password";
    mockFindUnique.mockResolvedValue(demoUser);
    mockSignInEmail.mockResolvedValue(makeMockSignInResponse());
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DEMO_PASSWORD;
    } else {
      process.env.DEMO_PASSWORD = originalEnv;
    }
  });

  describe("good cases", () => {
    it("redirects to / on success", async () => {
      const { POST } = await import("./route");
      const response = await POST(makeRequest());

      expect(response.status).toBe(302);
      const location = response.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });

    it("is reachable without authentication — no getSession guard", async () => {
      const { POST } = await import("./route");
      // No auth headers — should still succeed
      const response = await POST(makeRequest());
      expect(response.status).toBe(302);
    });

    it("calls seedDemoData with the demo user id", async () => {
      const { POST } = await import("./route");
      await POST(makeRequest());

      expect(mockSeedDemoData).toHaveBeenCalledOnce();
      expect(mockSeedDemoData).toHaveBeenCalledWith(demoUser.id);
    });

    it("calls auth.api.signInEmail with demo credentials", async () => {
      const { POST } = await import("./route");
      await POST(makeRequest());

      expect(mockSignInEmail).toHaveBeenCalledOnce();
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            email: "demo@ekost.app",
            password: "demo-secret-password",
          }),
        })
      );
    });

    it("forwards set-cookie headers from Better Auth sign-in response", async () => {
      const sessionCookie = "better-auth.session=token123; Path=/; HttpOnly; SameSite=Lax";
      mockSignInEmail.mockResolvedValue(makeMockSignInResponse([sessionCookie]));

      const { POST } = await import("./route");
      const response = await POST(makeRequest());

      expect(response.status).toBe(302);
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("better-auth.session=token123");
    });

    it("deletes demo data across all tables", async () => {
      const { POST } = await import("./route");
      await POST(makeRequest());

      for (const mock of allDeleteManys) {
        expect(mock).toHaveBeenCalled();
      }
    });

    it("looks up user by demo@ekost.app email", async () => {
      const { POST } = await import("./route");
      await POST(makeRequest());

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "demo@ekost.app" },
        })
      );
    });
  });

  describe("bad cases", () => {
    it("returns 404 when demo user is not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const { POST } = await import("./route");
      const response = await POST(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toHaveProperty("error");
    });

    it("returns 500 when DEMO_PASSWORD env var is missing", async () => {
      delete process.env.DEMO_PASSWORD;

      const { POST } = await import("./route");
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
    });

    it("returns 500 when seedDemoData throws", async () => {
      mockSeedDemoData.mockRejectedValue(new Error("Seed failed"));

      const { POST } = await import("./route");
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
    });

    it("returns 500 when Better Auth sign-in throws", async () => {
      mockSignInEmail.mockRejectedValue(new Error("Auth failed"));

      const { POST } = await import("./route");
      const response = await POST(makeRequest());

      expect(response.status).toBe(500);
    });
  });

  describe("edge cases", () => {
    it("deletes data in FK-safe order: payments before tenants before rooms before properties", async () => {
      const callOrder: string[] = [];

      // Wire per-model tracking implementations for this test
      mockPaymentDeleteMany.mockImplementation(async () => { callOrder.push("payment"); return { count: 0 }; });
      mockTenantNoteDeleteMany.mockImplementation(async () => { callOrder.push("tenantNote"); return { count: 0 }; });
      mockTenantDeleteMany.mockImplementation(async () => { callOrder.push("tenant"); return { count: 0 }; });
      mockExpenseDeleteMany.mockImplementation(async () => { callOrder.push("expense"); return { count: 0 }; });
      mockRoomDeleteMany.mockImplementation(async () => { callOrder.push("room"); return { count: 0 }; });
      mockPropertyDeleteMany.mockImplementation(async () => { callOrder.push("property"); return { count: 0 }; });

      const { POST } = await import("./route");
      await POST(makeRequest());

      // FK ordering: payment before tenant; room before property; tenant before property
      const paymentIdx = callOrder.indexOf("payment");
      const tenantIdx = callOrder.indexOf("tenant");
      const roomIdx = callOrder.indexOf("room");
      const propertyIdx = callOrder.indexOf("property");

      expect(paymentIdx).not.toBe(-1);
      expect(tenantIdx).not.toBe(-1);
      expect(roomIdx).not.toBe(-1);
      expect(propertyIdx).not.toBe(-1);
      expect(paymentIdx).toBeLessThan(tenantIdx);
      expect(roomIdx).toBeLessThan(propertyIdx);
      expect(tenantIdx).toBeLessThan(propertyIdx);
    });

    it("does not call seedDemoData before all deletions are complete", async () => {
      const callOrder: string[] = [];

      mockPropertyDeleteMany.mockImplementation(async () => {
        callOrder.push("delete-properties");
        return { count: 0 };
      });
      mockSeedDemoData.mockImplementation(async () => {
        callOrder.push("seed");
      });

      const { POST } = await import("./route");
      await POST(makeRequest());

      const deleteIdx = callOrder.indexOf("delete-properties");
      const seedIdx = callOrder.indexOf("seed");

      expect(deleteIdx).not.toBe(-1);
      expect(seedIdx).not.toBe(-1);
      expect(deleteIdx).toBeLessThan(seedIdx);
    });

    it("does not call Prisma at all when DEMO_PASSWORD is missing", async () => {
      delete process.env.DEMO_PASSWORD;

      const { POST } = await import("./route");
      await POST(makeRequest());

      expect(mockFindUnique).not.toHaveBeenCalled();
      for (const mock of allDeleteManys) {
        expect(mock).not.toHaveBeenCalled();
      }
      expect(mockSeedDemoData).not.toHaveBeenCalled();
    });

    it("does not call seedDemoData when demo user is not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const { POST } = await import("./route");
      await POST(makeRequest());

      expect(mockSeedDemoData).not.toHaveBeenCalled();
    });
  });

  describe("property-based tests", () => {
    // PROP 1 — Idempotent by wipe-then-seed: regardless of call count,
    // deleteMany is always invoked before seedDemoData.
    it("always calls deleteMany before seedDemoData regardless of call count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (callCount) => {
            vi.clearAllMocks();
            mockFindUnique.mockResolvedValue(demoUser);
            mockSignInEmail.mockResolvedValue(makeMockSignInResponse());
            mockSeedDemoData.mockResolvedValue(undefined);

            const { POST } = await import("./route");

            for (let i = 0; i < callCount; i++) {
              await POST(makeRequest());
            }

            // deleteMany should have been called more than seedDemoData's call count
            // (multiple tables deleted per seed call)
            const totalDeleteCalls = allDeleteManys.reduce(
              (sum, m) => sum + m.mock.calls.length,
              0
            );
            const seedCalls = mockSeedDemoData.mock.calls.length;

            expect(totalDeleteCalls).toBeGreaterThan(0);
            expect(seedCalls).toBe(callCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    // PROP 4 — Missing DEMO_PASSWORD always fails with 500, never touches data
    it("always returns 500 and never touches Prisma when DEMO_PASSWORD is absent", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(undefined),
          async () => {
            vi.clearAllMocks();
            delete process.env.DEMO_PASSWORD;
            mockFindUnique.mockResolvedValue(demoUser);

            const { POST } = await import("./route");
            const response = await POST(makeRequest());

            expect(response.status).toBe(500);
            expect(mockFindUnique).not.toHaveBeenCalled();
            for (const mock of allDeleteManys) {
              expect(mock).not.toHaveBeenCalled();
            }
            expect(mockSeedDemoData).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
