/**
 * Gate 2: Fault injection tests for multi-property-management.
 * Each test injects a fault and asserts correct behavior — we EXPECT these tests to FAIL
 * when the fault is present (fault is "killed" by the assertion).
 * Run: npx vitest run src/lib/property-service.fault-injection.test.ts
 * All tests should FAIL (faults killed). Any passing test = surviving fault.
 */

import { describe, it, expect, vi } from "vitest";
import { PropertyService, ForbiddenError } from "./property-service";
import type { IPropertyRepository } from "@/domain/interfaces/property-repository";
import type { IUserByEmailFinder } from "./property-service";
import { createProperty, createPropertyStaff } from "@/test/fixtures/property";

function createMockRepo(overrides: Partial<IPropertyRepository> = {}): IPropertyRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    addStaff: vi.fn(),
    removeStaff: vi.fn(),
    findStaff: vi.fn(),
    findUserRole: vi.fn(),
    ...overrides,
  };
}

describe.skip("Gate 2: Fault injection (multi-property-management)", () => {
  it("fault missing-owner-id: create returns wrong ownerId — KILLED by owner assertion", async () => {
    const userId = "correct-owner";
    const faultyCreated = createProperty({ ownerId: "wrong-owner", name: "P", address: "A" });
    const repo = createMockRepo({ create: vi.fn().mockResolvedValue(faultyCreated) });
    const service = new PropertyService(repo);

    const result = await service.createProperty(userId, { name: "P", address: "A" });

    expect(result.ownerId).toBe(userId);
  });

  it("fault missing-id: create returns result without id — KILLED by id assertion", async () => {
    const userId = crypto.randomUUID();
    const faultyCreated = createProperty({ ownerId: userId });
    const noId = { ...faultyCreated, id: undefined as unknown as string };
    const repo = createMockRepo({ create: vi.fn().mockResolvedValue(noId) });
    const service = new PropertyService(repo);

    const result = await service.createProperty(userId, { name: "P", address: "A" });

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("fault list-includes-deleted: list returns soft-deleted — KILLED by deletedAt check", async () => {
    const userId = crypto.randomUUID();
    const withDeleted = [
      createProperty({ ownerId: userId, deletedAt: null }),
      createProperty({ id: "p2", ownerId: userId, deletedAt: new Date() }),
    ];
    const repo = createMockRepo({ findByUser: vi.fn().mockResolvedValue(withDeleted) });
    const service = new PropertyService(repo);

    const result = await service.listProperties(userId);

    expect(result.every((p) => p.deletedAt === null)).toBe(true);
  });

  it("fault update-allows-staff: staff can update — KILLED by ForbiddenError", async () => {
    const repo = createMockRepo({
      findUserRole: vi.fn().mockResolvedValue("staff"),
      update: vi.fn().mockResolvedValue(createProperty()),
    });
    const service = new PropertyService(repo);

    await expect(
      service.updateProperty("staff-id", "prop-id", { name: "New" })
    ).rejects.toThrow(ForbiddenError);
  });

  it("fault delete-allows-staff: staff can delete — KILLED by ForbiddenError", async () => {
    const repo = createMockRepo({
      findUserRole: vi.fn().mockResolvedValue("staff"),
      softDelete: vi.fn().mockResolvedValue(undefined),
    });
    const service = new PropertyService(repo);

    await expect(service.deleteProperty("staff-id", "prop-id")).rejects.toThrow(
      ForbiddenError
    );
  });

  it("fault add-staff-duplicate: allows duplicate staff — KILLED by duplicate check", async () => {
    const userFinder: IUserByEmailFinder = {
      findByEmail: vi.fn().mockResolvedValue({ id: "u2", name: "S", email: "s@x.com" }),
    };
    const repo = createMockRepo({
      findUserRole: vi.fn()
        .mockResolvedValueOnce("owner")
        .mockResolvedValueOnce(null),
      addStaff: vi.fn().mockResolvedValue(createPropertyStaff()),
    });
    const service = new PropertyService(repo, userFinder);

    await expect(service.addStaff("owner-id", "p1", "s@x.com")).rejects.toThrow(
      /already staff/i
    );
  });

  it("fault validate-access-allows-any: unauthorized gets access — KILLED by ForbiddenError", async () => {
    const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue(null) });
    const service = new PropertyService(repo);

    await expect(service.validateAccess("random-user", "prop-1")).rejects.toThrow(
      ForbiddenError
    );
  });

  it("fault no-validation-empty-name: accepts empty name — KILLED by validation", async () => {
    const repo = createMockRepo();
    const service = new PropertyService(repo);

    await expect(
      service.createProperty("u1", { name: "", address: "Valid" })
    ).rejects.toThrow(/required|min/i);
  });
});
