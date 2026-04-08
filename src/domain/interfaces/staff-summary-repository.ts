import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";

export interface IStaffSummaryRepository {
  getSummaryByPeriod(
    propertyId: string,
    year: number,
    month: number
  ): Promise<StaffSummaryEntry[]>;
}
