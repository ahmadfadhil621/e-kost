import type {
  OccupancyStats,
  FinanceSummarySnapshot,
  OutstandingBalance,
  RecentPayment,
} from "@/domain/schemas/dashboard";

export function createOccupancyStats(
  overrides: Partial<OccupancyStats> = {}
): OccupancyStats {
  const totalRooms = overrides.totalRooms ?? 10;
  const occupied = overrides.occupied ?? 7;
  const available = overrides.available ?? 2;
  const underRenovation = overrides.underRenovation ?? 1;
  const occupancyRate =
    totalRooms > 0
      ? Math.round((occupied / totalRooms) * 1000) / 10
      : 0;
  return {
    totalRooms,
    occupied,
    available,
    underRenovation,
    occupancyRate: overrides.occupancyRate ?? occupancyRate,
    ...overrides,
  };
}

export function createFinanceSummarySnapshot(
  overrides: Partial<FinanceSummarySnapshot> = {}
): FinanceSummarySnapshot {
  const income = overrides.income ?? 3250;
  const expenses = overrides.expenses ?? 250;
  return {
    month: overrides.month ?? 3,
    year: overrides.year ?? 2026,
    income,
    expenses,
    netIncome: overrides.netIncome ?? income - expenses,
    categoryBreakdown: overrides.categoryBreakdown ?? [],
    ...overrides,
  };
}

export function createOutstandingBalance(
  overrides: Partial<OutstandingBalance> = {}
): OutstandingBalance {
  return {
    tenantId: overrides.tenantId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "Jane Doe",
    roomNumber: overrides.roomNumber ?? "B202",
    balance: overrides.balance ?? 650,
    ...overrides,
  };
}

export function createRecentPayment(
  overrides: Partial<RecentPayment> = {}
): RecentPayment {
  return {
    paymentId: overrides.paymentId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "John Doe",
    amount: overrides.amount ?? 800,
    date: overrides.date ?? new Date(),
    ...overrides,
  };
}
