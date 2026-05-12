import type { CashflowEntry, CashflowExportRow, CashflowExportFilters } from "@/domain/schemas/cashflow";

export interface ICashflowRepository {
  findByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]>;
  findForExport(
    propertyId: string,
    filters: CashflowExportFilters
  ): Promise<CashflowExportRow[]>;
}
