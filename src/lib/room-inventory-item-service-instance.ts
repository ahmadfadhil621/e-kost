import { RoomInventoryItemService } from "@/lib/room-inventory-item-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaRoomInventoryItemRepository } from "@/lib/repositories/prisma/prisma-room-inventory-item-repository";
import { logActivity } from "@/lib/activity-log-singleton";

const roomInventoryItemRepo = new PrismaRoomInventoryItemRepository();
export const roomInventoryItemService = new RoomInventoryItemService(
  roomInventoryItemRepo,
  propertyService,
  logActivity
);
