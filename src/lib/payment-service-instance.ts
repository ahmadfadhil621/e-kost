import { PaymentService } from "@/lib/payment-service";
import { propertyService } from "@/lib/property-service-instance";
import { StubPaymentRepository } from "@/lib/repositories/stub-payment-repository";
import { PrismaTenantRepository } from "@/lib/repositories/prisma/prisma-tenant-repository";

const paymentRepo = new StubPaymentRepository();
const tenantRepo = new PrismaTenantRepository();

export const paymentService = new PaymentService(
  paymentRepo,
  tenantRepo,
  propertyService
);
