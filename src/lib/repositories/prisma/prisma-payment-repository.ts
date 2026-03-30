import type { Payment, PaymentWithCount } from "@/domain/schemas/payment";
import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
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

function toPayment(p: {
  id: string;
  tenantId: string;
  amount: unknown;
  paymentDate: Date;
  createdAt: Date;
  tenant: { name: string };
}): Payment {
  return {
    id: p.id,
    tenantId: p.tenantId,
    tenantName: p.tenant.name,
    amount: toNumber(p.amount),
    paymentDate: p.paymentDate,
    createdAt: p.createdAt,
  };
}

export class PrismaPaymentRepository implements IPaymentRepository {
  async create(data: {
    tenantId: string;
    amount: number;
    paymentDate: Date;
  }): Promise<Payment> {
    const created = await prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        amount: data.amount,
        paymentDate: data.paymentDate,
      },
      include: { tenant: true },
    });
    return toPayment(created);
  }

  async findById(id: string): Promise<Payment | null> {
    const p = await prisma.payment.findUnique({
      where: { id },
      include: { tenant: true },
    });
    return p ? toPayment(p) : null;
  }

  async findByProperty(propertyId: string): Promise<Payment[]> {
    const list = await prisma.payment.findMany({
      where: { tenant: { propertyId } },
      include: { tenant: true },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    });
    return list.map(toPayment);
  }

  async findByTenant(tenantId: string): Promise<PaymentWithCount> {
    const list = await prisma.payment.findMany({
      where: { tenantId },
      include: { tenant: true },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    });
    return {
      payments: list.map(toPayment),
      count: list.length,
    };
  }

  async sumByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<number> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const result = await prisma.payment.aggregate({
      where: {
        tenant: { propertyId },
        paymentDate: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    return toNumber(result._sum?.amount);
  }

  async delete(id: string): Promise<void> {
    await prisma.payment.delete({ where: { id } });
  }

  async findRecentByProperty(
    propertyId: string,
    limit: number
  ): Promise<Array<{ id: string; tenantName: string; amount: number; paymentDate: Date }>> {
    const list = await prisma.payment.findMany({
      where: { tenant: { propertyId } },
      include: { tenant: true },
      orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return list.map((p) => ({
      id: p.id,
      tenantName: p.tenant.name,
      amount: toNumber(p.amount),
      paymentDate: p.paymentDate,
    }));
  }
}
