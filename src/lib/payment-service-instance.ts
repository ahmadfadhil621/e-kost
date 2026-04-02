import { PaymentService } from "@/lib/payment-service";
import { balanceService } from "@/lib/balance-service-instance";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaPaymentRepository } from "@/lib/repositories/prisma/prisma-payment-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";
import { PrismaBillingCycleRepository } from "@/lib/repositories/prisma/prisma-billing-cycle-repository";

const paymentRepo = new PrismaPaymentRepository();
const tenantRepo = new PrismaTenantRepository();
const billingCycleRepo = new PrismaBillingCycleRepository();

export const paymentService = new PaymentService(
  paymentRepo,
  tenantRepo,
  propertyService,
  billingCycleRepo,
  balanceService
);
