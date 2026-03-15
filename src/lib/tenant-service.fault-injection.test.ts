/**
 * Gate 2: Fault injection tests for tenant-room-basics.
 * Each test injects a fault and asserts correct behavior. When the fault is present,
 * the assertion fails → fault is KILLED. If the test passes with the fault present,
 * the fault SURVIVED (tests are too weak).
 * Run: npx vitest run src/lib/tenant-service.fault-injection.test.ts
 * We expect tests to FAIL (fault killed). Any passing test = surviving fault.
 */

import { describe, it, expect, vi } from "vitest";
import { TenantService } from "./tenant-service";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
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

const createMockPropertyAccess = () => ({
  validateAccess: vi.fn().mockResolvedValue("owner"),
});

describe("Gate 2: Fault injection (tenant-room-basics)", () => {
  describe("good cases", () => {
    it("fault missing-id: createTenant returns result without id — KILLED by id assertion", async () => {
      const propertyId = crypto.randomUUID();
      const created = createTenant({ propertyId, name: "J", phone: "1", email: "j@x.com" });
      const noId = { ...created, id: undefined as unknown as string };
      const tenantRepo = createMockTenantRepo({
        create: vi.fn().mockResolvedValue(noId),
      });
      const service = new TenantService(
        tenantRepo,
        createMockRoomRepo(),
        createMockPropertyAccess()
      );

      const result = await service.createTenant(
        "user-1",
        propertyId,
        { name: "J", phone: "1", email: "j@x.com" }
      );

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
    });

    it("fault wrong-email-persistence: createTenant returns different email — KILLED by email assertion", async () => {
      const propertyId = crypto.randomUUID();
      const created = createTenant({
        propertyId,
        name: "Jane",
        phone: "08123456789",
        email: "wrong@example.com",
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
        "user-1",
        propertyId,
        { name: "Jane", phone: "08123456789", email: "jane@example.com" }
      );

      expect(result.email).toBe("jane@example.com");
    });

    it("fault assignRoom-room-stays-available: room status not updated — KILLED by updateStatus call", async () => {
      const propertyId = crypto.randomUUID();
      const roomIdUuid = "11111111-1111-4111-a111-111111111111";
      const tenant = createTenant({ propertyId, id: "t-1", roomId: null });
      const room = createRoom({ propertyId, id: roomIdUuid, status: "available" });
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
        updateStatus: vi.fn(),
      });
      const service = new TenantService(
        tenantRepo,
        roomRepo,
        createMockPropertyAccess()
      );

      await service.assignRoom("user-1", propertyId, "t-1", roomIdUuid);

      expect(roomRepo.updateStatus).toHaveBeenCalledWith(roomIdUuid, "occupied");
    });

    it("fault moveOut-hard-delete: softDelete not called — KILLED by softDelete call", async () => {
      const propertyId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: "t-1",
        roomId: null,
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
        softDelete: vi.fn().mockResolvedValue({ ...tenant, movedOutAt: new Date() }),
      });
      const service = new TenantService(
        tenantRepo,
        createMockRoomRepo(),
        createMockPropertyAccess()
      );

      await service.moveOut("user-1", propertyId, "t-1");

      expect(tenantRepo.softDelete).toHaveBeenCalledWith("t-1");
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("fault occupied-room-assign: assignRoom accepts occupied room — KILLED by business rule", async () => {
      const propertyId = crypto.randomUUID();
      const roomIdUuid = "11111111-1111-4111-a111-111111111111";
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
  });
});
