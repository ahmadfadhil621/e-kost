import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";

export function createStaffSummaryEntry(
  overrides: Partial<StaffSummaryEntry> = {}
): StaffSummaryEntry {
  return {
    actorId: crypto.randomUUID(),
    actorName: "Ahmad Staff",
    actorRole: "staff",
    totalPayments: 3_500_000,
    totalExpenses: 200_000,
    ...overrides,
  };
}
