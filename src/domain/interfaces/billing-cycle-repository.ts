import type { BillingCycle } from "@/domain/schemas/billing-cycle";

export interface IBillingCycleRepository {
  findOrCreate(tenantId: string, year: number, month: number): Promise<BillingCycle>;
  findWithPaymentSums(tenantId: string): Promise<
    Array<{
      id: string;
      year: number;
      month: number;
      totalPaid: number;
    }>
  >;
}
