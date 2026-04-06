// Traceability: property-settings (issue #104)
// AC-6  -> it('PATCH returns 200 and staffOnlyFinance when toggled to true')
// AC-6  -> it('PATCH returns 200 and staffOnlyFinance when toggled to false')
// AC-12 -> it('PATCH returns 403 when user is staff')
// AC-6  -> it('PATCH returns 400 when body is invalid')
// PROP-4 -> it('owner can toggle staffOnlyFinance regardless of current value')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import fc from "fast-check";
import { PATCH } from "./route";
import { createProperty } from "@/test/fixtures/property";

const propertyId = "prop-123";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/property-service-instance", () => ({
  propertyService: {
    updatePropertySettings: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { propertyService } = await import("@/lib/property-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-owner-id",
    role: "owner",
    property: null,
    errorResponse: null,
  });
});

describe("PATCH /api/properties/[propertyId]/settings", () => {
  describe("good cases", () => {
    it("returns 200 with staffOnlyFinance: true when toggled on", async () => {
      const updated = createProperty({ id: propertyId, staffOnlyFinance: true });
      vi.mocked(propertyService.updatePropertySettings).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: true }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.staffOnlyFinance).toBe(true);
    });

    it("returns 200 with staffOnlyFinance: false when toggled off", async () => {
      const updated = createProperty({ id: propertyId, staffOnlyFinance: false });
      vi.mocked(propertyService.updatePropertySettings).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: false }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.staffOnlyFinance).toBe(false);
    });

    it("calls updatePropertySettings with correct arguments", async () => {
      const updated = createProperty({ id: propertyId, staffOnlyFinance: true });
      vi.mocked(propertyService.updatePropertySettings).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: true }),
        }
      );

      await PATCH(request, { params: Promise.resolve({ propertyId }) });

      expect(propertyService.updatePropertySettings).toHaveBeenCalledWith(
        "test-owner-id",
        propertyId,
        { staffOnlyFinance: true }
      );
    });
  });

  describe("bad cases", () => {
    it("returns 403 when withPropertyAccess returns an error response (staff user)", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: true }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 400 when staffOnlyFinance is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 400 when staffOnlyFinance is not a boolean", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: "yes" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffOnlyFinance: true }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns 400 when body is empty (no JSON)", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(null),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("PATCH /api/properties/[propertyId]/settings — property-based", () => {
  // Feature: property-settings, PROP-4: owner can always toggle settings regardless of current value
  it("owner can set staffOnlyFinance to any boolean value (PROP-4)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (value) => {
        const updated = createProperty({ id: propertyId, staffOnlyFinance: value });
        vi.mocked(propertyService.updatePropertySettings).mockResolvedValue(updated);

        const request = new Request(
          `http://localhost:3000/api/properties/${propertyId}/settings`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffOnlyFinance: value }),
          }
        );

        const response = await PATCH(request, {
          params: Promise.resolve({ propertyId }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.staffOnlyFinance).toBe(value);
      }),
      { numRuns: 100 }
    );
  });
});
