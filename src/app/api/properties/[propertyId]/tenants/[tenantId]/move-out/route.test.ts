// Traceability: tenant-room-basics
// REQ 5.3, 5.4, 5.5 -> it('POST returns 200 and tenant with movedOutAt when move-out succeeds')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
import { createTenant } from "@/test/fixtures/tenant";

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: { moveOut: vi.fn() },
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

describe("POST /api/properties/[propertyId]/tenants/[tenantId]/move-out", () => {
  describe("good cases", () => {
    it("POST returns 200 and tenant with movedOutAt when move-out succeeds", async () => {
      const movedOut = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: new Date(),
        roomId: null,
      });
      vi.mocked(tenantService.moveOut).mockResolvedValue(movedOut);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move-out`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.movedOutAt).toBeDefined();
      expect(tenantService.moveOut).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        tenantId
      );
    });
  });

  describe("bad cases", () => {
    it("POST returns 404 when tenant not found", async () => {
      vi.mocked(tenantService.moveOut).mockRejectedValue(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move-out`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("edge cases", () => {
    it("POST returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}/move-out`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
