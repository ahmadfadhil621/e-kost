// Traceability: tenant-room-basics
// REQ 3.2 -> it('GET returns 200 and tenant when found')
// REQ 4.2, 4.4 -> it('PUT returns 200 and updated tenant when body is valid')
// REQ 4.5 -> it('PUT returns 400 when email is invalid')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { createTenant } from "@/test/fixtures/tenant";

const mockSession = {
  user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
};

const propertyId = "prop-123";
const tenantId = "tenant-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: {
    getTenant: vi.fn(),
    updateTenant: vi.fn(),
  },
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

describe("GET /api/properties/[propertyId]/tenants/[tenantId]", () => {
  describe("good cases", () => {
    it("GET returns 200 and tenant when found", async () => {
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        name: "Jane Doe",
      });
      vi.mocked(tenantService.getTenant).mockResolvedValue(tenant);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(tenantId);
      expect(data.name).toBe("Jane Doe");
    });
  });

  describe("bad cases", () => {
    it("GET returns 404 when tenant not found", async () => {
      vi.mocked(tenantService.getTenant).mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 with all tenant fields when found", async () => {
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        name: "Full Tenant",
        phone: "08123456789",
        email: "full@test.com",
        roomId: "room-1",
        assignedAt: new Date(),
      });
      vi.mocked(tenantService.getTenant).mockResolvedValue(tenant);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Full Tenant");
      expect(data.phone).toBe("08123456789");
      expect(data.email).toBe("full@test.com");
      expect(data.roomId).toBe("room-1");
    });
  });
});

describe("PUT /api/properties/[propertyId]/tenants/[tenantId]", () => {
  describe("good cases", () => {
    it("PUT returns 200 and updated tenant when body is valid", async () => {
      const updated = createTenant({
        propertyId,
        id: tenantId,
        name: "Jane Updated",
        phone: "08999999999",
      });
      vi.mocked(tenantService.updateTenant).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Updated",
            phone: "08999999999",
          }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Jane Updated");
      expect(data.phone).toBe("08999999999");
    });
  });

  describe("bad cases", () => {
    it("PUT returns 400 when email is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "invalid" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(400);
    });

    it("PUT returns 404 when tenant not found", async () => {
      vi.mocked(tenantService.updateTenant).mockRejectedValue(
        new Error("Tenant not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Name" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("edge cases", () => {
    it("PUT returns 200 when updating only email", async () => {
      const updated = createTenant({
        propertyId,
        id: tenantId,
        email: "newemail@test.com",
      });
      vi.mocked(tenantService.updateTenant).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants/${tenantId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "newemail@test.com" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, tenantId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe("newemail@test.com");
    });
  });
});
