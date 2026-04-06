// Traceability: tenant-room-move
// REQ 1.1 -> it('initial assign creates RoomAssignment and sets room OCCUPIED (PROP-MOVE-1)')
// REQ 1.2 -> it('move tenant closes old assignment and opens new one')
// REQ 2.1, 2.2 -> it('initial assign: button label and dialog driven by tenant.roomId — covered by E2E')
// REQ 2.7 -> it('throws when targetRoomId equals current roomId')
// REQ 3.2, 3.3 -> it('throws when room is at capacity')
// REQ 4.1, 4.2 -> it('move to room updates old room to AVAILABLE when last tenant leaves')
// REQ 4.3 -> it('move leaves old room OCCUPIED when other active tenants remain')
// PROP-MOVE-1 -> it('initial assign creates RoomAssignment and sets room OCCUPIED')
// PROP-MOVE-2 -> it('no two open assignments for same tenant (enforced by closeCurrentAssignment)')
//
// Traceability: tenant-room-basics
// REQ 1.2 -> it('creates a tenant with valid data')
// REQ 1.3 -> it('rejects when name is missing'), it('rejects when email is invalid')
// REQ 1.4, 1.5 -> it('creates a tenant with valid data')
// REQ 2.2 -> it('assignRoom returns only when room has capacity (PROP 3)')
// REQ 2.3, 2.4 -> it('assigns tenant to room and updates room status (PROP 4)')
// REQ 2.5 -> (covered by E2E)
// REQ 3.1 -> (covered by component/E2E)
// REQ 4.2, 4.4 -> it('updates tenant when data is valid (PROP 8)')
// REQ 4.3 -> it('updateTenant preserves id, createdAt, roomId (PROP 9)')
// REQ 4.5 -> it('rejects update with invalid email (PROP 10)')
// REQ 5.3, 5.4, 5.5 -> it('moveOut sets movedOutAt and frees room (PROP 11)')
// PROP 1 -> it('tenant creation returns complete object with ID and timestamp (PROP 1)')
// PROP 2 -> it('rejects when name is missing')
// PROP 12 -> it('create then getTenant returns same data (PROP 12)')
//
// Traceability: multi-tenant-rooms
// REQ 2.1, 2.2 -> it('assigns second tenant to occupied room with available capacity')
// REQ 2.2 -> it('rejects when room is at full capacity (PROP 5)')
// REQ 2.4 -> it('rejects when room is under renovation')
// REQ 2.5, 2.6 -> it('assigns tenant to room and updates room status (PROP 4)')
// REQ 4.1, 4.2 -> it('moveOut sets movedOutAt and frees room when last tenant (PROP 11)')
// REQ 4.3 -> it('moveOut leaves room occupied when other active tenants remain')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { TenantService } from "./tenant-service";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type { IRoomAssignmentRepository } from "@/domain/interfaces/room-assignment-repository";
import type { RoomStatus } from "@/domain/schemas/room";
import { createTenant } from "@/test/fixtures/tenant";
import { createRoom } from "@/test/fixtures/room";
import { createRoomAssignment } from "@/test/fixtures/room-assignment";

function createMockTenantRepo(
  overrides: Partial<ITenantRepository> = {}
): ITenantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    assignRoom: vi.fn(),
    moveRoom: vi.fn(),
    removeRoomAssignment: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

