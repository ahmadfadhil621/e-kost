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
  totalPayments: number;
  outstandingBalance: number;
  status: BalanceStatus;
}

/** Row shape returned by balance repository (monthlyRent, totalPayments). */
export interface BalanceRow {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  monthlyRent: number;
  totalPayments: number;
}

export function createBalanceResult(
  overrides: Partial<BalanceResult> = {}
): BalanceResult {
  const monthlyRent = overrides.monthlyRent ?? 1500000;
  const totalPayments = overrides.totalPayments ?? 0;
  const outstandingBalance = Math.max(0, monthlyRent - totalPayments);
  const status: BalanceStatus =
    outstandingBalance <= 0 ? "paid" : "unpaid";
  return {
    tenantId: overrides.tenantId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "John Doe",
    roomNumber: overrides.roomNumber ?? "A101",
    monthlyRent,
    totalPayments,
    outstandingBalance,
    status,
    ...overrides,
  };
}

export function createBalanceRow(
  overrides: Partial<BalanceRow> = {}
): BalanceRow {
  return {
    tenantId: overrides.tenantId ?? crypto.randomUUID(),
    tenantName: overrides.tenantName ?? "John Doe",
    roomNumber: overrides.roomNumber ?? "A101",
    monthlyRent: overrides.monthlyRent ?? 1500000,
    totalPayments: overrides.totalPayments ?? 0,
    ...overrides,
  };
}
