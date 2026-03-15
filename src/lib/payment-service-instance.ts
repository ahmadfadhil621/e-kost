import { PaymentService } from "@/lib/payment-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaPaymentRepository } from "@/lib/repositories/prisma/prisma-payment-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";

const paymentRepo = new PrismaPaymentRepository();
const tenantRepo = new PrismaTenantRepository();

export const paymentService = new PaymentService(
  paymentRepo,
  tenantRepo,
  propertyService
);
