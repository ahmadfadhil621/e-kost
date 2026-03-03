// Traceability: room-inventory-management
// REQ 1.2 -> it('creates a room with valid data')
// REQ 1.3 -> it('rejects when room number is missing'), it('rejects when monthly rent is negative')
// REQ 1.4 -> it('creates a room with valid data'), it('creates room with initial status available (PROP 1)')
// REQ 1.5 -> it('creates a room with valid data')
// REQ 2.2 -> it('updateRoomStatus accepts valid status values')
// REQ 2.3, 2.4, 2.5, 2.6 -> it('updateRoomStatus persists status and returns updated room')
// REQ 3.2 -> (covered by component/E2E)
// REQ 4.2, 4.4 -> it('updates room when data is valid')
// REQ 4.3 -> it('updateRoom preserves id, status, and createdAt')
// REQ 4.5 -> it('rejects update with negative monthly rent')
// REQ 5.2, 5.3, 5.4 -> it('listRooms with status filter returns only matching rooms')
// PROP 1 -> it('room creation returns complete object with ID, status, timestamp (PROP 1)')
// PROP 2 -> it('rejects when room number is missing')
// PROP 3 -> it('updateRoomStatus rejects invalid status value')
// PROP 4 -> it('updateRoomStatus persists status and returns updated room')
// PROP 8 -> it('updates room when data is valid')
// PROP 9 -> it('updateRoom preserves id, status, and createdAt')
// PROP 10 -> it('rejects update with negative monthly rent'), it('rejects update with duplicate room number')
// PROP 11 -> it('listRooms with status filter returns only matching rooms')
// PROP 12 -> (covered by API route test GET returns count equal to rooms array length)
// PROP 13 -> it('create then getRoom returns same data (PROP 13)')
// PROP 14 -> it('rejects create when room number already exists'), it('rejects update with duplicate room number')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { RoomService } from "./room-service";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type { RoomStatus } from "@/domain/schemas/room";
import { createRoom } from "@/test/fixtures/room";

