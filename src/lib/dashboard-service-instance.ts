/**
 * Dashboard service instance. Wires DashboardService to RoomService (getRoomStats),
 * FinanceSummaryService, BalanceService (getTopOutstandingBalances), PaymentService (getRecentPayments).
 * Stub adapters throw until those methods exist on the underlying services.
 */
import {
  DashboardService,
  type IRoomStatsSource,
  type IFinanceSummarySnapshotSource,
  type IOutstandingBalancesSource,
  type IRecentPaymentsSource,
} from "@/lib/dashboard-service";
import { financeSummaryService } from "@/lib/finance-summary-service-instance";

const stubRoomStats: IRoomStatsSource = {
  async getRoomStats() {
    throw new Error("RoomService.getRoomStats not implemented");
  },
};

const financeSnapshotSource: IFinanceSummarySnapshotSource = {
  async getMonthlySummary(userId, propertyId, year, month) {
    const summary = await financeSummaryService.getMonthlySummary(
      userId,
      propertyId,
      year,
      month
    );
    return {
      year: summary.year,
      month: summary.month,
      income: summary.income,
      expenses: summary.expenses,
      netIncome: summary.netIncome,
    };
  },
};

const stubOutstandingBalances: IOutstandingBalancesSource = {
  async getTopOutstandingBalances() {
    throw new Error("BalanceService.getTopOutstandingBalances not implemented");
  },
};

const stubRecentPayments: IRecentPaymentsSource = {
  async getRecentPayments() {
    throw new Error("PaymentService.getRecentPayments not implemented");
  },
};

export const dashboardService = new DashboardService(
  stubRoomStats,
  financeSnapshotSource,
  stubOutstandingBalances,
  stubRecentPayments
);
