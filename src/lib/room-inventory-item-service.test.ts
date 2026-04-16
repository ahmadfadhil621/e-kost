// Traceability: room-furniture-inventory
// REQ 1.1 -> it('returns all items for a room')
// REQ 1.2 -> it('returns empty array when room has no items')
// REQ 2.2 -> it('adds an item and returns the created item')
// REQ 2.4 -> it('logs INVENTORY_ITEM_ADDED after adding an item')
// REQ 3.2 -> it('updates an item and returns the updated item')
// REQ 3.4 -> it('logs INVENTORY_ITEM_UPDATED after updating an item')
// REQ 4.2 -> it('deletes an item successfully')
// REQ 4.3 -> it('logs INVENTORY_ITEM_REMOVED after deleting an item')
// PROP 1  -> it('property access is validated on every operation (PROP 1)')
// PROP 2  -> it('logActivity errors are swallowed and never propagate to caller (PROP 2)')
// PROP 5  -> it('updateItem rejects item that belongs to a different property (PROP 5)')
// PROP 6  -> it('deleteItem rejects item that belongs to a different property (PROP 6)')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { RoomInventoryItemService } from "./room-inventory-item-service";

const userId = "user-test";
import type { IRoomInventoryItemRepository } from "@/domain/interfaces/room-inventory-item-repository";
import type { LogActivityFn } from "@/lib/activity-log-service";
import { createInventoryItem } from "@/test/fixtures/inventory-item";

