import { RoomService } from "@/lib/room-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaRoomRepository } from "@/lib/repositories/prisma/prisma-room-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";

const roomRepo = new PrismaRoomRepository();
const tenantRepo = new PrismaTenantRepository();
export const roomService = new RoomService(roomRepo, tenantRepo, propertyService);
