import type { InventoryItem } from "@/domain/schemas/room-inventory-item";

export function createInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: crypto.randomUUID(),
    roomId: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    name: "AC",
    quantity: 1,
    condition: "GOOD",
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    conditionUpdatedAt: new Date().toISOString(),
    ...overrides,
  };
}
