import type { OutstandingBalance } from "@/domain/schemas/dashboard";
import type { BillingCycleBreakdown, CycleStatus } from "@/domain/schemas/billing-cycle";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";

/**
 * BalanceService per specs/outstanding-balance/design.md.
 * Computes outstanding balance = totalRentOwed - totalPayments, status = paid when balance <= 0.
 * totalRentOwed = monthlyRent × months elapsed since move-in (inclusive).
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

export interface BalanceRow {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  monthlyRent: number;
  /** Total rent owed across all months since move-in (monthlyRent × months elapsed). */
  totalRentOwed: number;
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
  getTenantInfo(
    propertyId: string,
    tenantId: string
  ): Promise<{ monthlyRent: number; movedInAt: Date } | null>;
}

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<"owner" | "staff">;
}

function toResult(row: BalanceRow): BalanceResult {
  const outstandingBalance = Math.max(0, row.totalRentOwed - row.totalPayments);
  const status: BalanceStatus =
    outstandingBalance <= 0 ? "paid" : "unpaid";
  return {
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    roomNumber: row.roomNumber,
    monthlyRent: row.monthlyRent,
    totalRentOwed: row.totalRentOwed,
    totalPayments: row.totalPayments,
    outstandingBalance,
    status,
  };
}

export class BalanceService {
  constructor(
    private readonly balanceRepo: IBalanceRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly billingCycleRepo?: IBillingCycleRepository
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
      balance: Math.max(0, r.totalRentOwed - r.totalPayments),
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

  async calculateCycleBreakdown(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<BillingCycleBreakdown> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const info = await this.balanceRepo.getTenantInfo(propertyId, tenantId);
    if (!info) {
      throw new Error(
        "Cannot calculate balance: tenant not found or has no room assignment"
      );
    }

    const cycleRepo = this.billingCycleRepo;
    const existingSums = cycleRepo
      ? await cycleRepo.findWithPaymentSums(tenantId)
      : [];

    const sumsMap = new Map<string, { id: string; totalPaid: number }>();
    for (const s of existingSums) {
      sumsMap.set(`${s.year}-${s.month}`, { id: s.id, totalPaid: s.totalPaid });
    }

    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1;

    const moveIn = new Date(info.movedInAt);
    let curYear = moveIn.getFullYear();
    let curMonth = moveIn.getMonth() + 1;

    const allCycles: CycleStatus[] = [];

    while (
      curYear < endYear ||
      (curYear === endYear && curMonth <= endMonth)
    ) {
      const key = `${curYear}-${curMonth}`;
      const entry = sumsMap.get(key);
      const totalPaid = entry?.totalPaid ?? 0;
      const amountOwed = Math.max(0, info.monthlyRent - totalPaid);
      let status: CycleStatus["status"];
      if (totalPaid >= info.monthlyRent) {
        status = "paid";
      } else if (totalPaid > 0) {
        status = "partial";
      } else {
        status = "unpaid";
      }
      allCycles.push({
        year: curYear,
        month: curMonth,
        cycleId: entry?.id ?? null,
        totalPaid,
        monthlyRent: info.monthlyRent,
        status,
        amountOwed,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    const unpaidCycles = allCycles.filter((c) => c.status !== "paid");
    return {
      tenantId,
      unpaidCycles,
      allPaid: unpaidCycles.length === 0,
    };
  }
}
