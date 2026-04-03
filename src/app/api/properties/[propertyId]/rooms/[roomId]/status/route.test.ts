// Traceability: room-inventory-management
// REQ 2.2 -> it('PATCH accepts valid status values')
// REQ 2.6 -> it('PATCH returns 200 with updated room')
// REQ 2.3, 2.4, 2.5 -> it('PATCH returns 200 with updated room')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { PATCH } from "./route";
import { createRoom } from "@/test/fixtures/room";

const propertyId = "prop-123";
const roomId = "room-456";

vi.mock("@/lib/auth-api", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/property-access", () => ({
  withPropertyAccess: vi.fn(),
}));

vi.mock("@/lib/room-service-instance", () => ({
  roomService: {
    updateRoomStatus: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { roomService } = await import("@/lib/room-service-instance");

beforeEach(() => {
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("PATCH /api/properties/[propertyId]/rooms/[roomId]/status", () => {
  describe("good cases", () => {
    it("PATCH returns 200 with updated room when status is valid", async () => {
      const updated = createRoom({
        id: roomId,
        propertyId,
        status: "occupied",
      });
      vi.mocked(roomService.updateRoomStatus).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("occupied");
      expect(roomService.updateRoomStatus).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        roomId,
        "occupied"
      );
    });

    it("PATCH accepts available and under_renovation status values", async () => {
      for (const status of ["available", "under_renovation"] as const) {
        const updated = createRoom({ id: roomId, propertyId, status });
        vi.mocked(roomService.updateRoomStatus).mockResolvedValue(updated);

        const request = new Request(
          `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );

        const response = await PATCH(request, {
          params: Promise.resolve({ propertyId, roomId }),
        });

        expect(response.status).toBe(200);
      }
    });
  });

  describe("bad cases", () => {
    it("PATCH returns 409 when manually setting status to occupied", async () => {
      vi.mocked(roomService.updateRoomStatus).mockRejectedValue(
        new Error("Cannot manually set room status to occupied: it is managed automatically")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/manually set.*occupied|occupied.*automatically/i);
    });

    it("PATCH returns 409 with user-visible error when setting occupied with no active tenant", async () => {
      vi.mocked(roomService.updateRoomStatus).mockRejectedValue(
        new Error("Cannot manually set room status to occupied: it is managed automatically")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "occupied" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/manually set.*occupied|occupied.*automatically/i);
    });

    it("PATCH returns 400 when status is invalid", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "invalid" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });

    it("PATCH returns 404 when room not found", async () => {
      vi.mocked(roomService.updateRoomStatus).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(404);
    });

    it("PATCH returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "available" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("PATCH returns 200 when changing to under_renovation", async () => {
      const updated = createRoom({
        id: roomId,
        propertyId,
        status: "under_renovation",
      });
      vi.mocked(roomService.updateRoomStatus).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "under_renovation" }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(200);
      expect((await response.json()).status).toBe("under_renovation");
    });
  });
});
