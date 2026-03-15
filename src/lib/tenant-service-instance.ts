import { TenantService } from "@/lib/tenant-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";
import { PrismaRoomRepository } from "@/lib/repositories/prisma/prisma-room-repository";

const tenantRepo = new PrismaTenantRepository();
const roomRepo = new PrismaRoomRepository();

export const tenantService = new TenantService(
  tenantRepo,
  roomRepo,
  propertyService
);
