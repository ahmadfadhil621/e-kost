// Traceability: property-archive-delete (issue #27)
// AC-1  -> it('POST returns 200 and archived property when owner archives with no active tenants')
// AC-5  -> it('POST returns 409 when property is already archived')
// AC-4  -> it('POST returns 409 when property has active tenants')
// AC-6  -> it('POST returns 403 when staff tries to archive')
// AC-1  -> it('POST returns 404 when property not found')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { createProperty } from "@/test/fixtures/property";

const propertyId = "prop-123";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/property-service-instance", () => ({
  propertyService: {
    archiveProperty: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { propertyService } = await import("@/lib/property-service-instance");

function makeRequest(): Request {
  return new Request(`http://localhost/api/properties/${propertyId}/archive`, {
    method: "POST",
  });
}

const context = { params: Promise.resolve({ propertyId }) };

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "owner-id",
    role: "owner",
    errorResponse: null,
  });
  vi.clearAllMocks();
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "owner-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("POST /api/properties/[propertyId]/archive", () => {
  describe("good cases", () => {
    it("returns 200 and archived property when owner archives with no active tenants", async () => {
      const archived = createProperty({
        id: propertyId,
        archivedAt: new Date("2025-03-01"),
      });
      vi.mocked(propertyService.archiveProperty).mockResolvedValue(archived);

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body.id).toBe(propertyId);
      expect(body.archivedAt).toBeDefined();
      expect(propertyService.archiveProperty).toHaveBeenCalledWith("owner-id", propertyId);
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

      const res = await POST(makeRequest(), context);

      expect(res.status).toBe(403);
    });

    it("returns 404 when property not found", async () => {
      vi.mocked(propertyService.archiveProperty).mockRejectedValue(
        new Error("Property not found")
      );

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });

    it("returns 409 when property is already archived", async () => {
      vi.mocked(propertyService.archiveProperty).mockRejectedValue(
        new Error("Property is already archived")
      );

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(409);
      expect(body.error).toMatch(/already archived/i);
    });

    it("returns 409 when property has active tenants", async () => {
      vi.mocked(propertyService.archiveProperty).mockRejectedValue(
        new Error("Cannot archive property with active tenants")
      );

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(409);
      expect(body.error).toMatch(/active tenants/i);
    });

    it("returns 403 when service throws ForbiddenError", async () => {
      const err = new Error("Owner access required");
      err.name = "ForbiddenError";
      vi.mocked(propertyService.archiveProperty).mockRejectedValue(err);

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(403);
      expect(body.error).toMatch(/forbidden/i);
    });
  });

  describe("edge cases", () => {
    it("returns 500 on unexpected error", async () => {
      vi.mocked(propertyService.archiveProperty).mockRejectedValue(
        new Error("Database connection lost")
      );

      const res = await POST(makeRequest(), context);
      const body = await res.json() as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });
});
