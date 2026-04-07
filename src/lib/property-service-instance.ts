import { PropertyService } from "@/lib/property-service";
import { PrismaPropertyRepository } from "@/lib/repositories/prisma/prisma-property-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";
import { findUserByEmail } from "@/lib/user-by-email";
import { logActivity } from "@/lib/activity-log-singleton";

const repo = new PrismaPropertyRepository();
const tenantRepo = new PrismaTenantRepository();
const userByEmail = {
  findByEmail: findUserByEmail,
};

export const propertyService = new PropertyService(repo, userByEmail, tenantRepo, logActivity);
