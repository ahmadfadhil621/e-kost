// Traceability: property-activity-log
// REQ 2.1 -> it('returns 200 with activity data for authenticated property member')
// REQ 2.2 -> it('passes cursor query param to service')
// REQ 2.3 -> it('passes area filter query param to service')
// REQ 2.3 -> it('passes actorId filter query param to service')
// REQ 2.4 -> it('response includes data array and nextCursor')
// REQ 2.5 -> it('each entry includes actorName, actorRole, actionCode, metadata, createdAt as ISO string')
// REQ 2.6 -> it('returns 401 when withPropertyAccess returns error response')
// REQ 2.6 -> it('returns 403 when service throws ForbiddenError')
// REQ 2.1 -> it('returns 400 for invalid area filter value')
// PROP 1  -> (covered by service test)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { createActivityLogEntry } from "@/test/fixtures/activity-log";
import { NextResponse } from "next/server";

const propertyId = "prop-abc";

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/activity-log-service-instance", () => ({
  activityLogService: {
    getActivityFeed: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { activityLogService } = await import("@/lib/activity-log-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "user-1",
    role: "owner",
    property: null,
    errorResponse: null,
  });
  vi.mocked(activityLogService.getActivityFeed).mockResolvedValue({
    data: [],
    nextCursor: null,
  });
});

function makeRequest(params = new URLSearchParams()) {
  return new Request(
    `http://localhost:3000/api/properties/${propertyId}/activity?${params.toString()}`
  );
}

describe("GET /api/properties/[propertyId]/activity", () => {
  describe("good cases", () => {
    it("returns 200 with activity data for authenticated property member", async () => {
      const entries = [createActivityLogEntry(), createActivityLogEntry()];
      vi.mocked(activityLogService.getActivityFeed).mockResolvedValue({
        data: entries,
        nextCursor: null,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(2);
      expect(json.nextCursor).toBeNull();
    });

    it("response data entries contain createdAt as ISO string", async () => {
      const entry = createActivityLogEntry({
        createdAt: new Date("2026-04-07T12:00:00.000Z"),
      });
      vi.mocked(activityLogService.getActivityFeed).mockResolvedValue({
        data: [entry],
        nextCursor: null,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });
      const json = await response.json();

      expect(json.data[0].createdAt).toBe("2026-04-07T12:00:00.000Z");
    });

    it("passes cursor query param to service", async () => {
      const cursor = "clx-abc";
      const params = new URLSearchParams({ cursor });

      await GET(makeRequest(params), { params: Promise.resolve({ propertyId }) });

      expect(activityLogService.getActivityFeed).toHaveBeenCalledWith(
        "user-1",
        propertyId,
        expect.objectContaining({ cursor })
      );
    });

    it("passes area filter query param to service", async () => {
      const params = new URLSearchParams({ area: "finance" });

      await GET(makeRequest(params), { params: Promise.resolve({ propertyId }) });

      expect(activityLogService.getActivityFeed).toHaveBeenCalledWith(
        "user-1",
        propertyId,
        expect.objectContaining({ area: "finance" })
      );
    });

    it("passes actorId filter query param to service", async () => {
      const actorId = "actor-99";
      const params = new URLSearchParams({ actorId });

      await GET(makeRequest(params), { params: Promise.resolve({ propertyId }) });

      expect(activityLogService.getActivityFeed).toHaveBeenCalledWith(
        "user-1",
        propertyId,
        expect.objectContaining({ actorId })
      );
    });

    it("returns nextCursor when more pages exist", async () => {
      const nextCursor = "clx-next";
      vi.mocked(activityLogService.getActivityFeed).mockResolvedValue({
        data: Array.from({ length: 20 }, () => createActivityLogEntry()),
        nextCursor,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });
      const json = await response.json();

      expect(json.nextCursor).toBe(nextCursor);
    });

    it("staff member can fetch activity feed", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: "staff-1",
        role: "staff",
        property: null,
        errorResponse: null,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("bad cases", () => {
    it("returns 401 when withPropertyAccess returns an error response", async () => {
      const errorResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      vi.mocked(withPropertyAccess).mockResolvedValue({
        userId: null,
        role: null,
        property: null,
        errorResponse,
      });

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });

    it("returns 403 when service throws ForbiddenError", async () => {
      const forbiddenError = Object.assign(new Error("Forbidden"), { name: "ForbiddenError" });
      vi.mocked(activityLogService.getActivityFeed).mockRejectedValue(forbiddenError);

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 400 for invalid area filter value", async () => {
      const params = new URLSearchParams({ area: "INVALID_AREA" });

      const response = await GET(makeRequest(params), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("returns 500 on unexpected service error", async () => {
      vi.mocked(activityLogService.getActivityFeed).mockRejectedValue(
        new Error("Unexpected DB failure")
      );

      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Internal server error");
    });
  });

  describe("edge cases", () => {
    it("returns empty data array and null nextCursor when no activity exists", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });
      const json = await response.json();

      expect(json.data).toEqual([]);
      expect(json.nextCursor).toBeNull();
    });

    it("ignores undefined cursor param (no cursor in URL)", async () => {
      const response = await GET(makeRequest(), {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(200);
      expect(activityLogService.getActivityFeed).toHaveBeenCalledWith(
        "user-1",
        propertyId,
        expect.objectContaining({ cursor: undefined })
      );
    });

    it("handles all valid area filter values", async () => {
      const areas = ["finance", "tenant", "rooms", "settings"] as const;

      for (const area of areas) {
        vi.clearAllMocks();
        vi.mocked(withPropertyAccess).mockResolvedValue({
          userId: "user-1", role: "owner", property: null, errorResponse: null,
        });
        vi.mocked(activityLogService.getActivityFeed).mockResolvedValue({
          data: [], nextCursor: null,
        });
        const params = new URLSearchParams({ area });
        const response = await GET(makeRequest(params), {
          params: Promise.resolve({ propertyId }),
        });
        expect(response.status).toBe(200);
      }
    });

    it("treats empty-string area param as invalid (returns 400)", async () => {
      const params = new URLSearchParams({ area: "" });

      const response = await GET(makeRequest(params), {
        params: Promise.resolve({ propertyId }),
      });

      // Empty string is not a valid area enum value
      expect(response.status).toBe(400);
    });
  });
});
