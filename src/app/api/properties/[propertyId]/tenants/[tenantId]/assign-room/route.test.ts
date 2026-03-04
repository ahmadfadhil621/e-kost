// Traceability: tenant-room-basics
// REQ 2.3, 2.4 -> it('POST returns 200 and tenant with roomId when room is available')
// REQ 2.5 -> it('POST returns 409 when room is already occupied')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { createTenant } from "@/test/fixtures/tenant";

const propertyId = "prop-123";
const tenantId = "tenant-456";
const roomIdUuid = "11111111-1111-4111-a111-111111111111";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: { assignRoom: vi.fn() },
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

describe("POST /api/properties/[propertyId]/tenants/[tenantId]/assign-room", () => {
  describe("good cases", () => {
    it("POST returns 200 and tenant with roomId when room is available", async () => {
      const assigned = createTenant({
        propertyId,
        id: tenantId,
        roomId: roomIdUuid,
        assignedAt: new Date(),
      });
      vi.mocked(tenantService.assignRoom).mockResolvedValue(assigned);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: roomIdUuid }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roomId).toBe(roomIdUuid);
      expect(tenantService.assignRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId,
        roomIdUuid
      );
    });
  });

  describe("bad cases", () => {
    it("POST returns 409 when room is already occupied", async () => {
      vi.mocked(tenantService.assignRoom).mockRejectedValue(
        new Error("Room is already occupied by another tenant")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: roomIdUuid }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/already occupied|already assigned/i);
    });

    it("POST returns 400 when roomId is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 404 when tenant not found", async () => {
      vi.mocked(tenantService.assignRoom).mockRejectedValue(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: roomIdUuid }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("edge cases", () => {
    it("POST returns 400 when roomId is invalid UUID", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/assign-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: "not-a-uuid" }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });
  });
});
