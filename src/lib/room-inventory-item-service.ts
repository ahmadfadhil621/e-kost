import type { IRoomInventoryItemRepository } from "@/domain/interfaces/room-inventory-item-repository";
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/domain/schemas/room-inventory-item";
import type { LogActivityFn } from "@/lib/activity-log-service";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class RoomInventoryItemService {
  constructor(
    private readonly repo: IRoomInventoryItemRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly logActivity: LogActivityFn
  ) {}

  async listItems(
    userId: string,
    propertyId: string,
    roomId: string
  ): Promise<InventoryItem[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByRoom(roomId);
  }

  async addItem(
    userId: string,
    propertyId: string,
    roomId: string,
    input: CreateInventoryItemInput,
    actorRole: string
  ): Promise<InventoryItem> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const item = await this.repo.create({ ...input, roomId, propertyId });
    try {
      this.logActivity({
        propertyId,
        actorId: userId,
        actorRole: actorRole ?? role,
        actionCode: "INVENTORY_ITEM_ADDED",
        entityType: "INVENTORY_ITEM",
        entityId: item.id,
        metadata: { itemName: item.name, condition: item.condition },
      });
    } catch {
      // fire-and-forget — logging must never break a primary action
    }
    return item;
  }

  async updateItem(
    userId: string,
    propertyId: string,
    itemId: string,
    input: UpdateInventoryItemInput,
    actorRole: string
  ): Promise<InventoryItem> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(itemId);
    if (!existing) {
      throw new Error("Item not found");
    }
    if (existing.propertyId !== propertyId) {
      throw new Error("Forbidden");
    }
    const updated = await this.repo.update(itemId, input);
    try {
      this.logActivity({
        propertyId,
        actorId: userId,
        actorRole: actorRole ?? role,
        actionCode: "INVENTORY_ITEM_UPDATED",
        entityType: "INVENTORY_ITEM",
        entityId: itemId,
        metadata: {
          itemName: updated.name,
          previousCondition: existing.condition,
          newCondition: updated.condition,
        },
      });
    } catch {
      // fire-and-forget
    }
    return updated;
  }

  async deleteItem(
    userId: string,
    propertyId: string,
    itemId: string,
    actorRole: string
  ): Promise<void> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(itemId);
    if (!existing) {
      throw new Error("Item not found");
    }
    if (existing.propertyId !== propertyId) {
      throw new Error("Forbidden");
    }
    await this.repo.delete(itemId);
    try {
      this.logActivity({
        propertyId,
        actorId: userId,
        actorRole: actorRole ?? role,
        actionCode: "INVENTORY_ITEM_REMOVED",
        entityType: "INVENTORY_ITEM",
        entityId: itemId,
        metadata: { itemName: existing.name, condition: existing.condition },
      });
    } catch {
      // fire-and-forget
    }
  }
}