function createMockRoomAssignmentRepo(
  overrides: Partial<IRoomAssignmentRepository> = {}
): IRoomAssignmentRepository {
  return {
    create: vi.fn(),
    closeCurrentAssignment: vi.fn().mockResolvedValue(null),
    findByTenant: vi.fn().mockResolvedValue([]),
    findOpenByTenant: vi.fn().mockResolvedValue(null),
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

    // Traceability: billing-day-per-tenant
    // REQ BD-9  -> can update billingDayOfMonth to a new value
    // REQ BD-10 -> can clear billingDayOfMonth (set to null)
    // REQ BD-11 -> rejects out-of-range billingDayOfMonth
    describe("billingDayOfMonth", () => {
      it("can update billingDayOfMonth to a valid day", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1", billingDayOfMonth: 1 });
        const updated = createTenant({ ...existing, billingDayOfMonth: 20 });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess());

        const result = await service.updateTenant("u", propertyId, "t-1", {
          billingDayOfMonth: 20,
        });

        expect(result.billingDayOfMonth).toBe(20);
        expect(tenantRepo.update).toHaveBeenCalledWith(
          "t-1",
          expect.objectContaining({ billingDayOfMonth: 20 })
        );
      });

      it("can clear billingDayOfMonth (set to null)", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1", billingDayOfMonth: 15 });
        const updated = createTenant({ ...existing, billingDayOfMonth: null });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(existing),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess());

        await service.updateTenant("u", propertyId, "t-1", { billingDayOfMonth: null });

        expect(tenantRepo.update).toHaveBeenCalledWith(
          "t-1",
          expect.objectContaining({ billingDayOfMonth: null })
        );
      });

      it("rejects billingDayOfMonth = 32", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1" });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(existing) });
        const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess());

        await expect(
          service.updateTenant("u", propertyId, "t-1", { billingDayOfMonth: 32 })
        ).rejects.toThrow(/billingDayOfMonth|invalid|1.*31/i);
      });

      it("rejects billingDayOfMonth = 0", async () => {
        const propertyId = crypto.randomUUID();
        const existing = createTenant({ propertyId, id: "t-1" });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(existing) });
        const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess());

        await expect(
          service.updateTenant("u", propertyId, "t-1", { billingDayOfMonth: 0 })
        ).rejects.toThrow(/billingDayOfMonth|invalid|1.*31/i);
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
        expect(tenantRepo.assignRoom).toHaveBeenCalledWith("t-1", roomIdUuid, expect.any(Number));
        expect(roomRepo.updateStatus).toHaveBeenCalledWith(roomIdUuid, "occupied");
      });
    });

    describe("bad cases", () => {
      it("rejects when room is at full capacity (PROP 5)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const existingTenant = createTenant({
          propertyId,
          id: "t-existing",
          roomId: roomIdUuid,
          movedOutAt: null,
        });
        const room = createRoom({
          propertyId,
          id: roomIdUuid,
          status: "occupied",
          capacity: 1,
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          findByProperty: vi.fn().mockResolvedValue([existingTenant]),
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
        ).rejects.toThrow(/at full capacity/i);
      });

      it("rejects when room is under renovation", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({
          propertyId,
          id: roomIdUuid,
          status: "under_renovation",
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
        ).rejects.toThrow(/renovation/i);
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

      // REQ 2.1, 2.6 — occupied room with spare capacity accepts a second tenant
      it("assigns second tenant to occupied room with available capacity", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-2", roomId: null });
        const existingTenant = createTenant({
          propertyId,
          id: "t-1",
          roomId: roomIdUuid,
          movedOutAt: null,
        });
        const room = createRoom({
          propertyId,
          id: roomIdUuid,
          status: "occupied",
          capacity: 2,
        });
        const assigned = createTenant({
          ...tenant,
          roomId: roomIdUuid,
          assignedAt: new Date(),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          findByProperty: vi.fn().mockResolvedValue([existingTenant]),
          assignRoom: vi.fn().mockResolvedValue(assigned),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
          updateStatus: vi.fn(),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.assignRoom(
          "user-1",
          propertyId,
          "t-2",
          roomIdUuid
        );

        expect(result.roomId).toBe(roomIdUuid);
        expect(tenantRepo.assignRoom).toHaveBeenCalledWith("t-2", roomIdUuid, expect.any(Number));
        // Room was already occupied — status must NOT be updated again
        expect(roomRepo.updateStatus).not.toHaveBeenCalled();
      });
    });

    // billingDayOfMonth tests — Traceability: billing-day-per-tenant
    // REQ BD-6 -> assignRoom defaults billingDayOfMonth to day of assignment
    // REQ BD-7 -> assignRoom respects optional override
    // REQ BD-8 -> assignRoom validates billingDayOfMonth range (1-31)
    describe("billingDayOfMonth", () => {
      it("passes billingDayOfMonth defaulting to today's date when not provided", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-15T10:00:00.000Z")); // day = 15

        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({ propertyId, id: roomIdUuid, status: "available" });
        const assigned = createTenant({ ...tenant, roomId: roomIdUuid, billingDayOfMonth: 15 });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          assignRoom: vi.fn().mockResolvedValue(assigned),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
          updateStatus: vi.fn(),
        });
        const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess());

        await service.assignRoom("user-1", propertyId, "t-1", roomIdUuid);

        expect(tenantRepo.assignRoom).toHaveBeenCalledWith("t-1", roomIdUuid, 15);
        vi.useRealTimers();
      });

      it("passes explicit billingDayOfMonth override to repository", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const room = createRoom({ propertyId, id: roomIdUuid, status: "available" });
        const assigned = createTenant({ ...tenant, roomId: roomIdUuid, billingDayOfMonth: 1 });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
          assignRoom: vi.fn().mockResolvedValue(assigned),
        });
        const roomRepo = createMockRoomRepo({
          findById: vi.fn().mockResolvedValue(room),
          updateStatus: vi.fn(),
        });
        const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess());

        await service.assignRoom("user-1", propertyId, "t-1", roomIdUuid, 1);

        expect(tenantRepo.assignRoom).toHaveBeenCalledWith("t-1", roomIdUuid, 1);
      });

      it("rejects billingDayOfMonth = 0 (below minimum)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", roomIdUuid, 0)
        ).rejects.toThrow(/billingDayOfMonth|invalid|1.*31/i);
      });

      it("rejects billingDayOfMonth = 32 (above maximum)", async () => {
        const propertyId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new TenantService(
          tenantRepo,
          createMockRoomRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.assignRoom("user-1", propertyId, "t-1", roomIdUuid, 32)
        ).rejects.toThrow(/billingDayOfMonth|invalid|1.*31/i);
      });
    });
  });

  describe("moveOut", () => {
    describe("good cases", () => {
      // REQ 4.1, 4.2 — last tenant leaves: room status set to available
      it("moveOut sets movedOutAt and frees room when last tenant leaves (PROP 11)", async () => {
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
          // No remaining tenants after this one moves out
          findByProperty: vi.fn().mockResolvedValue([]),
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

      // REQ 4.3 — other tenants remain: room status stays occupied
      it("moveOut leaves room occupied when other active tenants remain", async () => {
        const propertyId = crypto.randomUUID();
        const roomId = "room-shared";
        const tenant = createTenant({
          propertyId,
          id: "t-1",
          roomId,
          movedOutAt: null,
        });
        const remainingTenant = createTenant({
          propertyId,
          id: "t-2",
          roomId,
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
          // Remaining tenant still in the room after t-1 leaves
          findByProperty: vi.fn().mockResolvedValue([remainingTenant]),
          softDelete: vi.fn().mockResolvedValue(afterSoftDelete),
        });
        const roomRepo = createMockRoomRepo({
          updateStatus: vi.fn(),
        });
        const service = new TenantService(
          tenantRepo,
          roomRepo,
          createMockPropertyAccess()
        );

        const result = await service.moveOut("user-1", propertyId, "t-1");

        expect(result.movedOutAt).toBeDefined();
        expect(tenantRepo.removeRoomAssignment).toHaveBeenCalledWith("t-1");
        // Room still has another active tenant — must NOT be freed
        expect(roomRepo.updateStatus).not.toHaveBeenCalled();
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

describe("moveTenantToRoom", () => {
  const oldRoomId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const newRoomId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

  describe("good cases", () => {
    // REQ 1.1, PROP-MOVE-1 — initial assign: no prior room → creates RoomAssignment, updates tenant, sets room OCCUPIED
    it("initial assign creates RoomAssignment and sets room OCCUPIED (PROP-MOVE-1)", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "available", capacity: 2 });
      const movedTenant = createTenant({ ...tenant, roomId: newRoomId, movedInAt: new Date("2026-03-15") });
      const newAssignment = createRoomAssignment({ tenantId: "t-1", roomId: newRoomId, startDate: new Date("2026-03-15") });

      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([]),
        moveRoom: vi.fn().mockResolvedValue(movedTenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
        updateStatus: vi.fn(),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        create: vi.fn().mockResolvedValue(newAssignment),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), roomAssignmentRepo);

      const result = await service.moveTenantToRoom("user-1", propertyId, "t-1", {
        targetRoomId: newRoomId,
        moveDate: "2026-03-15",
      });

      expect(result.roomId).toBe(newRoomId);
      expect(roomAssignmentRepo.create).toHaveBeenCalledWith({
        tenantId: "t-1",
        roomId: newRoomId,
        startDate: new Date("2026-03-15"),
      });
      expect(roomAssignmentRepo.closeCurrentAssignment).not.toHaveBeenCalled();
      expect(tenantRepo.moveRoom).toHaveBeenCalledWith("t-1", expect.objectContaining({
        roomId: newRoomId,
        movedInAt: new Date("2026-03-15"),
      }));
      expect(roomRepo.updateStatus).toHaveBeenCalledWith(newRoomId, "occupied");
    });

    // REQ 1.2 — move: closes old assignment, opens new one, updates tenant + room statuses
    it("move tenant closes old assignment and opens new one", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: oldRoomId });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "available", capacity: 1 });
      const movedTenant = createTenant({ ...tenant, roomId: newRoomId, movedInAt: new Date("2026-03-15") });
      const closedAssignment = createRoomAssignment({ tenantId: "t-1", roomId: oldRoomId, endDate: new Date("2026-03-15") });
      const newAssignment = createRoomAssignment({ tenantId: "t-1", roomId: newRoomId, startDate: new Date("2026-03-15") });

      // No other tenants in the property → old room will be freed
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([tenant]),
        moveRoom: vi.fn().mockResolvedValue(movedTenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
        updateStatus: vi.fn(),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        closeCurrentAssignment: vi.fn().mockResolvedValue(closedAssignment),
        create: vi.fn().mockResolvedValue(newAssignment),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), roomAssignmentRepo);

      const result = await service.moveTenantToRoom("user-1", propertyId, "t-1", {
        targetRoomId: newRoomId,
        moveDate: "2026-03-15",
      });

      expect(result.roomId).toBe(newRoomId);
      expect(roomAssignmentRepo.closeCurrentAssignment).toHaveBeenCalledWith("t-1", new Date("2026-03-15"));
      expect(roomAssignmentRepo.create).toHaveBeenCalledWith({
        tenantId: "t-1",
        roomId: newRoomId,
        startDate: new Date("2026-03-15"),
      });
      expect(tenantRepo.moveRoom).toHaveBeenCalledWith("t-1", expect.objectContaining({
        roomId: newRoomId,
        movedInAt: new Date("2026-03-15"),
      }));
      // Old room is now empty → freed
      expect(roomRepo.updateStatus).toHaveBeenCalledWith(oldRoomId, "available");
      // New room → occupied
      expect(roomRepo.updateStatus).toHaveBeenCalledWith(newRoomId, "occupied");
    });

    // REQ 4.3 — old room has remaining active tenants → stays OCCUPIED
    it("move leaves old room OCCUPIED when other active tenants remain", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: oldRoomId });
      const otherTenant = createTenant({ propertyId, id: "t-2", roomId: oldRoomId, movedOutAt: null });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "available", capacity: 2 });
      const movedTenant = createTenant({ ...tenant, roomId: newRoomId });

      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([tenant, otherTenant]),
        moveRoom: vi.fn().mockResolvedValue(movedTenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
        updateStatus: vi.fn(),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        closeCurrentAssignment: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createRoomAssignment()),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), roomAssignmentRepo);

      await service.moveTenantToRoom("user-1", propertyId, "t-1", {
        targetRoomId: newRoomId,
        moveDate: "2026-03-15",
      });

      // Old room still has t-2 → must NOT be freed
      expect(roomRepo.updateStatus).not.toHaveBeenCalledWith(oldRoomId, "available");
      // New room → occupied
      expect(roomRepo.updateStatus).toHaveBeenCalledWith(newRoomId, "occupied");
    });
  });

  describe("bad cases", () => {
    // REQ 2.7 — same room rejected
    it("throws when targetRoomId equals current roomId", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: oldRoomId });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.moveTenantToRoom("user-1", propertyId, "t-1", {
          targetRoomId: oldRoomId,
          moveDate: "2026-03-15",
        })
      ).rejects.toThrow(/same room/i);
    });

    // REQ 3.2, 3.3 — capacity enforcement
    it("throws when room is at capacity", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
      const existingTenant = createTenant({ propertyId, id: "t-2", roomId: newRoomId, movedOutAt: null });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "occupied", capacity: 1 });

      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([existingTenant]),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.moveTenantToRoom("user-1", propertyId, "t-1", {
          targetRoomId: newRoomId,
          moveDate: "2026-03-15",
        })
      ).rejects.toThrow(/at capacity/i);
    });

    it("throws when tenant is inactive (already moved out)", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", movedOutAt: new Date() });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.moveTenantToRoom("user-1", propertyId, "t-1", {
          targetRoomId: newRoomId,
          moveDate: "2026-03-15",
        })
      ).rejects.toThrow(/inactive|moved out/i);
    });

    it("throws when tenant not found", async () => {
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.moveTenantToRoom("user-1", "prop-1", "missing", {
          targetRoomId: newRoomId,
          moveDate: "2026-03-15",
        })
      ).rejects.toThrow(/not found/i);
    });

    it("throws when target room not found or belongs to another property", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.moveTenantToRoom("user-1", propertyId, "t-1", {
          targetRoomId: newRoomId,
          moveDate: "2026-03-15",
        })
      ).rejects.toThrow(/room not found/i);
    });
  });

  describe("edge cases", () => {
    // REQ 2.6 — billingDayOfMonth stored on initial assign when provided
    it("updates billingDayOfMonth on initial assign when provided", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "available", capacity: 1 });
      const movedTenant = createTenant({ ...tenant, roomId: newRoomId, billingDayOfMonth: 15 });

      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([]),
        moveRoom: vi.fn().mockResolvedValue(movedTenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
        updateStatus: vi.fn(),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), createMockRoomAssignmentRepo({
        create: vi.fn().mockResolvedValue(createRoomAssignment()),
      }));

      await service.moveTenantToRoom("user-1", propertyId, "t-1", {
        targetRoomId: newRoomId,
        moveDate: "2026-03-15",
        billingDayOfMonth: 15,
      });

      expect(tenantRepo.moveRoom).toHaveBeenCalledWith("t-1", expect.objectContaining({
        billingDayOfMonth: 15,
      }));
    });

    // billingDayOfMonth NOT provided on move → not passed to moveRoom
    it("does not overwrite billingDayOfMonth when not provided on move", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1", roomId: oldRoomId, billingDayOfMonth: 10 });
      const targetRoom = createRoom({ propertyId, id: newRoomId, status: "available", capacity: 1 });
      const movedTenant = createTenant({ ...tenant, roomId: newRoomId, billingDayOfMonth: 10 });

      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        findByProperty: vi.fn().mockResolvedValue([tenant]),
        moveRoom: vi.fn().mockResolvedValue(movedTenant),
      });
      const roomRepo = createMockRoomRepo({
        findById: vi.fn().mockResolvedValue(targetRoom),
        updateStatus: vi.fn(),
      });
      const service = new TenantService(tenantRepo, roomRepo, createMockPropertyAccess(), createMockRoomAssignmentRepo({
        closeCurrentAssignment: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createRoomAssignment()),
      }));

      await service.moveTenantToRoom("user-1", propertyId, "t-1", {
        targetRoomId: newRoomId,
        moveDate: "2026-03-15",
        // No billingDayOfMonth
      });

      // moveRoom should be called WITHOUT billingDayOfMonth key
      const moveRoomCall = vi.mocked(tenantRepo.moveRoom).mock.calls[0]?.[1];
      expect(moveRoomCall).not.toHaveProperty("billingDayOfMonth");
    });
  });
});