function createMockRepo(overrides: Partial<IRoomRepository> = {}): IRoomRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("RoomService", () => {
  describe("createRoom", () => {
    describe("good cases", () => {
      it("creates a room with valid data", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createRoom({
          propertyId,
          roomNumber: "B202",
          roomType: "double",
          monthlyRent: 2000000,
          status: "available",
        });
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.createRoom(userId, propertyId, {
          roomNumber: "B202",
          roomType: "double",
          monthlyRent: 2000000,
        });

        expect(result.id).toBe(created.id);
        expect(result.roomNumber).toBe("B202");
        expect(result.roomType).toBe("double");
        expect(result.monthlyRent).toBe(2000000);
        expect(result.status).toBe("available");
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(repo.create).toHaveBeenCalledWith({
          propertyId,
          roomNumber: "B202",
          roomType: "double",
          monthlyRent: 2000000,
        });
      });

      it("create then getRoom returns same data (PROP 13)", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createRoom({
          propertyId,
          roomNumber: "X99",
          roomType: "suite",
          monthlyRent: 3000000,
          status: "available",
        });
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(created),
          findById: vi.fn().mockResolvedValue(created),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.createRoom(userId, propertyId, {
          roomNumber: "X99",
          roomType: "suite",
          monthlyRent: 3000000,
        });
        const retrieved = await service.getRoom(userId, propertyId, result.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(result.id);
        expect(retrieved!.roomNumber).toBe(result.roomNumber);
        expect(retrieved!.roomType).toBe(result.roomType);
        expect(retrieved!.monthlyRent).toBe(result.monthlyRent);
        expect(retrieved!.status).toBe(result.status);
      });

      it("creates room with initial status available (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const created = createRoom({ propertyId, status: "available" });
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.createRoom(
          crypto.randomUUID(),
          propertyId,
          { roomNumber: "C1", roomType: "single", monthlyRent: 1000 }
        );

        expect(result.status).toBe("available");
      });
    });

    describe("bad cases", () => {
      it("rejects when room number is missing", async () => {
        const repo = createMockRepo();
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.createRoom(crypto.randomUUID(), crypto.randomUUID(), {
            roomNumber: "",
            roomType: "single",
            monthlyRent: 1000,
          })
        ).rejects.toThrow(/required|room number/i);
      });

      it("rejects when room type is missing", async () => {
        const repo = createMockRepo();
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.createRoom(crypto.randomUUID(), crypto.randomUUID(), {
            roomNumber: "A1",
            roomType: "",
            monthlyRent: 1000,
          })
        ).rejects.toThrow(/required|room type/i);
      });

      it("rejects when monthly rent is negative", async () => {
        const repo = createMockRepo();
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.createRoom(crypto.randomUUID(), crypto.randomUUID(), {
            roomNumber: "A1",
            roomType: "single",
            monthlyRent: -100,
          })
        ).rejects.toThrow(/positive/i);
      });

      it("rejects create when room number already exists (PROP 14)", async () => {
        const propertyId = crypto.randomUUID();
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([
            createRoom({ propertyId, roomNumber: "A101" }),
          ]),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.createRoom(crypto.randomUUID(), propertyId, {
            roomNumber: "A101",
            roomType: "single",
            monthlyRent: 1000,
          })
        ).rejects.toThrow(/already exists/i);
      });
    });

    describe("edge cases", () => {
      it("trims room number and room type", async () => {
        const propertyId = crypto.randomUUID();
        const created = createRoom({
          propertyId,
          roomNumber: "X1",
          roomType: "single",
        });
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await service.createRoom(crypto.randomUUID(), propertyId, {
          roomNumber: "  X1  ",
          roomType: "  single  ",
          monthlyRent: 500,
        });

        expect(repo.create).toHaveBeenCalledWith({
          propertyId,
          roomNumber: "X1",
          roomType: "single",
          monthlyRent: 500,
        });
      });

      it("rejects when user has no property access", async () => {
        const repo = createMockRepo();
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new RoomService(repo, propertyAccess);

        await expect(
          service.createRoom("user-1", "prop-1", {
            roomNumber: "A1",
            roomType: "single",
            monthlyRent: 1000,
          })
        ).rejects.toThrow(/Forbidden/i);
      });
    });
  });

  describe("getRoom", () => {
    describe("good cases", () => {
      it("returns room when found and property matches", async () => {
        const propertyId = crypto.randomUUID();
        const room = createRoom({ propertyId, id: "room-1" });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(room),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.getRoom("user-1", propertyId, "room-1");

        expect(result).toEqual(room);
      });
    });

    describe("bad cases", () => {
      it("returns null when room not found", async () => {
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(null) });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.getRoom(
          "user-1",
          "prop-1",
          "non-existent"
        );

        expect(result).toBeNull();
        expect(repo.findById).toHaveBeenCalledWith("non-existent");
      });

      it("returns null when room belongs to another property", async () => {
        const room = createRoom({
          id: "room-1",
          propertyId: "other-property",
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(room),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.getRoom("user-1", "my-property", "room-1");

        expect(result).toBeNull();
        expect(result).not.toEqual(room);
      });
    });

    describe("edge cases", () => {
      it("returns room when propertyId matches", async () => {
        const room = createRoom({ propertyId: "p1", id: "r1" });
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(room) });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.getRoom("user-1", "p1", "r1");

        expect(result?.id).toBe("r1");
      });
    });
  });

  describe("listRooms", () => {
    describe("good cases", () => {
      it("returns all rooms for property when no filter", async () => {
        const propertyId = crypto.randomUUID();
        const rooms = [
          createRoom({ propertyId, status: "available" }),
          createRoom({ propertyId, status: "occupied" }),
        ];
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue(rooms),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.listRooms("user-1", propertyId);

        expect(result).toHaveLength(2);
        expect(repo.findByProperty).toHaveBeenCalledWith(propertyId, undefined);
      });

      it("listRooms with status filter returns only matching rooms (PROP 11)", async () => {
        const propertyId = crypto.randomUUID();
        const availableRooms = [
          createRoom({ propertyId, status: "available" }),
          createRoom({ propertyId, status: "available" }),
        ];
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue(availableRooms),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.listRooms("user-1", propertyId, {
          status: "available",
        });

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.status === "available")).toBe(true);
        expect(repo.findByProperty).toHaveBeenCalledWith(propertyId, {
          status: "available",
        });
      });
    });

    describe("bad cases", () => {
      it("returns empty array when property has no rooms", async () => {
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.listRooms("user-1", "prop-1");

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("passes status filter to repository", async () => {
        const repo = createMockRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await service.listRooms("user-1", "prop-1", { status: "under_renovation" });

        expect(repo.findByProperty).toHaveBeenCalledWith("prop-1", {
          status: "under_renovation",
        });
      });
    });
  });

  describe("updateRoom", () => {
    describe("good cases", () => {
      it("updates room when data is valid", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({
          propertyId,
          id: "room-1",
          roomNumber: "A1",
          roomType: "single",
          monthlyRent: 1000,
        });
        const updated = createRoom({
          ...existing,
          roomNumber: "A2",
          roomType: "double",
          monthlyRent: 1500,
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          findByProperty: vi.fn().mockResolvedValue([existing]),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.updateRoom("user-1", propertyId, "room-1", {
          roomNumber: "A2",
          roomType: "double",
          monthlyRent: 1500,
        });

        expect(result.roomNumber).toBe("A2");
        expect(result.monthlyRent).toBe(1500);
        expect(repo.update).toHaveBeenCalledWith("room-1", {
          roomNumber: "A2",
          roomType: "double",
          monthlyRent: 1500,
        });
      });

      it("updateRoom preserves id, status, and createdAt (PROP 9)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({
          propertyId,
          id: "room-1",
          status: "occupied",
          createdAt: new Date("2025-01-01"),
        });
        const updated = createRoom({
          ...existing,
          roomNumber: "A2",
          updatedAt: new Date("2025-01-02"),
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          findByProperty: vi.fn().mockResolvedValue([existing]),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.updateRoom("user-1", propertyId, "room-1", {
          roomNumber: "A2",
        });

        expect(result.id).toBe("room-1");
        expect(result.status).toBe("occupied");
        expect(repo.update).toHaveBeenCalledWith("room-1", {
          roomNumber: "A2",
          roomType: undefined,
          monthlyRent: undefined,
        });
      });
    });

    describe("bad cases", () => {
      it("rejects update with negative monthly rent (PROP 10)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1" });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          findByProperty: vi.fn().mockResolvedValue([existing]),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.updateRoom("user-1", propertyId, "room-1", {
            monthlyRent: -100,
          })
        ).rejects.toThrow(/positive/i);
      });

      it("rejects update with duplicate room number (PROP 14)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({
          propertyId,
          id: "room-1",
          roomNumber: "A1",
        });
        const other = createRoom({
          propertyId,
          id: "room-2",
          roomNumber: "A2",
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          findByProperty: vi.fn().mockResolvedValue([existing, other]),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.updateRoom("user-1", propertyId, "room-1", {
            roomNumber: "A2",
          })
        ).rejects.toThrow(/already exists/i);
      });

      it("throws room not found when room does not exist", async () => {
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(null) });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.updateRoom("user-1", "prop-1", "missing", {
            roomNumber: "A2",
          })
        ).rejects.toThrow(/not found/i);
      });
    });

    describe("edge cases", () => {
      it("allows partial update of single field", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1" });
        const updated = createRoom({ ...existing, roomType: "double" });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          findByProperty: vi.fn().mockResolvedValue([existing]),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await service.updateRoom("user-1", propertyId, "room-1", {
          roomType: "double",
        });

        expect(repo.update).toHaveBeenCalledWith("room-1", {
          roomNumber: undefined,
          roomType: "double",
          monthlyRent: undefined,
        });
      });
    });
  });

  describe("updateRoomStatus", () => {
    describe("good cases", () => {
      it("updateRoomStatus accepts valid status values", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1" });
        const updated = createRoom({
          ...existing,
          status: "occupied",
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          updateStatus: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.updateRoomStatus(
          "user-1",
          propertyId,
          "room-1",
          "occupied"
        );

        expect(result.status).toBe("occupied");
        expect(repo.updateStatus).toHaveBeenCalledWith("room-1", "occupied");
      });

      it("updateRoomStatus persists status and returns updated room (PROP 4)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1" });
        const updated = createRoom({
          ...existing,
          status: "under_renovation",
          updatedAt: new Date(),
        });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          updateStatus: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.updateRoomStatus(
          "user-1",
          propertyId,
          "room-1",
          "under_renovation"
        );

        expect(result.status).toBe("under_renovation");
        expect(repo.updateStatus).toHaveBeenCalledWith(
          "room-1",
          "under_renovation"
        );
      });
    });

    describe("bad cases", () => {
      it("updateRoomStatus rejects invalid status value (PROP 3)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1" });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.updateRoomStatus(
            "user-1",
            propertyId,
            "room-1",
            "invalid" as RoomStatus
          )
        ).rejects.toThrow(/status must be one of/i);
      });

      it("throws room not found when room does not exist", async () => {
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(null) });
        const service = new RoomService(repo, createMockPropertyAccess());

        await expect(
          service.updateRoomStatus("user-1", "prop-1", "missing", "available")
        ).rejects.toThrow(/not found/i);
      });
    });

    describe("edge cases", () => {
      it("updates status to available", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createRoom({ propertyId, id: "room-1", status: "occupied" });
        const updated = createRoom({ ...existing, status: "available" });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(existing),
          updateStatus: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomService(repo, createMockPropertyAccess());

        const result = await service.updateRoomStatus(
          "user-1",
          propertyId,
          "room-1",
          "available"
        );

        expect(result.status).toBe("available");
      });
    });
  });
});

describe("property-based tests", () => {
  // Feature: room-inventory-management, Property 1: Room Creation Completeness
  it("room creation returns complete object with ID, status, timestamp (PROP 1)", () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          roomNumber: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          roomType: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          monthlyRent: fc.double({ min: 0.01, max: 100000, noNaN: true }),
        }),
        async (roomData) => {
          const propertyId = crypto.randomUUID();
          const userId = crypto.randomUUID();
          const trimmed = {
            roomNumber: roomData.roomNumber.trim(),
            roomType: roomData.roomType.trim(),
            monthlyRent: roomData.monthlyRent,
          };
          const created = createRoom({
            propertyId,
            ...trimmed,
            status: "available",
          });
          const repo = createMockRepo({
            findByProperty: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue(created),
          });
          const service = new RoomService(repo, createMockPropertyAccess());

          const result = await service.createRoom(userId, propertyId, roomData);

          expect(result.id).toBeDefined();
          expect(result.status).toBe("available");
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
          expect(result.roomNumber).toBe(trimmed.roomNumber);
          expect(result.roomType).toBe(trimmed.roomType);
          expect(result.monthlyRent).toBe(roomData.monthlyRent);
        }
      ),
      { numRuns: 100 }
    );
  });
});
