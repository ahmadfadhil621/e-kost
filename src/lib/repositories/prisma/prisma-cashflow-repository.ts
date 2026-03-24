import type { ICashflowRepository } from "@/domain/interfaces/cashflow-repository";
import type { CashflowEntry } from "@/domain/schemas/cashflow";
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

export class PrismaCashflowRepository implements ICashflowRepository {
  async findByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: {
          tenant: { propertyId },
          paymentDate: { gte: start, lte: end },
        },
        include: { tenant: true },
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.expense.findMany({
        where: {
          propertyId,
          date: { gte: start, lte: end },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    type RawEntry = CashflowEntry & { _sortKey: string };

    const incomeEntries: RawEntry[] = payments.map((p) => ({
      id: p.id,
      date: p.paymentDate.toISOString().slice(0, 10),
      type: "income" as const,
      description: p.tenant.name,
      amount: toNumber(p.amount),
      _sortKey: `${p.paymentDate.toISOString()}|${p.createdAt.toISOString()}`,
    }));

    const expenseEntries: RawEntry[] = expenses.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      type: "expense" as const,
      description: e.category.toLowerCase(),
      amount: toNumber(e.amount),
      _sortKey: `${e.date.toISOString()}|${e.createdAt.toISOString()}`,
    }));

    const merged = [...incomeEntries, ...expenseEntries].sort((a, b) =>
      b._sortKey.localeCompare(a._sortKey)
    );

    return merged.map(({ _sortKey: _sk, ...entry }) => entry);
  }
}
