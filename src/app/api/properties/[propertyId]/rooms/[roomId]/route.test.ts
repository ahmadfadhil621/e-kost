// Traceability: room-inventory-management
// REQ 3.2 -> (covered by E2E)
// REQ 4.1 -> (covered by E2E)
// REQ 4.2 -> it('PUT returns 200 and updated room when body is valid')
// REQ 4.5 -> it('PUT returns 400 when monthly rent is negative')
// REQ 4.4 -> it('PUT returns 200 and updated room when body is valid')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, PUT } from "./route";
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
    getRoom: vi.fn(),
    updateRoom: vi.fn(),
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

describe("GET /api/properties/[propertyId]/rooms/[roomId]", () => {
  describe("good cases", () => {
    it("GET returns 200 and room when found", async () => {
      const room = createRoom({
        id: roomId,
        propertyId,
        roomNumber: "A101",
        roomType: "single",
        monthlyRent: 1500000,
        status: "available",
      });
      vi.mocked(roomService.getRoom).mockResolvedValue(room);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(roomId);
      expect(data.roomNumber).toBe("A101");
      expect(data.monthlyRent).toBe(1500000);
      expect(data.status).toBe("available");
    });
  });

  describe("bad cases", () => {
    it("GET returns 404 when room not found", async () => {
      vi.mocked(roomService.getRoom).mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("GET returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("GET returns 200 when room exists in property", async () => {
      const room = createRoom({ id: roomId, propertyId });
      vi.mocked(roomService.getRoom).mockResolvedValue(room);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(200);
    });
  });
});

describe("PUT /api/properties/[propertyId]/rooms/[roomId]", () => {
  describe("good cases", () => {
    it("PUT returns 200 and updated room when body is valid", async () => {
      const updated = createRoom({
        id: roomId,
        propertyId,
        roomNumber: "A102",
        roomType: "double",
        monthlyRent: 2000000,
      });
      vi.mocked(roomService.updateRoom).mockResolvedValue(updated);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A102",
            roomType: "double",
            monthlyRent: 2000000,
          }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roomNumber).toBe("A102");
      expect(data.monthlyRent).toBe(2000000);
    });
  });

  describe("bad cases", () => {
    it("PUT returns 400 when monthly rent is negative", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyRent: -100 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });

    it("PUT returns 404 when room not found", async () => {
      vi.mocked(roomService.updateRoom).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumber: "A102" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(404);
    });

    it("PUT returns 409 when room number already exists", async () => {
      vi.mocked(roomService.updateRoom).mockRejectedValue(
        new Error("Room number already exists")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumber: "A101" }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("edge cases", () => {
    it("PUT returns 400 when body is empty", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(400);
    });
  });
});
