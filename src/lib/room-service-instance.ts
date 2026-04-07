import { RoomService } from "@/lib/room-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaRoomRepository } from "@/lib/repositories/prisma/prisma-room-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";
import { logActivity } from "@/lib/activity-log-singleton";

const roomRepo = new PrismaRoomRepository();
const tenantRepo = new PrismaTenantRepository();
export const roomService = new RoomService(roomRepo, tenantRepo, propertyService, logActivity);
