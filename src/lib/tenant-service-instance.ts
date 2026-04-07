import { TenantService } from "@/lib/tenant-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";
import { PrismaRoomRepository } from "@/lib/repositories/prisma/prisma-room-repository";
import { PrismaRoomAssignmentRepository } from "@/lib/repositories/prisma/prisma-room-assignment-repository";
import { logActivity } from "@/lib/activity-log-singleton";

const tenantRepo = new PrismaTenantRepository();
const roomRepo = new PrismaRoomRepository();
const roomAssignmentRepo = new PrismaRoomAssignmentRepository();

export const tenantService = new TenantService(
  tenantRepo,
  roomRepo,
  propertyService,
  roomAssignmentRepo,
  logActivity
);
