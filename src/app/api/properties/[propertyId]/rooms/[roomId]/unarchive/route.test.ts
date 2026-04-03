import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";
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
    unarchiveRoom: vi.fn(),
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

describe("POST /api/properties/[propertyId]/rooms/[roomId]/unarchive", () => {
  describe("good cases", () => {
    it("returns 200 and unarchived room on success", async () => {
      const unarchived = createRoom({
        id: roomId,
        propertyId,
        archivedAt: null,
      });
      vi.mocked(roomService.unarchiveRoom).mockResolvedValue(unarchived);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.archivedAt).toBeNull();
      expect(roomService.unarchiveRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        roomId
      );
    });
  });

  describe("bad cases", () => {
    it("returns 404 when room not found", async () => {
      vi.mocked(roomService.unarchiveRoom).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 409 when room is not archived", async () => {
      vi.mocked(roomService.unarchiveRoom).mockRejectedValue(
        new Error("Room is not archived")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/not archived/i);
    });

    it("returns 403 when staff tries to unarchive room", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(403);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("returns 500 when service throws an unexpected error", async () => {
      vi.mocked(roomService.unarchiveRoom).mockRejectedValue(
        new Error("Unexpected database failure")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/unarchive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toMatch(/internal server error/i);
    });
  });
});
