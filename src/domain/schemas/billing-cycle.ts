export interface BillingCycle {
  id: string;
  tenantId: string;
  year: number;
  month: number;
  createdAt: Date;
}

export interface CycleStatus {
  year: number;
  month: number;
  cycleId: string | null;
  totalPaid: number;
  monthlyRent: number;
  status: "paid" | "partial" | "unpaid";
  amountOwed: number;
}

export interface BillingCycleBreakdown {
  tenantId: string;
  unpaidCycles: CycleStatus[];
  allPaid: boolean;
  billingDayOfMonth: number;
}
