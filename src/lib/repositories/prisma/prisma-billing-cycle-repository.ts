import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";
import type { BillingCycle } from "@/domain/schemas/billing-cycle";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  if (value === null || value === undefined) { return 0; }
  if (typeof value === "number" && !Number.isNaN(value)) { return value; }
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export class PrismaBillingCycleRepository implements IBillingCycleRepository {
  async findOrCreate(
    tenantId: string,
    year: number,
    month: number
  ): Promise<BillingCycle> {
    const result = await prisma.billing_cycle.upsert({
      where: { tenantId_year_month: { tenantId, year, month } },
      create: { tenantId, year, month },
      update: {},
    });
    return {
      id: result.id,
      tenantId: result.tenantId,
      year: result.year,
      month: result.month,
      createdAt: result.createdAt,
    };
  }

  async findWithPaymentSums(
    tenantId: string
  ): Promise<Array<{ id: string; year: number; month: number; totalPaid: number }>> {
    const cycles = await prisma.billing_cycle.findMany({
      where: { tenantId },
      include: { payment: true },
    });
    return cycles.map((c) => ({
      id: c.id,
      year: c.year,
      month: c.month,
      totalPaid: c.payment.reduce((sum, p) => sum + toNumber(p.amount), 0),
    }));
  }
}
