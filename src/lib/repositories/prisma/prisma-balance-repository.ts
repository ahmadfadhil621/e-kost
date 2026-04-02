import type { IBalanceRepository, BalanceRow } from "@/lib/balance-service";
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

export class PrismaBalanceRepository implements IBalanceRepository {
  async getBalanceRow(
    propertyId: string,
    tenantId: string
  ): Promise<BalanceRow | null> {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, propertyId, movedOutAt: null, roomId: { not: null } },
      include: { room: true, payments: true },
    });
    if (!tenant?.room) {
      return null;
    }
    const monthlyRent = toNumber(tenant.room.monthlyRent);
    const totalPayments = tenant.payments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0
    );
    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      roomNumber: tenant.room.roomNumber,
      monthlyRent,
      totalPayments,
    };
  }

  async getBalanceRows(
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<BalanceRow[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        propertyId,
        movedOutAt: null,
        roomId: { not: null },
      },
      include: { room: true, payments: true },
    });
    const rows: BalanceRow[] = tenants.map((t) => {
      const monthlyRent = t.room ? toNumber(t.room.monthlyRent) : 0;
      const totalPayments = t.payments.reduce(
        (sum, p) => sum + toNumber(p.amount),
        0
      );
      return {
        tenantId: t.id,
        tenantName: t.name,
        roomNumber: t.room?.roomNumber ?? "",
        monthlyRent,
        totalPayments,
      };
    });
    if (status === "unpaid") {
      return rows.filter((r) => r.monthlyRent - r.totalPayments > 0);
    }
    if (status === "paid") {
      return rows.filter((r) => r.monthlyRent - r.totalPayments <= 0);
    }
    return rows;
  }

  async getTenantInfo(
    propertyId: string,
    tenantId: string
  ): Promise<{ monthlyRent: number; movedInAt: Date } | null> {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, propertyId, movedOutAt: null, roomId: { not: null } },
      include: { room: true },
    });
    if (!tenant?.room) { return null; }
    return {
      monthlyRent: toNumber(tenant.room.monthlyRent),
      movedInAt: tenant.movedInAt,
    };
  }
}
