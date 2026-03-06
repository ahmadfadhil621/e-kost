import { BalanceService } from "@/lib/balance-service";
import { propertyService } from "@/lib/property-service-instance";

/**
 * Stub repository until Prisma balance queries are implemented.
 * All methods throw; replace with PrismaBalanceRepository when data layer is ready.
 */
const stubBalanceRepo = {
  async getBalanceRow() {
    throw new Error("Balance repository not implemented");
  },
  async getBalanceRows() {
    throw new Error("Balance repository not implemented");
  },
};

export const balanceService = new BalanceService(
  stubBalanceRepo as Parameters<typeof BalanceService>[0],
  propertyService
);
