/**
 * Dashboard service instance. Wires DashboardService to RoomService (getRoomStats),
 * FinanceSummaryService, BalanceService (getTopOutstandingBalances), PaymentService (getRecentPayments).
 */
import {
  DashboardService,
  type IRoomStatsSource,
  type IFinanceSummarySnapshotSource,
  type IOutstandingBalancesSource,
  type IRecentPaymentsSource,
} from "@/lib/dashboard-service";
import { financeSummaryService } from "@/lib/finance-summary-service-instance";
import { roomService } from "@/lib/room-service-instance";
import { balanceService } from "@/lib/balance-service-instance";
import { paymentService } from "@/lib/payment-service-instance";

const roomStatsSource: IRoomStatsSource = {
  async getRoomStats(userId, propertyId) {
    return roomService.getRoomStats(userId, propertyId);
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

const outstandingBalancesSource: IOutstandingBalancesSource = {
  async getTopOutstandingBalances(userId, propertyId, limit) {
    return balanceService.getTopOutstandingBalances(userId, propertyId, limit);
  },
};

const recentPaymentsSource: IRecentPaymentsSource = {
  async getRecentPayments(userId, propertyId, limit) {
    return paymentService.getRecentPayments(userId, propertyId, limit);
  },
};

export const dashboardService = new DashboardService(
  roomStatsSource,
  financeSnapshotSource,
  outstandingBalancesSource,
  recentPaymentsSource
);
