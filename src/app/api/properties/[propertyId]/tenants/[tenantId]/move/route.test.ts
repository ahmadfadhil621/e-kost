// Traceability: tenant-room-move
// REQ 1.1 -> it('POST 200 initial assign: tenant with no room gets assigned')
// REQ 1.2 -> it('POST 200 move: tenant with existing room is moved to new room')
// REQ 2.7 -> it('POST 400 when targetRoomId is the same as current room')
// REQ 3.3 -> it('POST 409 when room is at capacity')
// REQ 1.1 -> it('POST 400 when targetRoomId is missing')
// REQ 1.1 -> it('POST 400 when moveDate format is invalid')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { createTenant } from "@/test/fixtures/tenant";

const propertyId = "prop-123";
const tenantId = "tenant-456";
const targetRoomId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: { moveTenantToRoom: vi.fn() },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { tenantService } = await import("@/lib/tenant-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("POST /api/properties/[propertyId]/tenants/[tenantId]/move", () => {
  describe("good cases", () => {
    it("POST 200: initial assign — tenant with no room gets assigned and returns updated tenant", async () => {
      const assigned = createTenant({
        propertyId,
        id: tenantId,
        roomId: targetRoomId,
        movedInAt: new Date("2026-03-15"),
      });
      vi.mocked(tenantService.moveTenantToRoom).mockResolvedValue(assigned);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.roomId).toBe(targetRoomId);
      expect(tenantService.moveTenantToRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId,
        { targetRoomId, moveDate: "2026-03-15", billingDayOfMonth: undefined }
      );
    });

    it("POST 200: move — tenant with existing room is moved to new room", async () => {
      const moved = createTenant({
        propertyId,
        id: tenantId,
        roomId: targetRoomId,
        movedInAt: new Date("2026-03-15"),
      });
      vi.mocked(tenantService.moveTenantToRoom).mockResolvedValue(moved);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.roomId).toBe(targetRoomId);
    });

    it("POST 200: passes billingDayOfMonth when provided", async () => {
      const assigned = createTenant({
        propertyId,
        id: tenantId,
        roomId: targetRoomId,
        billingDayOfMonth: 15,
      });
      vi.mocked(tenantService.moveTenantToRoom).mockResolvedValue(assigned);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15", billingDayOfMonth: 15 }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.billingDayOfMonth).toBe(15);
      expect(tenantService.moveTenantToRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId,
        expect.objectContaining({ billingDayOfMonth: 15 })
      );
    });
  });

  describe("bad cases", () => {
    it("POST 400 when targetRoomId is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("POST 400 when moveDate is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("POST 400 when moveDate format is invalid (not YYYY-MM-DD)", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "15-03-2026" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/YYYY-MM-DD/i);
    });

    it("POST 400 when targetRoomId is not a valid UUID", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId: "not-a-uuid", moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST 400 when same-room error thrown by service", async () => {
      vi.mocked(tenantService.moveTenantToRoom).mockRejectedValue(
        new Error("Cannot move to same room")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/same room/i);
    });

    it("POST 403 when user has no property access", async () => {
      const { NextResponse } = await import("next/server");
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(403);
    });

    it("POST 404 when tenant not found", async () => {
      vi.mocked(tenantService.moveTenantToRoom).mockRejectedValue(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });

    it("POST 404 when room not found", async () => {
      vi.mocked(tenantService.moveTenantToRoom).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });

    it("POST 409 when room is at capacity", async () => {
      vi.mocked(tenantService.moveTenantToRoom).mockRejectedValue(
        new Error("Room is at capacity")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toMatch(/at capacity/i);
    });
  });

  describe("edge cases", () => {
    it("POST 400 when billingDayOfMonth is out of range (0)", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15", billingDayOfMonth: 0 }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST 400 when billingDayOfMonth is out of range (32)", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15", billingDayOfMonth: 32 }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST 400 when tenant is inactive", async () => {
      vi.mocked(tenantService.moveTenantToRoom).mockRejectedValue(
        new Error("Tenant is inactive")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRoomId, moveDate: "2026-03-15" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/inactive/i);
    });
  });
});
