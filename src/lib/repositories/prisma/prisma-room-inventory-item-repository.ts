import { prisma } from "@/lib/prisma";
import type { IRoomInventoryItemRepository } from "@/domain/interfaces/room-inventory-item-repository";
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/domain/schemas/room-inventory-item";

function mapToItem(row: {
  id: string;
  roomId: string;
  propertyId: string;
  name: string;
  quantity: number;
  condition: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): InventoryItem {
  return {
    id: row.id,
    roomId: row.roomId,
    propertyId: row.propertyId,
    name: row.name,
    quantity: row.quantity,
    condition: row.condition as InventoryItem["condition"],
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaRoomInventoryItemRepository
  implements IRoomInventoryItemRepository
{
  async findByRoom(roomId: string): Promise<InventoryItem[]> {
    const rows = await prisma.room_inventory_item.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapToItem);
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const row = await prisma.room_inventory_item.findUnique({ where: { id } });
    return row ? mapToItem(row) : null;
  }

  async create(
    input: CreateInventoryItemInput & { roomId: string; propertyId: string }
  ): Promise<InventoryItem> {
    const row = await prisma.room_inventory_item.create({
      data: {
        roomId: input.roomId,
        propertyId: input.propertyId,
        name: input.name,
        quantity: input.quantity,
        condition: input.condition,
        notes: input.notes ?? null,
      },
    });
    return mapToItem(row);
  }

  async update(id: string, input: UpdateInventoryItemInput): Promise<InventoryItem> {
    const row = await prisma.room_inventory_item.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.quantity !== undefined && { quantity: input.quantity }),
        ...(input.condition !== undefined && { condition: input.condition }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
    return mapToItem(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.room_inventory_item.delete({ where: { id } });
  }
}
