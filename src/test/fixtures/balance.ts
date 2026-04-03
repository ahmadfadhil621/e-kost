/**
 * Balance fixture and shape used by outstanding-balance tests.
 * Implementation will add domain/schemas/balance.ts with BalanceResult.
 */
export type BalanceStatus = "paid" | "unpaid";

export interface BalanceResult {
  tenantId: string;
  tenantName?: string;
  roomNumber?: string;
  monthlyRent: number;
  totalRentOwed: number;
  totalPayments: number;
  outstandingBalance: number;
  status: BalanceStatus;
}

/** Row shape returned by balance repository (monthlyRent, totalRentOwed, totalPayments). */
export interface BalanceRow {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  monthlyRent: number;
  /** Total rent owed across all months since move-in. */
  totalRentOwed: number;
  totalPayments: number;
}

export function createBalanceResult(
  overrides: Partial<BalanceResult> = {}
): BalanceResult {
  const monthlyRent = overrides.monthlyRent ?? 650;
  const totalRentOwed = overrides.totalRentOwed ?? monthlyRent;
  const totalPayments = overrides.totalPayments ?? 0;
  const outstandingBalance = Math.max(0, totalRentOwed - totalPayments);
  const status: BalanceStatus =
    outstandingBalance <= 0 ? "paid" : "unpaid";
  return {
    tenantId: overrides.tenantId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "John Doe",
    roomNumber: overrides.roomNumber ?? "A101",
    monthlyRent,
    totalRentOwed,
    totalPayments,
    outstandingBalance,
    status,
    ...overrides,
  };
}

export function createBalanceRow(
  overrides: Partial<BalanceRow> = {}
): BalanceRow {
  const monthlyRent = overrides.monthlyRent ?? 650;
  return {
    tenantId: overrides.tenantId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "John Doe",
    roomNumber: overrides.roomNumber ?? "A101",
    monthlyRent,
    totalRentOwed: overrides.totalRentOwed ?? monthlyRent,
    totalPayments: overrides.totalPayments ?? 0,
    ...overrides,
  };
}
