/**
 * Dashboard aggregate service per specs/dashboard-overview/design.md.
 * Aggregates room stats, finance summary, outstanding balances, and recent payments.
 */
import type {
  DashboardData,
  OccupancyStats,
  FinanceSummarySnapshot,
  OutstandingBalance,
  RecentPayment,
} from "@/domain/schemas/dashboard";

export interface IRoomStatsSource {
  getRoomStats(userId: string, propertyId: string): Promise<OccupancyStats>;
}

export interface IFinanceSummarySnapshotSource {
  getMonthlySummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<{ year: number; month: number; income: number; expenses: number; netIncome: number }>;
}

export interface IOutstandingBalancesSource {
  getTopOutstandingBalances(
    userId: string,
    propertyId: string,
    limit: number
  ): Promise<{ balances: OutstandingBalance[]; totalCount: number }>;
}

export interface IRecentPaymentsSource {
  getRecentPayments(
    userId: string,
    propertyId: string,
    limit: number
  ): Promise<RecentPayment[]>;
}

export class DashboardService {
  constructor(
    private readonly roomStats: IRoomStatsSource,
    private readonly financeSummary: IFinanceSummarySnapshotSource,
    private readonly outstandingBalances: IOutstandingBalancesSource,
    private readonly recentPayments: IRecentPaymentsSource
  ) {}

  async getDashboardData(
    userId: string,
    propertyId: string
  ): Promise<DashboardData> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const [occupancy, financeRaw, outstanding, recentPaymentsList] =
      await Promise.all([
        this.roomStats.getRoomStats(userId, propertyId),
        this.financeSummary.getMonthlySummary(userId, propertyId, year, month),
        this.outstandingBalances.getTopOutstandingBalances(
          userId,
          propertyId,
          5
        ),
        this.recentPayments.getRecentPayments(userId, propertyId, 5),
      ]);

    const finance: FinanceSummarySnapshot = {
      month: financeRaw.month,
      year: financeRaw.year,
      income: financeRaw.income,
      expenses: financeRaw.expenses,
      netIncome: financeRaw.netIncome,
    };

    return {
      occupancy,
      finance,
      outstandingBalances: outstanding.balances,
      outstandingCount: outstanding.totalCount,
      recentPayments: recentPaymentsList,
    };
  }
}
