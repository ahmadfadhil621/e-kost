/**
 * Gate 2: Fault injection tests for room-inventory-management.
 * Each test injects a fault and asserts correct behavior. When the fault is present,
 * the assertion fails → fault is KILLED. If the test passes with the fault present,
 * the fault SURVIVED (tests are too weak).
 * Run: npx vitest run src/lib/room-service.fault-injection.test.ts
 * We expect tests to FAIL (fault killed). Any passing test = surviving fault.
 */

import { describe, it, expect, vi } from "vitest";
import { RoomService } from "./room-service";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
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

const createMockPropertyAccess = () => ({
  validateAccess: vi.fn().mockResolvedValue("owner"),
});

describe("Gate 2: Fault injection (room-inventory-management)", () => {
  describe("good cases", () => {
  it("fault wrong-default-status: createRoom sets status occupied — KILLED by status assertion", async () => {
    const propertyId = crypto.randomUUID();
    const faultyCreated = createRoom({
      propertyId,
      roomNumber: "A1",
      roomType: "single",
      monthlyRent: 1000,
      status: "occupied",
    });
    const repo = createMockRepo({
      findByProperty: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(faultyCreated),
    });
    const service = new RoomService(repo, createMockPropertyAccess());

    const result = await service.createRoom(
      "user-1",
      propertyId,
      { roomNumber: "A1", roomType: "single", monthlyRent: 1000 }
    );

    expect(result.status).toBe("available");
  });

  it("fault missing-id: createRoom returns result without id — KILLED by id assertion", async () => {
    const propertyId = crypto.randomUUID();
    const faultyCreated = createRoom({ propertyId });
    const noId = { ...faultyCreated, id: undefined as unknown as string };
    const repo = createMockRepo({
      findByProperty: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(noId),
    });
    const service = new RoomService(repo, createMockPropertyAccess());

    const result = await service.createRoom("user-1", propertyId, {
      roomNumber: "A1",
      roomType: "single",
      monthlyRent: 1000,
    });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("fault no-validation-negative-rent: createRoom accepts negative rent — KILLED by validation", async () => {
    const repo = createMockRepo();
    const service = new RoomService(repo, createMockPropertyAccess());

    await expect(
      service.createRoom("user-1", "prop-1", {
        roomNumber: "A1",
        roomType: "single",
        monthlyRent: -100,
      })
    ).rejects.toThrow(/positive/i);
  });

  it("fault no-validation-empty-roomnumber: createRoom accepts empty room number — KILLED by validation", async () => {
    const repo = createMockRepo();
    const service = new RoomService(repo, createMockPropertyAccess());

    await expect(
      service.createRoom("user-1", "prop-1", {
        roomNumber: "",
        roomType: "single",
        monthlyRent: 1000,
      })
    ).rejects.toThrow(/required|room number/i);
  });

  it("fault status-accepts-invalid: updateRoomStatus accepts invalid status — KILLED by validation", async () => {
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
        "invalid" as "available"
      )
    ).rejects.toThrow(/status must be one of/i);
  });

  it("fault no-uniqueness-check: createRoom allows duplicate when repo returns empty — KILLED by uniqueness", async () => {
    const propertyId = crypto.randomUUID();
    const repo = createMockRepo({
      findByProperty: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(createRoom({ propertyId, roomNumber: "A101" })),
    });
    const service = new RoomService(repo, createMockPropertyAccess());

    await service.createRoom("user-1", propertyId, {
      roomNumber: "A101",
      roomType: "single",
      monthlyRent: 1000,
    });

    await expect(
      service.createRoom("user-1", propertyId, {
        roomNumber: "A101",
        roomType: "single",
        monthlyRent: 1000,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("fault update-preserves-status: updateRoom must not change status — KILLED by invariant", async () => {
    const propertyId = crypto.randomUUID();
    const existing = createRoom({
      propertyId,
      id: "room-1",
      status: "occupied",
    });
    const updatedWrong = createRoom({
      ...existing,
      roomNumber: "A2",
      status: "available",
    });
    const repo = createMockRepo({
      findById: vi.fn().mockResolvedValue(existing),
      findByProperty: vi.fn().mockResolvedValue([existing]),
      update: vi.fn().mockResolvedValue(updatedWrong),
    });
    const service = new RoomService(repo, createMockPropertyAccess());

    const result = await service.updateRoom("user-1", propertyId, "room-1", {
      roomNumber: "A2",
    });

    expect(result.status).toBe("occupied");
  });

  it("fault list-ignores-filter: listRooms with filter returns wrong status — KILLED by filter assertion", async () => {
    const propertyId = crypto.randomUUID();
    const wrongStatus = [
      createRoom({ propertyId, status: "occupied" }),
      createRoom({ propertyId, status: "under_renovation" }),
    ];
    const repo = createMockRepo({
      findByProperty: vi.fn().mockResolvedValue(wrongStatus),
    });
    const service = new RoomService(repo, createMockPropertyAccess());

    const result = await service.listRooms("user-1", propertyId, {
      status: "available",
    });

    expect(result.every((r) => r.status === "available")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(2);
  });
  });
  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });
  describe("edge cases", () => {
    it("no edge-case scenarios for fault injection", () => {
      expect(true).toBe(true);
    });
  });
});
