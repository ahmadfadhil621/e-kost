import type { IStaffSummaryRepository } from "@/domain/interfaces/staff-summary-repository";
import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class StaffSummaryService {
  constructor(
    private readonly repo: IStaffSummaryRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getStaffSummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<StaffSummaryEntry[]> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const all = await this.repo.getSummaryByPeriod(propertyId, year, month);
    if (role !== "owner") {
      return all.filter((e) => e.actorId === userId);
    }
    return all;
  }
}
