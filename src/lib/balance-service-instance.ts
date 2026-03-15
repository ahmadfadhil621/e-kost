import { BalanceService } from "@/lib/balance-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaBalanceRepository } from "@/lib/repositories/prisma/prisma-balance-repository";

const balanceRepo = new PrismaBalanceRepository();
export const balanceService = new BalanceService(balanceRepo, propertyService);
