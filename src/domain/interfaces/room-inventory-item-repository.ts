import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/domain/schemas/room-inventory-item";

export interface IRoomInventoryItemRepository {
  findByRoom(roomId: string): Promise<InventoryItem[]>;
  findById(id: string): Promise<InventoryItem | null>;
  create(
    input: CreateInventoryItemInput & { roomId: string; propertyId: string }
  ): Promise<InventoryItem>;
  update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  delete(id: string): Promise<void>;
}
