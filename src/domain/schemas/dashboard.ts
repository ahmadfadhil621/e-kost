/**
 * Dashboard aggregate types per specs/dashboard-overview/design.md.
 * Used by DashboardService and dashboard API.
 */

export interface OccupancyStats {
  totalRooms: number;
  occupied: number;
  available: number;
  underRenovation: number;
  occupancyRate: number;
}

export interface FinanceSummarySnapshot {
  month: number;
  year: number;
  income: number;
  expenses: number;
  netIncome: number;
}

export interface OutstandingBalance {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  balance: number;
}

export interface RecentPayment {
  paymentId: string;
  tenantName: string;
  amount: number;
  date: Date;
}

export interface DashboardData {
  occupancy: OccupancyStats;
  finance: FinanceSummarySnapshot;
  outstandingBalances: OutstandingBalance[];
  outstandingCount: number;
  recentPayments: RecentPayment[];
}
