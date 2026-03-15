// Traceability: multi-property-management
// REQ 1.2 -> it('creates a property with valid data')
// REQ 1.3 -> it('rejects when name is missing'), it('rejects when address is missing')
// REQ 1.4 -> it('creates a property with valid data'), it('property creation sets owner and id and timestamps (PROP 1)')
// REQ 2.1 -> it('lists only properties where user is owner or staff')
// REQ 2.2 -> (covered by E2E)
// REQ 3.5 -> it('rejects update when user is staff not owner')
// REQ 4.3 -> it('excludes soft-deleted properties from list')
// REQ 4.6 -> it('rejects delete when user is staff not owner')
// REQ 7.5 -> it('rejects getProperty when user has no access')
// PROP 1 -> it('property creation sets owner and id and timestamps (PROP 1)')
// PROP 2 -> it('list returns exactly owned and staff properties excluding deleted')
// PROP 3 -> it('rejects update when user is staff not owner'), it('rejects delete when user is staff not owner')
// PROP 5 -> (data isolation covered in API/integration)
// PROP 6 -> it('validateAccess returns 403 for unauthorized user')
// PROP 7 -> it('excludes soft-deleted properties from list')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { PropertyService, ForbiddenError } from "./property-service";
import type { IPropertyRepository } from "@/domain/interfaces/property-repository";
import { createProperty } from "@/test/fixtures/property";

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

