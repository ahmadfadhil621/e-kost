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
    archiveRoom: vi.fn(),
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

describe("POST /api/properties/[propertyId]/rooms/[roomId]/archive", () => {
  describe("good cases", () => {
    it("returns 200 and archived room on success", async () => {
      const archived = createRoom({
        id: roomId,
        propertyId,
        archivedAt: new Date("2026-03-18"),
      });
      vi.mocked(roomService.archiveRoom).mockResolvedValue(archived);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/archive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.archivedAt).toBeTruthy();
      expect(roomService.archiveRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        roomId
      );
    });
  });

  describe("bad cases", () => {
    it("returns 404 when room not found", async () => {
      vi.mocked(roomService.archiveRoom).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/archive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(404);
    });

    it("returns 409 when room is already archived", async () => {
      vi.mocked(roomService.archiveRoom).mockRejectedValue(
        new Error("Room is already archived")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/archive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/already archived/i);
    });

    it("returns 409 when room has active tenant", async () => {
      vi.mocked(roomService.archiveRoom).mockRejectedValue(
        new Error("Cannot archive room with active tenant")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/archive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/active tenant/i);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}/archive`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
