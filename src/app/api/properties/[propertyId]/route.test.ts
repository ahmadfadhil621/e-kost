// Traceability: property-archive-delete (issue #27) — DELETE hard delete
// AC-7  -> it('DELETE returns 204 when owner deletes property with no active tenants')
// AC-10 -> it('DELETE returns 409 when property has active tenants')
// AC-11 -> it('DELETE returns 403 when access check fails')
// AC-7  -> it('DELETE returns 404 when property not found')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";

const propertyId = "prop-789";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/property-service-instance", () => ({
  propertyService: {
    getProperty: vi.fn(),
    listProperties: vi.fn(),
    updateProperty: vi.fn(),
    deleteProperty: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { propertyService } = await import("@/lib/property-service-instance");

function makeRequest(): Request {
  return new Request(`http://localhost/api/properties/${propertyId}`, {
    method: "DELETE",
  });
}

const context = { params: Promise.resolve({ propertyId }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "owner-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("DELETE /api/properties/[propertyId]", () => {
  describe("good cases", () => {
    it("returns 204 when owner deletes property with no active tenants", async () => {
      vi.mocked(propertyService.deleteProperty).mockResolvedValue(undefined);

      const res = await DELETE(makeRequest(), context);

      expect(res.status).toBe(204);
      expect(propertyService.deleteProperty).toHaveBeenCalledWith("owner-id", propertyId);
    });
  });

  describe("bad cases", () => {
    it("returns 403 when access check fails", async () => {
      const forbidden = new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        errorResponse: forbidden,
      });

      const res = await DELETE(makeRequest(), context);

      expect(res.status).toBe(403);
    });

    it("returns 404 when property not found", async () => {
      vi.mocked(propertyService.deleteProperty).mockRejectedValue(
        new Error("Property not found")
      );

      const res = await DELETE(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });

    it("returns 409 when property has active tenants", async () => {
      vi.mocked(propertyService.deleteProperty).mockRejectedValue(
        new Error("Cannot delete property with active tenants")
      );

      const res = await DELETE(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(409);
      expect(body.error).toMatch(/active tenants/i);
    });

    it("returns 403 when service throws ForbiddenError", async () => {
      const err = new Error("Owner access required");
      err.name = "ForbiddenError";
      vi.mocked(propertyService.deleteProperty).mockRejectedValue(err);

      const res = await DELETE(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/forbidden/i);
    });
  });

  describe("edge cases", () => {
    it("returns 500 on unexpected error", async () => {
      vi.mocked(propertyService.deleteProperty).mockRejectedValue(
        new Error("Unexpected DB error")
      );

      const res = await DELETE(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });
});
