// Traceability: room-inventory-management
// REQ 1.2 -> it('POST returns 201 and room when body is valid')
// REQ 1.3 -> it('POST returns 400 when room number is missing')
// REQ 1.4 -> it('POST returns 201 and room when body is valid')
// REQ 3.2 -> (covered by E2E/component)
// REQ 5.1, 5.5 -> it('GET returns 200 with rooms and count'), it('GET with status filter returns filtered rooms')
// REQ 5.2, 5.3, 5.4 -> it('GET with status filter returns filtered rooms')
// PROP 12 -> it('GET returns count equal to rooms array length (PROP 12)')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST, GET } from "./route";
import { createRoom } from "@/test/fixtures/room";

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

vi.mock("@/lib/room-service-instance", () => ({
  roomService: {
    createRoom: vi.fn(),
    listRooms: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { withPropertyAccess } = await import("@/lib/property-access");
const { roomService } = await import("@/lib/room-service-instance");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
});

describe("POST /api/properties/[propertyId]/rooms", () => {
  describe("good cases", () => {
    it("POST returns 201 and room when body is valid", async () => {
      const created = createRoom({
        propertyId,
        roomNumber: "A101",
        roomType: "single",
        monthlyRent: 1500000,
        status: "available",
      });
      vi.mocked(roomService.createRoom).mockResolvedValue(created);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A101",
            roomType: "single",
            monthlyRent: 1500000,
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(created.id);
      expect(data.roomNumber).toBe("A101");
      expect(data.roomType).toBe("single");
      expect(data.monthlyRent).toBe(1500000);
      expect(data.status).toBe("available");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });
  });

  describe("bad cases", () => {
    it("POST returns 400 when room number is missing", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomType: "single",
            monthlyRent: 1500000,
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 400 when monthly rent is negative", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A101",
            roomType: "single",
            monthlyRent: -100,
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(400);
    });

    it("POST returns 409 when room number already exists", async () => {
      vi.mocked(roomService.createRoom).mockRejectedValue(
        new Error("Room number already exists")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A101",
            roomType: "single",
            monthlyRent: 1500000,
          }),
        }
      );

      const response = await POST(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/already exists/i);
    });

    it("POST returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A101",
            roomType: "single",
            monthlyRent: 1500000,
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
    it("POST returns 400 when room type is empty", async () => {
      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomNumber: "A101",
            roomType: "",
            monthlyRent: 1500000,
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

describe("GET /api/properties/[propertyId]/rooms", () => {
  describe("good cases", () => {
    it("GET returns 200 with rooms and count", async () => {
      const rooms = [
        createRoom({ propertyId, roomNumber: "A101" }),
        createRoom({ propertyId, roomNumber: "A102" }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValue(rooms);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it("GET with status filter returns filtered rooms", async () => {
      const availableRooms = [
        createRoom({ propertyId, status: "available" }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValue(availableRooms);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms?status=available`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms).toHaveLength(1);
      expect(data.rooms[0].status).toBe("available");
      expect(data.count).toBe(1);
      expect(roomService.listRooms).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        { status: "available" }
      );
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
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("GET returns empty rooms and count 0 when no rooms", async () => {
      vi.mocked(roomService.listRooms).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("GET returns count equal to rooms array length (PROP 12)", async () => {
      const rooms = [
        createRoom({ propertyId }),
        createRoom({ propertyId }),
        createRoom({ propertyId }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValue(rooms);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(data.rooms.length);
      expect(data.count).toBe(3);
    });
  });
});