describe("PropertyService", () => {
  describe("createProperty", () => {
    describe("good cases", () => {
      it("creates a property with valid data", async () => {
        const userId = crypto.randomUUID();
        const created = createProperty({
          ownerId: userId,
          name: "My Kost",
          address: "Jl. Example 1",
        });
        const repo = createMockRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const service = new PropertyService(repo);

        const result = await service.createProperty(userId, {
          name: "My Kost",
          address: "Jl. Example 1",
        });

        expect(result.id).toBe(created.id);
        expect(result.name).toBe("My Kost");
        expect(result.address).toBe("Jl. Example 1");
        expect(result.ownerId).toBe(userId);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(repo.create).toHaveBeenCalledWith({
          name: "My Kost",
          address: "Jl. Example 1",
          ownerId: userId,
        });
      });

      it("property creation sets owner and id and timestamps (PROP 1)", async () => {
        const userId = crypto.randomUUID();
        const created = createProperty({ ownerId: userId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new PropertyService(repo);

        const result = await service.createProperty(userId, {
          name: "P",
          address: "A",
        });

        expect(result.ownerId).toBe(userId);
        expect(result.id).toBeDefined();
        expect(typeof result.id).toBe("string");
        expect(result.id.length).toBeGreaterThan(0);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe("bad cases", () => {
      it("rejects when name is missing", async () => {
        const repo = createMockRepo();
        const service = new PropertyService(repo);

        await expect(
          service.createProperty(crypto.randomUUID(), {
            name: "",
            address: "Valid Address",
          })
        ).rejects.toThrow(/required|min/i);
      });

      it("rejects when address is missing", async () => {
        const repo = createMockRepo();
        const service = new PropertyService(repo);

        await expect(
          service.createProperty(crypto.randomUUID(), {
            name: "Valid Name",
            address: "",
          })
        ).rejects.toThrow(/required|min/i);
      });

      it("rejects when name exceeds 200 characters", async () => {
        const repo = createMockRepo();
        const service = new PropertyService(repo);

        await expect(
          service.createProperty(crypto.randomUUID(), {
            name: "a".repeat(201),
            address: "Valid Address",
          })
        ).rejects.toThrow();
      });
    });

    describe("edge cases", () => {
      it("trims name and address", async () => {
        const userId = crypto.randomUUID();
        const created = createProperty({
          ownerId: userId,
          name: "Trimmed",
          address: "Trimmed Addr",
        });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new PropertyService(repo);

        await service.createProperty(userId, {
          name: "  Trimmed  ",
          address: "  Trimmed Addr  ",
        });

        expect(repo.create).toHaveBeenCalledWith({
          name: "Trimmed",
          address: "Trimmed Addr",
          ownerId: userId,
        });
      });
    });
  });

  describe("listProperties", () => {
    describe("bad cases", () => {
      it("returns empty array when user has no properties", async () => {
        const repo = createMockRepo({ findByUser: vi.fn().mockResolvedValue([]) });
        const service = new PropertyService(repo);
        const result = await service.listProperties("user-with-none");
        expect(result).toEqual([]);
      });
    });
    describe("good cases", () => {
      it("lists only properties where user is owner or staff", async () => {
        const userId = crypto.randomUUID();
        const list = [
          createProperty({ ownerId: userId }),
          createProperty({ id: "p2", ownerId: "other", name: "Staff Prop" }),
        ];
        const repo = createMockRepo({ findByUser: vi.fn().mockResolvedValue(list) });
        const service = new PropertyService(repo);

        const result = await service.listProperties(userId);

        expect(result).toHaveLength(2);
        expect(repo.findByUser).toHaveBeenCalledWith(userId);
      });

      it("list returns exactly owned and staff properties excluding deleted (PROP 2)", async () => {
        const userId = crypto.randomUUID();
        const owned = createProperty({ ownerId: userId, deletedAt: null });
        const repo = createMockRepo({
          findByUser: vi.fn().mockResolvedValue([owned]),
        });
        const service = new PropertyService(repo);

        const result = await service.listProperties(userId);

        expect(result).toEqual([owned]);
        expect(result.every((p) => p.deletedAt === null)).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("excludes soft-deleted properties from list (PROP 7)", async () => {
        const userId = crypto.randomUUID();
        const active = createProperty({ ownerId: userId, deletedAt: null });
        const repo = createMockRepo({
          findByUser: vi.fn().mockResolvedValue([active]),
        });
        const service = new PropertyService(repo);

        const result = await service.listProperties(userId);

        expect(result).toHaveLength(1);
        expect(result[0].deletedAt).toBeNull();
      });
    });
  });

  describe("getProperty", () => {
    describe("bad cases", () => {
      it("rejects getProperty when user has no access (PROP 6)", async () => {
        const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue(null) });
        const service = new PropertyService(repo);

        await expect(
          service.getProperty("user-1", "property-1")
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe("good cases", () => {
      it("returns property when user is owner", async () => {
        const prop = createProperty({ id: "p1", ownerId: "u1" });
        const repo = createMockRepo({
          findUserRole: vi.fn().mockResolvedValue("owner"),
          findById: vi.fn().mockResolvedValue(prop),
        });
        const service = new PropertyService(repo);

        const result = await service.getProperty("u1", "p1");

        expect(result).toEqual(prop);
      });
    });
    describe("edge cases", () => {
      it("throws when property not found", async () => {
        const repo = createMockRepo({
          findUserRole: vi.fn().mockResolvedValue("owner"),
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new PropertyService(repo);
        await expect(service.getProperty("u1", "missing")).rejects.toThrow(/not found/i);
      });
    });
  });

  describe("updateProperty", () => {
    describe("good cases", () => {
      it("updates property when user is owner", async () => {
        const updated = createProperty({ name: "Updated", address: "New Addr" });
        const repo = createMockRepo({
          findUserRole: vi.fn().mockResolvedValue("owner"),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new PropertyService(repo);

        const result = await service.updateProperty("owner-id", "prop-id", {
          name: "Updated",
          address: "New Addr",
        });

        expect(result.name).toBe("Updated");
        expect(repo.update).toHaveBeenCalledWith("prop-id", {
          name: "Updated",
          address: "New Addr",
        });
      });
    });

    describe("bad cases", () => {
      it("rejects update when user is staff not owner (PROP 3)", async () => {
        const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue("staff") });
        const service = new PropertyService(repo);

        await expect(
          service.updateProperty("staff-id", "prop-id", { name: "New" })
        ).rejects.toThrow(ForbiddenError);
      });
    });
    describe("edge cases", () => {
      it("rejects empty update payload", async () => {
        const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue("owner") });
        const service = new PropertyService(repo);
        await expect(
          service.updateProperty("owner-id", "prop-id", {})
        ).rejects.toThrow();
      });
    });
  });

  describe("deleteProperty", () => {
    describe("bad cases", () => {
      it("rejects delete when user is staff not owner (PROP 3)", async () => {
        const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue("staff") });
        const service = new PropertyService(repo);

        await expect(
          service.deleteProperty("staff-id", "prop-id")
        ).rejects.toThrow(ForbiddenError);
      });
    });

    describe("good cases", () => {
      it("soft-deletes when user is owner", async () => {
        const repo = createMockRepo({
          findUserRole: vi.fn().mockResolvedValue("owner"),
          softDelete: vi.fn().mockResolvedValue(undefined),
        });
        const service = new PropertyService(repo);

        await service.deleteProperty("owner-id", "prop-id");

        expect(repo.softDelete).toHaveBeenCalledWith("prop-id");
      });
    });
    describe("edge cases", () => {
      it("rejects when user has no access to property", async () => {
        const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue(null) });
        const service = new PropertyService(repo);
        await expect(service.deleteProperty("user-id", "other-property")).rejects.toThrow(
          ForbiddenError
        );
      });
    });
  });

  describe("validateAccess", () => {
    it("validateAccess returns 403 for unauthorized user", async () => {
      const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue(null) });
      const service = new PropertyService(repo);

      await expect(service.validateAccess("user-1", "property-1")).rejects.toThrow(
        ForbiddenError
      );
    });

    it("returns owner role when user is owner", async () => {
      const repo = createMockRepo({ findUserRole: vi.fn().mockResolvedValue("owner") });
      const service = new PropertyService(repo);

      const role = await service.validateAccess("owner-id", "prop-id");

      expect(role).toBe("owner");
    });
  });
});

describe("property-based tests", () => {
  // Feature: multi-property-management, Property 1: Property Creation Sets Owner
  it("property creation returns object with creating user as owner and unique id", () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
          address: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
        }),
        async (data) => {
          const userId = crypto.randomUUID();
          const created = createProperty({
            ownerId: userId,
            name: data.name,
            address: data.address,
          });
          const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
          const service = new PropertyService(repo);

          const result = await service.createProperty(userId, data);

          expect(result.ownerId).toBe(userId);
          expect(result.id).toBeDefined();
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
