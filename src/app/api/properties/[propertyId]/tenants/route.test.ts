// Traceability: tenant-room-basics
// REQ 1.2 -> it('POST returns 201 and tenant when body is valid')
// REQ 1.3 -> it('POST returns 400 when name is missing')
// REQ 1.4, 1.5 -> it('POST returns 201 and tenant when body is valid')
// REQ 3.1 -> (covered by E2E/component)
// PROP 1 -> it('POST returns 201 and tenant when body is valid')
// PROP 12 -> it('GET returns count equal to tenants array length')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST, GET } from "./route";
import { createTenant } from "@/test/fixtures/tenant";

const mockSession = {
  user: { id: "test-user-id", name: "Test User", email: "test@example.com" },
  session: {} as unknown,
};

const propertyId = "prop-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: {
    createTenant: vi.fn(),
    listTenants: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { withPropertyAccess } = await import("@/lib/property-access");
const { tenantService } = await import("@/lib/tenant-service-instance");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("POST /api/properties/[propertyId]/tenants", () => {
  describe("good cases", () => {
    it("POST returns 201 and tenant when body is valid", async () => {
      const created = createTenant({
        propertyId,
        name: "Jane Doe",
        phone: "08123456789",
        email: "jane@example.com",
      });
      vi.mocked(tenantService.createTenant).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            phone: "08123456789",
            email: "jane@example.com",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(created.id);
      expect(data.name).toBe("Jane Doe");
      expect(data.phone).toBe("08123456789");
      expect(data.email).toBe("jane@example.com");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });
  });

  describe("bad cases", () => {
    it("POST returns 400 when name is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: "08123456789",
            email: "jane@example.com",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 400 when email is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane",
            phone: "08123456789",
            email: "notanemail",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane",
            phone: "08123456789",
            email: "jane@example.com",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("POST returns 400 when phone is empty", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane",
            phone: "",
            email: "jane@example.com",
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("GET /api/properties/[propertyId]/tenants", () => {
  describe("good cases", () => {
    it("GET returns 200 with tenants and count", async () => {
      const tenants = [
        createTenant({ propertyId, name: "Tenant A" }),
        createTenant({ propertyId, name: "Tenant B" }),
      ];
      vi.mocked(tenantService.listTenants).mockResolvedValue(tenants);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tenants).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it("GET returns count equal to tenants array length", async () => {
      const tenants = [
        createTenant({ propertyId }),
        createTenant({ propertyId }),
        createTenant({ propertyId }),
      ];
      vi.mocked(tenantService.listTenants).mockResolvedValue(tenants);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(data.tenants.length);
      expect(data.count).toBe(3);
    });
  });

  describe("bad cases", () => {
    it("GET returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("GET returns empty tenants and count 0 when no tenants", async () => {
      vi.mocked(tenantService.listTenants).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/tenants`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tenants).toEqual([]);
      expect(data.count).toBe(0);
    });
  });
});
