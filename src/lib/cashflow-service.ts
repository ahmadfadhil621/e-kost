import type { ICashflowRepository } from "@/domain/interfaces/cashflow-repository";
import type { CashflowEntry } from "@/domain/schemas/cashflow";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class CashflowService {
  constructor(
    private readonly repo: ICashflowRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getMonthlyCashflow(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByPropertyAndMonth(propertyId, year, month);
  }
}
