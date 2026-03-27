// Traceability: tenant-room-basics
// REQ 1.2 -> it('creates a tenant with valid data')
// REQ 1.3 -> it('rejects when name is missing'), it('rejects when email is invalid')
// REQ 1.4, 1.5 -> it('creates a tenant with valid data')
// REQ 2.2 -> it('assignRoom returns only when room is available (PROP 3)')
// REQ 2.3, 2.4 -> it('assigns tenant to room and updates room status (PROP 4)')
// REQ 2.5 -> it('rejects assignRoom when room is occupied (PROP 5)')
// REQ 3.1 -> (covered by component/E2E)
// REQ 4.2, 4.4 -> it('updates tenant when data is valid (PROP 8)')
// REQ 4.3 -> it('updateTenant preserves id, createdAt, roomId (PROP 9)')
// REQ 4.5 -> it('rejects update with invalid email (PROP 10)')
// REQ 5.3, 5.4, 5.5 -> it('moveOut sets movedOutAt and frees room (PROP 11)')
// PROP 1 -> it('tenant creation returns complete object with ID and timestamp (PROP 1)')
// PROP 2 -> it('rejects when name is missing')
// PROP 12 -> it('create then getTenant returns same data (PROP 12)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { TenantService } from "./tenant-service";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type { RoomStatus } from "@/domain/schemas/room";
import { createTenant } from "@/test/fixtures/tenant";
import { createRoom } from "@/test/fixtures/room";

function createMockTenantRepo(
  overrides: Partial<ITenantRepository> = {}
): ITenantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    update: vi.fn(),
    assignRoom: vi.fn(),
    removeRoomAssignment: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

