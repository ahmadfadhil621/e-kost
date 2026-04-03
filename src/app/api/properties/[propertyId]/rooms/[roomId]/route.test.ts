// Traceability: room-inventory-management
// REQ 3.2 -> (covered by E2E)
// REQ 4.1 -> (covered by E2E)
// REQ 4.2 -> it('PUT returns 200 and updated room when body is valid')
// REQ 4.5 -> it('PUT returns 400 when monthly rent is negative')
// REQ 4.4 -> it('PUT returns 200 and updated room when body is valid')
//
// Traceability: multi-tenant-rooms
// REQ 6.1–6.3 -> it('GET returns tenants array, capacity, and activeTenantCount for occupied room')
// REQ 1.3, 1.4 -> it('PUT returns 409 when capacity reduction blocked by active tenants')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { GET, PUT, DELETE } from "./route";
import { createRoom } from "@/test/fixtures/room";
import { createTenant } from "@/test/fixtures/tenant";

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
    deleteRoom: vi.fn(),
  },
}));

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: {
    listTenants: vi.fn(),
  },
}));

const { withPropertyAccess } = await import("@/lib/property-access");
const { roomService } = await import("@/lib/room-service-instance");
const { tenantService } = await import("@/lib/tenant-service-instance");

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
      vi.mocked(tenantService.listTenants).mockResolvedValue([]);

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
      vi.mocked(tenantService.listTenants).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );

      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(200);
    });

    // REQ 6.1–6.3 — occupied room response includes tenants array, capacity, activeTenantCount
    it("GET returns tenants array, capacity, and activeTenantCount for occupied room", async () => {
      const room = createRoom({ id: roomId, propertyId, status: "occupied", capacity: 2 });
      const tenant1 = createTenant({ id: "tenant-789", propertyId, name: "Jane Doe", roomId, movedOutAt: null });
      const tenant2 = createTenant({ id: "tenant-790", propertyId, name: "Bob Lee", roomId, movedOutAt: null });
      vi.mocked(roomService.getRoom).mockResolvedValue(room);
      vi.mocked(tenantService.listTenants).mockResolvedValue([tenant1, tenant2]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.capacity).toBe(2);
      expect(data.activeTenantCount).toBe(2);
      expect(data.tenants).toHaveLength(2);
      expect(data.tenants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "tenant-789", name: "Jane Doe" }),
          expect.objectContaining({ id: "tenant-790", name: "Bob Lee" }),
        ])
      );
      // Legacy flat fields must not be present
      expect(data.tenantId).toBeUndefined();
      expect(data.tenantName).toBeUndefined();
    });

    // Available room returns capacity and empty tenants array
    it("GET returns capacity and empty tenants array for available room", async () => {
      const room = createRoom({ id: roomId, propertyId, status: "available", capacity: 3 });
      vi.mocked(roomService.getRoom).mockResolvedValue(room);
      vi.mocked(tenantService.listTenants).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.capacity).toBe(3);
      expect(data.activeTenantCount).toBe(0);
      expect(data.tenants).toEqual([]);
      expect(data.tenantId).toBeUndefined();
      expect(data.tenantName).toBeUndefined();
    });

    // Occupied room with no matching tenants in repo still returns empty array safely
    it("GET returns empty tenants array for occupied room with no active tenants in repo", async () => {
      const room = createRoom({ id: roomId, propertyId, status: "occupied", capacity: 1 });
      vi.mocked(roomService.getRoom).mockResolvedValue(room);
      vi.mocked(tenantService.listTenants).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activeTenantCount).toBe(0);
      expect(data.tenants).toEqual([]);
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
    it("PUT returns 403 when staff tries to update room", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyRent: 2000000 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(403);
    });

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

    // REQ 1.4 — capacity reduction blocked by active tenants returns 409
    it("PUT returns 409 when capacity reduction is blocked by active tenants", async () => {
      vi.mocked(roomService.updateRoom).mockRejectedValue(
        new Error("Cannot reduce capacity below current active tenant count")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capacity: 1 }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/cannot reduce capacity/i);
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

describe("DELETE /api/properties/[propertyId]/rooms/[roomId]", () => {
  describe("good cases", () => {
    it("DELETE returns 204 on successful deletion", async () => {
      vi.mocked(roomService.deleteRoom).mockResolvedValue(undefined);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(204);
      expect(roomService.deleteRoom).toHaveBeenCalledWith(
        "test-user-id",
        propertyId,
        roomId
      );
    });
  });

  describe("bad cases", () => {
    it("DELETE returns 403 when staff tries to delete room", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(403);
    });

    it("DELETE returns 404 when room not found", async () => {
      vi.mocked(roomService.deleteRoom).mockRejectedValue(
        new Error("Room not found")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/not found/i);
    });

    it("DELETE returns 409 when room has active tenant", async () => {
      vi.mocked(roomService.deleteRoom).mockRejectedValue(
        new Error("Cannot delete room with active tenant")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toMatch(/active tenant/i);
    });

    it("DELETE returns 403 when access is forbidden", async () => {
      vi.mocked(roomService.deleteRoom).mockRejectedValue(
        new Error("Forbidden")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toMatch(/forbidden/i);
    });

    it("DELETE returns 401 when not authenticated", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("edge cases", () => {
    it("DELETE returns 500 when service throws an unexpected error", async () => {
      vi.mocked(roomService.deleteRoom).mockRejectedValue(
        new Error("Unexpected database failure")
      );

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms/${roomId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ propertyId, roomId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toMatch(/internal server error/i);
    });
  });
});
