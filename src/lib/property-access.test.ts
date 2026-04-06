// Traceability: property-settings (issue #104)
// AC-8  -> it('returns property when includeProperty is true and access succeeds')
// AC-8  -> it('property field is null when includeProperty is false')
// AC-8  -> it('property field is null on error response')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { withPropertyAccess } from "./property-access";
import { createProperty } from "@/test/fixtures/property";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-service-instance", () => ({
  propertyService: {
    validateAccess: vi.fn(),
    getPropertyByIdUnchecked: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { propertyService } = await import("@/lib/property-service-instance");

const propertyId = "prop-123";
const userId = "user-456";

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({
    session: { user: { id: userId } } as Parameters<typeof getSession>[0] extends undefined ? never : Awaited<ReturnType<typeof getSession>>["session"],
    errorResponse: null,
  });
  vi.mocked(propertyService.validateAccess).mockResolvedValue("owner");
  vi.mocked(propertyService.getPropertyByIdUnchecked).mockResolvedValue(null);
});

describe("withPropertyAccess", () => {
  describe("includeProperty: false (default behaviour)", () => {
    describe("good cases", () => {
      it("returns userId and role without property when includeProperty not set", async () => {
        const result = await withPropertyAccess(propertyId);

        expect(result.errorResponse).toBeNull();
        if (!result.errorResponse) {
          expect(result.userId).toBe(userId);
          expect(result.role).toBe("owner");
          expect(result.property).toBeNull();
        }
      });

      it("does not call getPropertyByIdUnchecked when includeProperty is not set", async () => {
        await withPropertyAccess(propertyId);

        expect(propertyService.getPropertyByIdUnchecked).not.toHaveBeenCalled();
      });
    });

    describe("bad cases", () => {
      it("returns errorResponse and null property when session is missing (default mode)", async () => {
        vi.mocked(getSession).mockResolvedValueOnce({
          session: null,
          errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        });

        const result = await withPropertyAccess(propertyId);

        expect(result.errorResponse).not.toBeNull();
        expect(result.errorResponse?.status).toBe(401);
        expect(result.userId).toBeNull();
        expect(result.property).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("property is null when includeProperty is explicitly false", async () => {
        const result = await withPropertyAccess(propertyId, { includeProperty: false });

        expect(result.errorResponse).toBeNull();
        if (!result.errorResponse) {
          expect(result.property).toBeNull();
          expect(result.userId).toBe(userId);
        }
        expect(propertyService.getPropertyByIdUnchecked).not.toHaveBeenCalled();
      });
    });
  });

  describe("includeProperty: true", () => {
    describe("good cases", () => {
      it("returns property record when includeProperty is true and access succeeds", async () => {
        const property = createProperty({ id: propertyId, staffOnlyFinance: false });
        vi.mocked(propertyService.getPropertyByIdUnchecked).mockResolvedValue(property);

        const result = await withPropertyAccess(propertyId, { includeProperty: true });

        expect(result.errorResponse).toBeNull();
        if (!result.errorResponse) {
          expect(result.property).not.toBeNull();
          expect(result.property?.id).toBe(propertyId);
          expect(result.property?.staffOnlyFinance).toBe(false);
        }
      });

      it("returns property with staffOnlyFinance: true when flag is set", async () => {
        const property = createProperty({ id: propertyId, staffOnlyFinance: true });
        vi.mocked(propertyService.getPropertyByIdUnchecked).mockResolvedValue(property);

        const result = await withPropertyAccess(propertyId, { includeProperty: true });

        expect(result.errorResponse).toBeNull();
        if (!result.errorResponse) {
          expect(result.property?.staffOnlyFinance).toBe(true);
        }
      });

      it("calls getPropertyByIdUnchecked with the propertyId", async () => {
        const property = createProperty({ id: propertyId });
        vi.mocked(propertyService.getPropertyByIdUnchecked).mockResolvedValue(property);

        await withPropertyAccess(propertyId, { includeProperty: true });

        expect(propertyService.getPropertyByIdUnchecked).toHaveBeenCalledWith(propertyId);
      });
    });

    describe("bad cases", () => {
      it("returns error response and null property when session is missing", async () => {
        vi.mocked(getSession).mockResolvedValueOnce({
          session: null,
          errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        });

        const result = await withPropertyAccess(propertyId, { includeProperty: true });

        expect(result.errorResponse).not.toBeNull();
        expect(result.errorResponse?.status).toBe(401);
        expect(result.userId).toBeNull();
        expect(result.property).toBeNull();
      });

      it("returns error response and null property when user has no access", async () => {
        const { ForbiddenError } = await import("@/lib/property-service");
        vi.mocked(propertyService.validateAccess).mockRejectedValueOnce(
          new ForbiddenError("No access")
        );

        const result = await withPropertyAccess(propertyId, { includeProperty: true });

        expect(result.errorResponse).not.toBeNull();
        expect(result.errorResponse?.status).toBe(403);
        expect(result.property).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("returns property: null when getPropertyByIdUnchecked returns null", async () => {
        vi.mocked(propertyService.getPropertyByIdUnchecked).mockResolvedValue(null);

        const result = await withPropertyAccess(propertyId, { includeProperty: true });

        expect(result.errorResponse).toBeNull();
        if (!result.errorResponse) {
          expect(result.property).toBeNull();
          expect(result.userId).toBe(userId);
          expect(result.role).toBe("owner");
        }
      });
    });
  });

  describe("requireOwner option (unchanged behaviour)", () => {
    it("returns error response for staff when requireOwner is true", async () => {
      vi.mocked(propertyService.validateAccess).mockResolvedValueOnce("staff");

      const result = await withPropertyAccess(propertyId, { requireOwner: true });

      expect(result.errorResponse).not.toBeNull();
      expect(result.errorResponse?.status).toBe(403);
    });
  });
});