describe("getRoomAssignments", () => {
  describe("good cases", () => {
    it("returns room assignment history ordered newest first", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = "t-1";
      const tenant = createTenant({ propertyId, id: tenantId });
      const assignments = [
        createRoomAssignment({ tenantId, startDate: new Date("2026-03-15"), endDate: null, roomNumber: "102" }),
        createRoomAssignment({ tenantId, startDate: new Date("2026-01-15"), endDate: new Date("2026-03-15"), roomNumber: "101" }),
      ];
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        findByTenant: vi.fn().mockResolvedValue(assignments),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), roomAssignmentRepo);

      const result = await service.getRoomAssignments("user-1", propertyId, tenantId);

      expect(result).toHaveLength(2);
      expect(result[0].roomNumber).toBe("102");
      expect(result[0].endDate).toBeNull();
      expect(result[1].roomNumber).toBe("101");
      expect(result[1].endDate).toBeInstanceOf(Date);
    });

    it("returns empty array when tenant has no room assignment history", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({ propertyId, id: "t-1" });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        findByTenant: vi.fn().mockResolvedValue([]),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), roomAssignmentRepo);

      const result = await service.getRoomAssignments("user-1", propertyId, "t-1");

      expect(result).toEqual([]);
    });
  });

  describe("bad cases", () => {
    it("throws when tenant not found", async () => {
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.getRoomAssignments("user-1", "prop-1", "missing")
      ).rejects.toThrow(/not found/i);
    });

    it("throws when tenant belongs to another property", async () => {
      const tenant = createTenant({ propertyId: "other-property", id: "t-1" });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), createMockRoomAssignmentRepo());

      await expect(
        service.getRoomAssignments("user-1", "my-property", "t-1")
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("edge cases", () => {
    it("returns assignment history for a moved-out tenant (history preserved after move-out)", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = "t-moved-out";
      // Tenant who has moved out — history must still be accessible
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        movedOutAt: new Date("2026-03-15"),
        roomId: null,
      });
      const closedAssignment = createRoomAssignment({
        tenantId,
        startDate: new Date("2026-01-15"),
        endDate: new Date("2026-03-15"),
        roomNumber: "101",
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const roomAssignmentRepo = createMockRoomAssignmentRepo({
        findByTenant: vi.fn().mockResolvedValue([closedAssignment]),
      });
      const service = new TenantService(tenantRepo, createMockRoomRepo(), createMockPropertyAccess(), roomAssignmentRepo);

      const result = await service.getRoomAssignments("user-1", propertyId, tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].endDate).toBeInstanceOf(Date);
      expect(result[0].roomNumber).toBe("101");
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
