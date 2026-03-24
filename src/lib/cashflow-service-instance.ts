import { CashflowService } from "@/lib/cashflow-service";
import { propertyService } from "@/lib/property-service-instance";
import { PrismaCashflowRepository } from "@/lib/repositories/prisma/prisma-cashflow-repository";

const cashflowRepo = new PrismaCashflowRepository();

export const cashflowService = new CashflowService(
  cashflowRepo,
  propertyService
);
