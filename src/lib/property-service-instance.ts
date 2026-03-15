import { PropertyService } from "@/lib/property-service";
import { PrismaPropertyRepository } from "@/lib/repositories/prisma/prisma-property-repository";
import { findUserByEmail } from "@/lib/user-by-email";

const repo = new PrismaPropertyRepository();
const userByEmail = {
  findByEmail: findUserByEmail,
};

export const propertyService = new PropertyService(repo, userByEmail);
