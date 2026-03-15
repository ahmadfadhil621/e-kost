import type { OutstandingBalance } from "@/domain/schemas/dashboard";

/**
 * BalanceService per specs/outstanding-balance/design.md.
 * Computes outstanding balance = monthlyRent - totalPayments, status = paid when balance <= 0.
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

export interface BalanceRow {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  monthlyRent: number;
  totalPayments: number;
}

export interface IBalanceRepository {
  getBalanceRow(
    propertyId: string,
    tenantId: string
  ): Promise<BalanceRow | null>;
  getBalanceRows(
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<BalanceRow[]>;
}

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<"owner" | "staff">;
}

function toResult(row: BalanceRow): BalanceResult {
  const outstandingBalance = Math.max(0, row.monthlyRent - row.totalPayments);
  const status: BalanceStatus =
    outstandingBalance <= 0 ? "paid" : "unpaid";
  return {
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    roomNumber: row.roomNumber,
    monthlyRent: row.monthlyRent,
    totalPayments: row.totalPayments,
    outstandingBalance,
    status,
  };
}

export class BalanceService {
  constructor(
    private readonly balanceRepo: IBalanceRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async calculateBalance(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<BalanceResult> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const row = await this.balanceRepo.getBalanceRow(propertyId, tenantId);
    if (!row) {
      throw new Error(
        "Cannot calculate balance: tenant not found or has no room assignment"
      );
    }
    return toResult(row);
  }

  async calculateBalances(
    userId: string,
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<BalanceResult[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const rows = await this.balanceRepo.getBalanceRows(propertyId, status);
    return rows.map(toResult);
  }

  async getTopOutstandingBalances(
    userId: string,
    propertyId: string,
    limit: number
  ): Promise<{ balances: OutstandingBalance[]; totalCount: number }> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const rows = await this.balanceRepo.getBalanceRows(propertyId, "unpaid");
    const withBalance = rows.map((r) => ({
      ...r,
      balance: Math.max(0, r.monthlyRent - r.totalPayments),
    }));
    withBalance.sort((a, b) => b.balance - a.balance);
    const totalCount = withBalance.length;
    const top = withBalance.slice(0, limit);
    const balances: OutstandingBalance[] = top.map((r) => ({
      tenantId: r.tenantId,
      tenantName: r.tenantName,
      roomNumber: r.roomNumber,
      balance: r.balance,
    }));
    return { balances, totalCount };
  }
}
