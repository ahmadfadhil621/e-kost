// Traceability: room-inventory-management
// REQ 1.2 -> it('POST returns 201 and room when body is valid')
// REQ 1.3 -> it('POST returns 400 when room number is missing')
// REQ 1.4 -> it('POST returns 201 and room when body is valid')
// REQ 3.2 -> (covered by E2E/component)
// REQ 5.1, 5.5 -> it('GET returns 200 with rooms and count'), it('GET with status filter returns filtered rooms')
// REQ 5.2, 5.3, 5.4 -> it('GET with status filter returns filtered rooms')
// PROP 12 -> it('GET returns count equal to rooms array length (PROP 12)')
//
// Traceability: multi-tenant-rooms
// REQ 5 (UI) -> it('GET returns occupied room with tenants array, capacity, activeTenantCount')
// REQ 5.1 -> it('GET with hasCapacity=true returns only rooms with open slots')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
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

vi.mock("@/lib/tenant-service-instance", () => ({
  tenantService: {
    listTenants: vi.fn(),
  },
}));

vi.mock("@/lib/balance-service-instance", () => ({
  balanceService: {
    calculateBalances: vi.fn(),
  },
}));

const { getSession } = await import("@/lib/auth-api");
const { withPropertyAccess } = await import("@/lib/property-access");
const { roomService } = await import("@/lib/room-service-instance");
const { tenantService } = await import("@/lib/tenant-service-instance");
const { balanceService } = await import("@/lib/balance-service-instance");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ session: mockSession });
  vi.mocked(withPropertyAccess).mockResolvedValue({
    userId: "test-user-id",
    role: "owner",
    errorResponse: null,
  });
  vi.mocked(tenantService.listTenants).mockResolvedValue([]);
  vi.mocked(balanceService.calculateBalances).mockResolvedValue([]);
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

    it("POST returns 403 when staff tries to create room", async () => {
      vi.mocked(withPropertyAccess).mockResolvedValueOnce({
        userId: null,
        role: null,
        errorResponse: NextResponse.json({ error: "Owner access required" }, { status: 403 }),
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

      expect(response.status).toBe(403);
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

    // REQ 5 (UI) — occupied room response includes tenants array, capacity, activeTenantCount
    it("GET returns occupied room with tenants array, capacity, and activeTenantCount", async () => {
      const roomId = "room-1";
      const tenantId = "tenant-1";
      const rooms = [
        createRoom({ id: roomId, propertyId, status: "occupied", capacity: 2 }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValue(rooms);
      vi.mocked(tenantService.listTenants).mockResolvedValue([
        {
          id: tenantId,
          propertyId,
          name: "Budi Santoso",
          phone: "",
          email: "",
          roomId,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          movedOutAt: null,
        },
      ]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValue([
        {
          tenantId,
          tenantName: "Budi Santoso",
          roomNumber: "101",
          monthlyRent: 200,
          totalPayments: 0,
          outstandingBalance: 200,
          status: "unpaid",
        },
      ]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms).toHaveLength(1);
      const room = data.rooms[0];
      expect(room.capacity).toBe(2);
      expect(room.activeTenantCount).toBe(1);
      expect(room.tenants).toHaveLength(1);
      expect(room.tenants[0].id).toBe(tenantId);
      expect(room.tenants[0].name).toBe("Budi Santoso");
      // Legacy flat fields should not be present
      expect(room.tenantId).toBeUndefined();
      expect(room.tenantName).toBeUndefined();
    });

    // REQ 5.1 — ?hasCapacity=true returns only rooms that have open slots
    it("GET with hasCapacity=true returns only rooms with open slots", async () => {
      const roomWithCapacity = createRoom({ id: "r1", propertyId, status: "available", capacity: 2 });
      const roomAtCapacity = createRoom({ id: "r2", propertyId, status: "occupied", capacity: 1 });
      const tenantInFullRoom = {
        id: "t1",
        propertyId,
        name: "Alice",
        phone: "",
        email: "",
        roomId: "r2",
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        movedOutAt: null as Date | null,
      };
      vi.mocked(roomService.listRooms).mockResolvedValue([roomWithCapacity, roomAtCapacity]);
      vi.mocked(tenantService.listTenants).mockResolvedValue([tenantInFullRoom]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValue([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms?hasCapacity=true`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms).toHaveLength(1);
      expect(data.rooms[0].id).toBe("r1");
    });

    // Available room always includes capacity field even without tenants
    it("GET returns capacity on available room with no tenants", async () => {
      const rooms = [createRoom({ propertyId, status: "available", capacity: 3 })];
      vi.mocked(roomService.listRooms).mockResolvedValue(rooms);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(data.rooms[0].capacity).toBe(3);
      expect(data.rooms[0].activeTenantCount).toBe(0);
      expect(data.rooms[0].tenants).toEqual([]);
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

// Traceability: room-tenant-move-in-date
// AC-6 -> it('GET returns assignedAt on each tenant in tenants array for occupied room')
// AC-6 -> it('GET returns earliest assignedAt as room-level field for multi-tenant room')
// AC-6 -> it('GET returns null room-level assignedAt when all tenants have null assignedAt')
// AC-6 -> it('GET returns null room-level assignedAt for available room with no tenants')
// PROP 2 -> it('PROP 2: room-level assignedAt is always ≤ every tenant assignedAt (earliest)')

describe("GET /api/properties/[propertyId]/rooms — assignedAt enrichment", () => {
  describe("good cases", () => {
    it("GET returns assignedAt on each tenant in tenants array for occupied room", async () => {
      const roomId = "room-1";
      const assignedAtDate = new Date("2024-01-15T00:00:00.000Z");
      const rooms = [
        createRoom({ id: roomId, propertyId, status: "occupied", capacity: 1 }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValueOnce(rooms);
      vi.mocked(tenantService.listTenants).mockResolvedValueOnce([
        {
          id: "tenant-1",
          propertyId,
          name: "Jane Doe",
          phone: "",
          email: "",
          roomId,
          roomNumber: null,
          assignedAt: assignedAtDate,
          createdAt: new Date(),
          updatedAt: new Date(),
          movedOutAt: null,
        },
      ]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValueOnce([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms[0].tenants[0].assignedAt).toBe(assignedAtDate.toISOString());
      expect(data.rooms[0].assignedAt).toBe(assignedAtDate.toISOString());
    });

    it("GET returns earliest assignedAt as room-level field for multi-tenant room", async () => {
      const roomId = "room-1";
      const earlierDate = new Date("2023-06-01T00:00:00.000Z");
      const laterDate = new Date("2024-03-10T00:00:00.000Z");
      const rooms = [
        createRoom({ id: roomId, propertyId, status: "occupied", capacity: 2 }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValueOnce(rooms);
      vi.mocked(tenantService.listTenants).mockResolvedValueOnce([
        {
          id: "tenant-1",
          propertyId,
          name: "Alice",
          phone: "",
          email: "",
          roomId,
          roomNumber: null,
          assignedAt: earlierDate,
          createdAt: new Date(),
          updatedAt: new Date(),
          movedOutAt: null,
        },
        {
          id: "tenant-2",
          propertyId,
          name: "Bob",
          phone: "",
          email: "",
          roomId,
          roomNumber: null,
          assignedAt: laterDate,
          createdAt: new Date(),
          updatedAt: new Date(),
          movedOutAt: null,
        },
      ]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValueOnce([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms[0].assignedAt).toBe(earlierDate.toISOString());
    });
  });

  describe("bad cases", () => {
    it("GET returns null room-level assignedAt when all tenants have null assignedAt", async () => {
      const roomId = "room-1";
      const rooms = [
        createRoom({ id: roomId, propertyId, status: "occupied", capacity: 1 }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValueOnce(rooms);
      vi.mocked(tenantService.listTenants).mockResolvedValueOnce([
        {
          id: "tenant-1",
          propertyId,
          name: "Jane Doe",
          phone: "",
          email: "",
          roomId,
          roomNumber: null,
          assignedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          movedOutAt: null,
        },
      ]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValueOnce([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms[0].assignedAt).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("GET returns null room-level assignedAt for available room with no tenants", async () => {
      const rooms = [
        createRoom({ propertyId, status: "available", capacity: 1 }),
      ];
      vi.mocked(roomService.listRooms).mockResolvedValueOnce(rooms);
      vi.mocked(tenantService.listTenants).mockResolvedValueOnce([]);
      vi.mocked(balanceService.calculateBalances).mockResolvedValueOnce([]);

      const request = new Request(
        `http://localhost:3000/api/properties/${propertyId}/rooms`
      );
      const response = await GET(request, {
        params: Promise.resolve({ propertyId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rooms[0].assignedAt).toBeNull();
    });
  });
});

// PROP 2: room-level assignedAt is always ≤ every tenant assignedAt (earliest)
describe("GET /api/properties/[propertyId]/rooms — PROP 2: assignedAt is earliest", () => {
  it("PROP 2: room-level assignedAt is always ≤ every tenant assignedAt (earliest)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.option(fc.date({ min: new Date("2000-01-01"), max: new Date("2030-12-31") }), { nil: null }),
          { minLength: 1, maxLength: 6 }
        ),
        async (assignedAtValues) => {
          // Discard inputs where fast-check's shrinker produced an invalid Date
          // (e.g. new Date(NaN)). NaN dates cannot exist in the real database.
          fc.pre(assignedAtValues.every((d) => d === null || !isNaN(d.getTime())));

          const roomId = "room-prop2";
          const rooms = [
            createRoom({ id: roomId, propertyId, status: "occupied", capacity: assignedAtValues.length }),
          ];
          const tenants = assignedAtValues.map((assignedAt, i) => ({
            id: `t-${i}`,
            propertyId,
            name: `Tenant ${i}`,
            phone: "",
            email: "",
            roomId,
            roomNumber: null,
            assignedAt,
            createdAt: new Date(),
            updatedAt: new Date(),
            movedOutAt: null,
          }));

          // Use mockImplementation (not Once) so shrink iterations always get the current value
          vi.mocked(roomService.listRooms).mockImplementation(async () => rooms);
          vi.mocked(tenantService.listTenants).mockImplementation(async () => tenants);
          vi.mocked(balanceService.calculateBalances).mockImplementation(async () => []);

          const request = new Request(
            `http://localhost:3000/api/properties/${propertyId}/rooms`
          );
          const response = await GET(request, {
            params: Promise.resolve({ propertyId }),
          });
          const data = await response.json();

          const roomAssignedAt = data.rooms[0].assignedAt;
          const nonNullDates = assignedAtValues
            .filter((d): d is Date => d !== null)
            .map((d) => d.getTime());

          if (nonNullDates.length === 0) {
            expect(roomAssignedAt).toBeNull();
          } else {
            const expectedMin = new Date(Math.min(...nonNullDates)).toISOString();
            expect(roomAssignedAt).toBe(expectedMin);
            // Room-level assignedAt must be ≤ every tenant's assignedAt
            const tenantAssignedAts = data.rooms[0].tenants
              .map((t: { assignedAt: string | null }) => t.assignedAt)
              .filter((d: string | null): d is string => d !== null);
            for (const tenantDate of tenantAssignedAts) {
              expect(new Date(roomAssignedAt).getTime()).toBeLessThanOrEqual(
                new Date(tenantDate).getTime()
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