function createMockRepo(
  overrides: Partial<IRoomInventoryItemRepository> = {}
): IRoomInventoryItemRepository {
  return {
    findByRoom: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

const createMockLogActivity = (): LogActivityFn => vi.fn();

describe("RoomInventoryItemService", () => {
  describe("listItems", () => {
    describe("good cases", () => {
      it("returns all items for a room", async () => {
        const propertyId = crypto.randomUUID();
        const roomId = crypto.randomUUID();
        const items = [
          createInventoryItem({ roomId, propertyId }),
          createInventoryItem({ roomId, propertyId, name: "Desk", condition: "FAIR" }),
        ];
        const repo = createMockRepo({ findByRoom: vi.fn().mockResolvedValue(items) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        const result = await service.listItems("user-1", propertyId, roomId);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("AC");
        expect(result[1].name).toBe("Desk");
      });
    });

    describe("bad cases", () => {
      it("throws when property access is denied", async () => {
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new RoomInventoryItemService(
          createMockRepo(),
          propertyAccess,
          createMockLogActivity()
        );

        await expect(
          service.listItems("user-1", "prop-1", "room-1")
        ).rejects.toThrow("Forbidden");
      });
    });

    describe("edge cases", () => {
      it("returns empty array (not an error) when room has no items", async () => {
        const repo = createMockRepo({ findByRoom: vi.fn().mockResolvedValue([]) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        const result = await service.listItems("user-1", "prop-1", "room-1");

        expect(result).toEqual([]);
      });
    });
  });

  describe("addItem", () => {
    describe("good cases", () => {
      it("adds an item and returns the created item", async () => {
        const propertyId = crypto.randomUUID();
        const roomId = crypto.randomUUID();
        const created = createInventoryItem({ roomId, propertyId, name: "Wardrobe", condition: "NEW" });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        const result = await service.addItem(
          "user-1",
          propertyId,
          roomId,
          { name: "Wardrobe", quantity: 1, condition: "NEW" },
          "owner"
        );

        expect(result.name).toBe("Wardrobe");
        expect(result.condition).toBe("NEW");
        expect(vi.mocked(repo.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            roomId,
            propertyId,
            name: "Wardrobe",
            condition: "NEW",
          })
        );
      });

      it("logs INVENTORY_ITEM_ADDED after adding an item", async () => {
        const propertyId = crypto.randomUUID();
        const roomId = crypto.randomUUID();
        const created = createInventoryItem({ roomId, propertyId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const logActivity = createMockLogActivity();
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        await service.addItem(
          "user-1",
          propertyId,
          roomId,
          { name: "AC", quantity: 1, condition: "GOOD" },
          "owner"
        );

        expect(logActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId,
            actionCode: "INVENTORY_ITEM_ADDED",
            entityType: "INVENTORY_ITEM",
            entityId: created.id,
          })
        );
      });
    });

    describe("bad cases", () => {
      it("throws when property access is denied", async () => {
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new RoomInventoryItemService(
          createMockRepo(),
          propertyAccess,
          createMockLogActivity()
        );

        await expect(
          service.addItem("user-1", "prop-1", "room-1", { name: "AC", quantity: 1, condition: "GOOD" }, "owner")
        ).rejects.toThrow("Forbidden");
      });
    });

    describe("edge cases", () => {
      it("swallows logActivity errors and still returns the created item", async () => {
        const propertyId = crypto.randomUUID();
        const roomId = crypto.randomUUID();
        const created = createInventoryItem({ roomId, propertyId });
        const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
        const logActivity: LogActivityFn = vi.fn().mockImplementation(() => {
          throw new Error("log failed");
        });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        // Should not throw even though logActivity throws
        await expect(
          service.addItem("user-1", propertyId, roomId, { name: "AC", quantity: 1, condition: "GOOD" }, "owner")
        ).resolves.toMatchObject({ name: "AC" });
      });
    });
  });

  describe("updateItem", () => {
    describe("good cases", () => {
      it("updates an item and returns the updated item", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId, condition: "GOOD" });
        const updated = { ...item, condition: "POOR" as const, updatedAt: new Date().toISOString() };
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          update: vi.fn().mockResolvedValue(updated),
        });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        const result = await service.updateItem(
          "user-1",
          propertyId,
          item.id,
          { condition: "POOR" },
          "owner"
        );

        expect(result.condition).toBe("POOR");
        expect(vi.mocked(repo.update)).toHaveBeenCalledWith(
          item.id,
          { condition: "POOR" }
        );
      });

      it("logs INVENTORY_ITEM_UPDATED after updating an item", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId, condition: "GOOD" });
        const updated = { ...item, condition: "DAMAGED" as const };
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          update: vi.fn().mockResolvedValue(updated),
        });
        const logActivity = createMockLogActivity();
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        await service.updateItem("user-1", propertyId, item.id, { condition: "DAMAGED" }, "owner");

        expect(logActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId,
            actionCode: "INVENTORY_ITEM_UPDATED",
            entityType: "INVENTORY_ITEM",
            entityId: item.id,
          })
        );
      });
    });

    describe("bad cases", () => {
      it("throws when item is not found", async () => {
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(null) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        await expect(
          service.updateItem("user-1", "prop-1", "nonexistent-item", { name: "X" }, "owner")
        ).rejects.toThrow("Item not found");
      });

      it("throws when item belongs to a different property (cross-property guard)", async () => {
        const item = createInventoryItem({ propertyId: "other-prop" });
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(item) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        await expect(
          service.updateItem("user-1", "my-prop", item.id, { name: "X" }, "owner")
        ).rejects.toThrow("Forbidden");
      });
    });

    describe("edge cases", () => {
      it("swallows logActivity errors and still returns the updated item", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId });
        const updated = { ...item, notes: "updated" };
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          update: vi.fn().mockResolvedValue(updated),
        });
        const logActivity: LogActivityFn = vi.fn().mockImplementation(() => {
          throw new Error("log failed");
        });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        await expect(
          service.updateItem("user-1", propertyId, item.id, { notes: "updated" }, "owner")
        ).resolves.toMatchObject({ notes: "updated" });
      });
    });
  });

  describe("deleteItem", () => {
    describe("good cases", () => {
      it("deletes an item successfully", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        await expect(
          service.deleteItem("user-1", propertyId, item.id, "owner")
        ).resolves.not.toThrow();

        expect(vi.mocked(repo.delete)).toHaveBeenCalledWith(item.id);
      });

      it("logs INVENTORY_ITEM_REMOVED after deleting an item", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const logActivity = createMockLogActivity();
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        await service.deleteItem("user-1", propertyId, item.id, "owner");

        expect(logActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId,
            actionCode: "INVENTORY_ITEM_REMOVED",
            entityType: "INVENTORY_ITEM",
            entityId: item.id,
          })
        );
      });
    });

    describe("bad cases", () => {
      it("throws when item is not found", async () => {
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(null) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        await expect(
          service.deleteItem("user-1", "prop-1", "nonexistent-item", "owner")
        ).rejects.toThrow("Item not found");
      });

      it("throws when item belongs to a different property (cross-property guard)", async () => {
        const item = createInventoryItem({ propertyId: "other-prop" });
        const repo = createMockRepo({ findById: vi.fn().mockResolvedValue(item) });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          createMockLogActivity()
        );

        await expect(
          service.deleteItem("user-1", "my-prop", item.id, "owner")
        ).rejects.toThrow("Forbidden");
      });
    });

    describe("edge cases", () => {
      it("swallows logActivity errors and still resolves", async () => {
        const propertyId = crypto.randomUUID();
        const item = createInventoryItem({ propertyId });
        const repo = createMockRepo({
          findById: vi.fn().mockResolvedValue(item),
          delete: vi.fn().mockResolvedValue(undefined),
        });
        const logActivity: LogActivityFn = vi.fn().mockImplementation(() => {
          throw new Error("log failed");
        });
        const service = new RoomInventoryItemService(
          repo,
          createMockPropertyAccess(),
          logActivity
        );

        await expect(
          service.deleteItem("user-1", propertyId, item.id, "owner")
        ).resolves.not.toThrow();
      });
    });
  });

  describe("property-based tests", () => {
    it("property access is validated on every mutating operation (PROP 1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            propertyId: fc.uuid(),
            roomId: fc.uuid(),
          }),
          async ({ userId, propertyId, roomId }) => {
            const propertyAccess = createMockPropertyAccess();
            const repo = createMockRepo({
              create: vi.fn().mockResolvedValue(createInventoryItem({ propertyId, roomId })),
            });
            const service = new RoomInventoryItemService(
              repo,
              propertyAccess,
              createMockLogActivity()
            );

            await service.listItems(userId, propertyId, roomId);
            await service.addItem(userId, propertyId, roomId, { name: "X", quantity: 1, condition: "GOOD" }, "owner");

            expect(propertyAccess.validateAccess).toHaveBeenCalledTimes(2);
            expect(propertyAccess.validateAccess).toHaveBeenCalledWith(userId, propertyId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("logActivity errors are swallowed and never propagate to caller (PROP 2)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ name, quantity }) => {
            const propertyId = crypto.randomUUID();
            const roomId = crypto.randomUUID();
            const created = createInventoryItem({ propertyId, roomId });
            const repo = createMockRepo({ create: vi.fn().mockResolvedValue(created) });
            const logActivity: LogActivityFn = vi.fn().mockImplementation(() => {
              throw new Error("logging system down");
            });
            const service = new RoomInventoryItemService(
              repo,
              createMockPropertyAccess(),
              logActivity
            );

            await expect(
              service.addItem(userId, propertyId, roomId, { name, quantity, condition: "GOOD" }, "owner")
            ).resolves.toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