function createMockRoomRepo(
  overrides: Partial<IRoomRepository> = {}
): IRoomRepository {
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

describe("TenantService", () => {
  describe("createTenant", () => {
    describe("good cases", () => {
      it("creates a tenant with valid data", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createTenant({
          propertyId,
          name: "Jane Doe",
          phone: "08123456789",
          email: "jane@example.com",
        });
        const tenantRepo = createMockTenantRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const roomRepo = createMockRoomRepo();
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.createTenant(userId, propertyId, {
          name: "Jane Doe",
          phone: "08123456789",
          email: "jane@example.com",
        });

        expect(result.id).toBe(created.id);
        expect(result.name).toBe("Jane Doe");
        expect(result.phone).toBe("08123456789");
        expect(result.email).toBe("jane@example.com");
        expect(result.roomId).toBeNull();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(tenantRepo.create).toHaveBeenCalledWith({
          propertyId,
          name: "Jane Doe",
          phone: "08123456789",
          email: "jane@example.com",
        });
      });

      it("tenant creation returns complete object with ID and timestamp (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const created = createTenant({
          propertyId,
          name: "Alice",
          phone: "08111111111",
          email: "alice@test.com",
        });
        const tenantRepo = createMockTenantRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.createTenant(
          crypto.randomUUID(),
          propertyId,
          { name: "Alice", phone: "08111111111", email: "alice@test.com" }
        );

        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(result.name).toBe("Alice");
        expect(result.email).toBe("alice@test.com");
      });

      it("create then getTenant returns same data (PROP 12)", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
        const created = createTenant({
          propertyId,
          name: "Bob",
          phone: "08222222222",
          email: "bob@test.com",
        });
        const tenantRepo = createMockTenantRepo({
          create: vi.fn().mockResolvedValue(created),
          findById: vi.fn().mockResolvedValue(created),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.createTenant(userId, propertyId, {
          name: "Bob",
          phone: "08222222222",
          email: "bob@test.com",
        });
        const retrieved = await service.getTenant(userId, propertyId, result.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(result.id);
        expect(retrieved!.name).toBe(result.name);
        expect(retrieved!.email).toBe(result.email);
      });
    });

    describe("bad cases", () => {
      it("rejects when name is missing", async () => {
        const tenantRepo = createMockTenantRepo();
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.createTenant(crypto.randomUUID(), crypto.randomUUID(), {
            name: "",
            phone: "08123456789",
            email: "a@b.com",
          })
        ).rejects.toThrow(/name|required/i);
      });

      it("rejects when phone is missing", async () => {
        const tenantRepo = createMockTenantRepo();
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.createTenant(crypto.randomUUID(), crypto.randomUUID(), {
            name: "John",
            phone: "",
            email: "john@example.com",
          })
        ).rejects.toThrow(/phone|required/i);
      });

      it("rejects when email is invalid (PROP 2)", async () => {
        const tenantRepo = createMockTenantRepo();
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.createTenant(crypto.randomUUID(), crypto.randomUUID(), {
            name: "John",
            phone: "08123456789",
            email: "notanemail",
          })
        ).rejects.toThrow(/email|invalid/i);
      });
    });

    describe("edge cases", () => {
      it("trims name, phone, and email", async () => {
        const propertyId = crypto.randomUUID();
        const created = createTenant({
          propertyId,
          name: "Trimmed",
          phone: "08123456789",
          email: "trimmed@test.com",
        });
        const tenantRepo = createMockTenantRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await service.createTenant(
          crypto.randomUUID(),
          propertyId,
          {
            name: "  Trimmed  ",
            phone: "  08123456789  ",
            email: "  trimmed@test.com  ",
          }
        );

        expect(tenantRepo.create).toHaveBeenCalledWith({
          propertyId,
          name: "Trimmed",
          phone: "08123456789",
          email: "trimmed@test.com",
        });
      });

      it("rejects when user has no property access", async () => {
        const tenantRepo = createMockTenantRepo();
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          propertyAccess
        );

        await expect(
          service.createTenant("user-1", "prop-1", {
            name: "John",
            phone: "08123456789",
            email: "john@example.com",
          })
        ).rejects.toThrow(/Forbidden/i);
      });
    });
  });

  describe("getTenant", () => {
    describe("good cases", () => {
      it("returns tenant when found and property matches", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1" });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.getTenant("user-1", propertyId, "t-1");

        expect(result).toEqual(tenant);
      });
    });

    describe("bad cases", () => {
      it("returns null when tenant not found", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.getTenant(
          "user-1",
          "prop-1",
          "non-existent"
        );

        expect(result).toBeNull();
        expect(tenantRepo.findById).toHaveBeenCalledWith("non-existent");
      });

      it("returns null when tenant belongs to another property", async () => {
        const tenant = createTenant({
          id: "t-1",
          propertyId: "other-property",
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.getTenant("user-1", "my-property", "t-1");

        expect(result).toBeNull();
        expect(result).not.toEqual(tenant);
      });
    });

    describe("edge cases", () => {
      it("returns tenant when propertyId matches", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1" });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.getTenant("user-1", propertyId, "t-1");

        expect(result?.id).toBe("t-1");
      });
    });
  });

  describe("listTenants", () => {
    describe("good cases", () => {
      it("returns tenants for property excluding moved-out by default", async () => {
        const propertyId = crypto.randomUUID();
        const tenants = [
          createTenant({ propertyId }),
          createTenant({ propertyId }),
        ];
        const tenantRepo = createMockTenantRepo({
          findByProperty: vi.fn().mockResolvedValue(tenants),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listTenants("user-1", propertyId);

        expect(result).toHaveLength(2);
        expect(tenantRepo.findByProperty).toHaveBeenCalledWith(propertyId, {
          includeMovedOut: false,
        });
      });
    });

    describe("bad cases", () => {
      it("returns empty array when property has no tenants", async () => {
        const tenantRepo = createMockTenantRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listTenants("user-1", "prop-1");

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });

    describe("edge cases", () => {
      it("passes includeMovedOut to repository when provided", async () => {
        const propertyId = crypto.randomUUID();
        const tenantRepo = createMockTenantRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await service.listTenants("user-1", propertyId, {
          includeMovedOut: true,
        });

        expect(tenantRepo.findByProperty).toHaveBeenCalledWith(propertyId, {
          includeMovedOut: true,
        });
      });
    });
  });

  describe("updateTenant", () => {
    describe("good cases", () => {
      it("updates tenant when data is valid (PROP 8)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({
          propertyId,
          id: "t-1",
          name: "Old Name",
        });
        const updated = createTenant({
          ...existing,
          name: "New Name",
          phone: "08999999999",
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.updateTenant(
          "user-1",
          propertyId,
          "t-1",
          { name: "New Name", phone: "08999999999" }
        );

        expect(result.name).toBe("New Name");
        expect(tenantRepo.update).toHaveBeenCalledWith("t-1", {
          name: "New Name",
          phone: "08999999999",
        });
      });

      it("updateTenant preserves id, createdAt, roomId (PROP 9)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({
          propertyId,
          id: "t-1",
          roomId: "room-1",
          createdAt: new Date("2025-01-01"),
        });
        const updated = createTenant({
          ...existing,
          name: "Updated",
          updatedAt: new Date("2025-01-02"),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.updateTenant(
          "user-1",
          propertyId,
          "t-1",
          { name: "Updated" }
        );

        expect(result.id).toBe("t-1");
        expect(result.roomId).toBe("room-1");
      });
    });

    describe("bad cases", () => {
      it("rejects update with invalid email (PROP 10)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1" });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.updateTenant("user-1", propertyId, "t-1", {
            email: "invalid-email",
          })
        ).rejects.toThrow(/email|invalid/i);
      });

      it("throws tenant not found when tenant does not exist", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.updateTenant("user-1", "prop-1", "missing", {
            name: "New",
          })
        ).rejects.toThrow(/not found/i);
      });
    });

    describe("edge cases", () => {
      it("allows partial update of single field", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1" });
        const updated = createTenant({ ...existing, phone: "08999999999" });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        const result = await service.updateTenant(
          "user-1",
          propertyId,
          "t-1",
          { phone: "08999999999" }
        );

        expect(result.phone).toBe("08999999999");
        expect(tenantRepo.update).toHaveBeenCalledWith("t-1", {
          name: undefined,
          phone: "08999999999",
          email: undefined,
        });
      });
    });
  });

  describe("assignRoom", () => {
    const roomIdUuid = "11111111-1111-4111-a111-111111111111";
    const otherRoomId = "22222222-2222-4222-a222-222222222222";

    describe("good cases", () => {
      it("assigns tenant to room and updates room status (PROP 4)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({
          propertyId,
          id: roomIdUuid,
          status: "available",
        });
        const assigned = createTenant({
          ...tenant,
          roomId: roomIdUuid,
          assignedAt: new Date(),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          assignRoom: vi.fn().mockResolvedValue(assigned),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
          updateStatus: vi.fn().mockResolvedValue({ ...room, status: "occupied" as RoomStatus }),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.assignRoom(
          "user-1",
          propertyId,
          "t-1",
          roomIdUuid
        );

        expect(result.roomId).toBe(roomIdUuid);
        expect(tenantRepo.assignRoom).toHaveBeenCalledWith("t-1", roomIdUuid);
        expect(roomRepo.updateStatus).toHaveBeenCalledWith(roomIdUuid, "occupied");
      });
    });

    describe("bad cases", () => {
      it("rejects assignRoom when room is occupied (PROP 5)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({
          propertyId,
          id: roomIdUuid,
          status: "occupied",
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", roomIdUuid)
        ).rejects.toThrow(/already occupied|occupied/i);
      });

      it("rejects when tenant already has a room", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: "t-1",
          roomId: otherRoomId,
        });
        const room = createRoom({ propertyId, id: roomIdUuid, status: "available" });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", roomIdUuid)
        ).rejects.toThrow(/already assigned/i);
      });

      it("rejects when room not found", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", roomIdUuid)
        ).rejects.toThrow(/room not found/i);
      });
    });

    describe("edge cases", () => {
      it("rejects when room belongs to another property", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({
          id: otherRoomId,
          propertyId: "other-property",
          status: "available",
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", otherRoomId)
        ).rejects.toThrow(/room not found/i);
      });
    });
  });

  describe("moveOut", () => {
    describe("good cases", () => {
      it("moveOut sets movedOutAt and frees room (PROP 11)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: "t-1",
          roomId: "room-1",
          movedOutAt: null,
        });
        const afterSoftDelete = createTenant({
          ...tenant,
          movedOutAt: new Date(),
          roomId: null,
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          removeRoomAssignment: vi.fn().mockResolvedValue({ ...tenant, roomId: null }),
          softDelete: vi.fn().mockResolvedValue(afterSoftDelete),
        });
        const roomRepo = createMockRoomRepo({
          updateStatus: vi.fn().mockResolvedValue({}),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.moveOut("user-1", propertyId, "t-1");

        expect(result.movedOutAt).toBeDefined();
        expect(tenantRepo.removeRoomAssignment).toHaveBeenCalledWith("t-1");
        expect(roomRepo.updateStatus).toHaveBeenCalledWith("room-1", "available");
        expect(tenantRepo.softDelete).toHaveBeenCalledWith("t-1");
      });

      it("moveOut without room only soft-deletes", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: "t-1",
          roomId: null,
        });
        const afterSoftDelete = createTenant({
          ...tenant,
          movedOutAt: new Date(),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          softDelete: vi.fn().mockResolvedValue(afterSoftDelete),
        });
        const roomRepo = createMockRoomRepo();
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.moveOut("user-1", propertyId, "t-1");

        expect(result.movedOutAt).toBeDefined();
        expect(tenantRepo.removeRoomAssignment).not.toHaveBeenCalled();
        expect(roomRepo.updateStatus).not.toHaveBeenCalled();
      });
    });

    describe("bad cases", () => {
      it("throws tenant not found when tenant does not exist", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.moveOut("user-1", "prop-1", "missing")
        ).rejects.toThrow(/not found/i);
      });
    });

    describe("edge cases", () => {
      it("rejects moveOut when tenant already moved out", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: "t-1",
          movedOutAt: new Date(),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.moveOut("user-1", propertyId, "t-1")
        ).rejects.toThrow(/already moved out/i);
      });
    });
  });
});

