// Traceability: tenant-room-move
// REQ 1.3 -> it('GET 200 returns assignment history ordered newest first')
// REQ 1.3 -> it('GET 200 returns empty array when no assignments')
// REQ 1.3 -> it('GET 403 when user has no property access')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { createRoomAssignment } from "@/test/fixtures/room-assignment";

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: { getRoomAssignments: vi.fn() },
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

describe("GET /api/properties/[propertyId]/tenants/[tenantId]/room-assignments", () => {
  describe("good cases", () => {
    it("GET 200 returns assignment history ordered newest first with roomNumber", async () => {
      const assignments = [
        createRoomAssignment({
          tenantId,
          roomId: "room-2",
          startDate: new Date("2026-03-15"),
          endDate: null,
          roomNumber: "102",
        }),
        createRoomAssignment({
          tenantId,
          roomId: "room-1",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2026-03-15"),
          roomNumber: "101",
        }),
      ];
      vi.mocked(tenantService.getRoomAssignments).mockResolvedValue(assignments);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].roomNumber).toBe("102");
      expect(body.data[0].endDate).toBeNull();
      expect(body.data[1].roomNumber).toBe("101");
      expect(body.data[1].endDate).toBeDefined();
      expect(tenantService.getRoomAssignments).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId
      );
    });

    it("GET 200 returns empty array when tenant has no room assignment history", async () => {
      vi.mocked(tenantService.getRoomAssignments).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("GET 403 when user has no property access", async () => {
      const { NextResponse } = await import("next/server");
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(403);
    });

    it("GET 404 when tenant not found", async () => {
      vi.mocked(tenantService.getRoomAssignments).mockRejectedValue(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });
  });

  describe("edge cases", () => {
    it("GET 200 serializes Date fields as ISO strings in response", async () => {
      const assignment = createRoomAssignment({
        tenantId,
        startDate: new Date("2026-01-15T00:00:00.000Z"),
        endDate: new Date("2026-03-15T00:00:00.000Z"),
        roomNumber: "101",
      });
      vi.mocked(tenantService.getRoomAssignments).mockResolvedValue([assignment]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/room-assignments`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      // Dates should be serialized as strings in JSON
      expect(typeof body.data[0].startDate).toBe("string");
      expect(typeof body.data[0].endDate).toBe("string");
    });
  });
});
