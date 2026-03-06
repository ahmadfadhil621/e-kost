import {
  BalanceService,
  type IBalanceRepository,
} from "@/lib/balance-service";
import { propertyService } from "@/lib/property-service-instance";

/**
 * Stub repository until Prisma balance queries are implemented.
 * All methods throw; replace with PrismaBalanceRepository when data layer is ready.
 */
const stubBalanceRepo: IBalanceRepository = {
  async getBalanceRow() {
    throw new Error("Balance repository not implemented");
  },
  async getBalanceRows() {
    throw new Error("Balance repository not implemented");
  },
};

export const balanceService = new BalanceService(
  stubBalanceRepo,
  propertyService
);
