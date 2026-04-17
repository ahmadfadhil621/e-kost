// Traceability: room-inventory-condition-timestamp (issue #118)
// REQ AC-1 -> it('create sets conditionUpdatedAt on the returned item')
// REQ AC-2 -> it('update with condition change sets conditionUpdatedAt')
// REQ AC-2 -> it('update without condition change preserves conditionUpdatedAt')
// REQ AC-4 -> it('mapToItem includes conditionUpdatedAt as ISO string')

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room_inventory_item: {
      create: mockCreate,
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

const { PrismaRoomInventoryItemRepository } = await import(
  "./prisma-room-inventory-item-repository"
);

function makeDbRow(overrides: Partial<{
  id: string;
  roomId: string;
  propertyId: string;
  name: string;
  quantity: number;
  condition: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  conditionUpdatedAt: Date;
}> = {}) {
  const now = new Date();
  return {
    id: "item-1",
    roomId: "room-1",
    propertyId: "prop-1",
    name: "AC",
    quantity: 1,
    condition: "GOOD",
    notes: null,
    createdAt: now,
    updatedAt: now,
    conditionUpdatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PrismaRoomInventoryItemRepository", () => {
  describe("create", () => {
    describe("good cases", () => {
      it("returns item with conditionUpdatedAt as ISO string", async () => {
        const conditionUpdatedAt = new Date("2026-04-01T10:00:00Z");
        const row = makeDbRow({ conditionUpdatedAt });
        mockCreate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        const result = await repo.create({
          roomId: "room-1",
          propertyId: "prop-1",
          name: "AC",
          quantity: 1,
          condition: "GOOD",
        });

        expect(result.conditionUpdatedAt).toBe(conditionUpdatedAt.toISOString());
      });

      it("passes conditionUpdatedAt to prisma on create", async () => {
        const row = makeDbRow();
        mockCreate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        const before = Date.now();
        await repo.create({
          roomId: "room-1",
          propertyId: "prop-1",
          name: "AC",
          quantity: 1,
          condition: "NEW",
        });
        const after = Date.now();

        const data = mockCreate.mock.calls[0][0].data;
        expect(data.conditionUpdatedAt).toBeInstanceOf(Date);
        const ts = (data.conditionUpdatedAt as Date).getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
      });
    });
  });

  describe("update", () => {
    describe("good cases", () => {
      it("includes conditionUpdatedAt in prisma data when condition changes", async () => {
        const row = makeDbRow({ condition: "POOR" });
        mockUpdate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        const before = Date.now();
        await repo.update("item-1", { condition: "POOR" });
        const after = Date.now();

        const data = mockUpdate.mock.calls[0][0].data;
        expect(data.conditionUpdatedAt).toBeInstanceOf(Date);
        const ts = (data.conditionUpdatedAt as Date).getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
      });

      it("does NOT include conditionUpdatedAt in prisma data when condition is not in payload", async () => {
        const row = makeDbRow({ name: "New Name" });
        mockUpdate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        await repo.update("item-1", { name: "New Name" });

        const data = mockUpdate.mock.calls[0][0].data;
        expect(data.conditionUpdatedAt).toBeUndefined();
      });
    });

    describe("edge cases", () => {
      it("preserves conditionUpdatedAt when only notes change", async () => {
        const original = new Date("2026-03-01T08:00:00Z");
        const row = makeDbRow({ notes: "Updated note", conditionUpdatedAt: original });
        mockUpdate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        const result = await repo.update("item-1", { notes: "Updated note" });

        const data = mockUpdate.mock.calls[0][0].data;
        expect(data.conditionUpdatedAt).toBeUndefined();
        expect(result.conditionUpdatedAt).toBe(original.toISOString());
      });

      it("preserves conditionUpdatedAt when only quantity changes", async () => {
        const original = new Date("2026-03-01T08:00:00Z");
        const row = makeDbRow({ quantity: 3, conditionUpdatedAt: original });
        mockUpdate.mockResolvedValue(row);

        const repo = new PrismaRoomInventoryItemRepository();
        const result = await repo.update("item-1", { quantity: 3 });

        const data = mockUpdate.mock.calls[0][0].data;
        expect(data.conditionUpdatedAt).toBeUndefined();
        expect(result.conditionUpdatedAt).toBe(original.toISOString());
      });
    });
  });
});
