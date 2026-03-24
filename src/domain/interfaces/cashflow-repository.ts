import type { CashflowEntry } from "@/domain/schemas/cashflow";

export interface ICashflowRepository {
  findByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]>;
}
