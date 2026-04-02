import { BalanceService } from "@/lib/balance-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaBalanceRepository } from "@/lib/repositories/prisma/prisma-balance-repository";
import { PrismaBillingCycleRepository } from "@/lib/repositories/prisma/prisma-billing-cycle-repository";

const balanceRepo = new PrismaBalanceRepository();
const billingCycleRepo = new PrismaBillingCycleRepository();
export const balanceService = new BalanceService(balanceRepo, propertyService, billingCycleRepo);