describe("property-based tests", () => {
  // Feature: tenant-room-basics, Property 1: Tenant Creation Completeness
  it("tenant creation returns complete object with ID and timestamp", () => {
    return fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          phone: fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
          email: fc
            .string({ unit: fc.constantFrom("a", "b", "x", "1", "2"), minLength: 1, maxLength: 15 })
            .map((local) => `${local}@example.com`),
        }, { noNullPrototype: true }),
        async (tenantData) => {
          const propertyId = crypto.randomUUID();
          const userId = crypto.randomUUID();
          const trimmed = {
            name: tenantData.name.trim(),
            phone: tenantData.phone.trim(),
            email: tenantData.email.trim(),
          };
          const created = createTenant({
            propertyId,
            ...trimmed,
          });
          const tenantRepo = createMockTenantRepo({
            create: vi.fn().mockResolvedValue(created),
          });
          const service = new TenantService(
            tenantRepo,
            createMockRoomRepo(),
            createMockPropertyAccess()
          );

          const result = await service.createTenant(userId, propertyId, {
            name: tenantData.name,
            phone: tenantData.phone,
            email: tenantData.email,
          });

          expect(result.id).toBeDefined();
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
          expect(result.name).toBe(trimmed.name);
          expect(result.phone).toBe(trimmed.phone);
          expect(result.email).toBe(trimmed.email);
        }
      ),
      { numRuns: 100 }
    );
  });
});
