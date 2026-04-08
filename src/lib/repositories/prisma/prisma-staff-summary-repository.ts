import type { IStaffSummaryRepository } from "@/domain/interfaces/staff-summary-repository";
import type { StaffSummaryEntry } from "@/domain/schemas/staff-summary";
import { prisma } from "@/lib/prisma";

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {return 0;}
  if (typeof value === "number" && !Number.isNaN(value)) {return value;}
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

export class PrismaStaffSummaryRepository implements IStaffSummaryRepository {
  async getSummaryByPeriod(
    propertyId: string,
    year: number,
    month: number
  ): Promise<StaffSummaryEntry[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. Aggregate payments grouped by actorId
    const paymentRows = await prisma.payment.groupBy({
      by: ["actorId"],
      where: {
        tenant: { propertyId },
        paymentDate: { gte: start, lte: end },
        actorId: { not: null },
      },
      _sum: { amount: true },
    });

    // 2. Aggregate expenses grouped by actorId
    const expenseRows = await prisma.expense.groupBy({
      by: ["actorId"],
      where: {
        propertyId,
        date: { gte: start, lte: end },
        actorId: { not: null },
      },
      _sum: { amount: true },
    });

    // 3. Collect unique non-null actorIds
    const actorIdSet = new Set<string>();
    for (const row of paymentRows) {
      if (row.actorId) {actorIdSet.add(row.actorId);}
    }
    for (const row of expenseRows) {
      if (row.actorId) {actorIdSet.add(row.actorId);}
    }

    if (actorIdSet.size === 0) {return [];}

    const actorIds = Array.from(actorIdSet);

    // 4. Fetch user names
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true },
    });

    // 5. Fetch property to determine owner
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    // 6. Fetch staff membership for these actors
    const staffMemberships = await prisma.propertyStaff.findMany({
      where: { propertyId, userId: { in: actorIds } },
      select: { userId: true },
    });
    const staffUserIds = new Set(staffMemberships.map((m) => m.userId));

    // 7. Build lookup maps
    const paymentMap = new Map<string, number>();
    for (const row of paymentRows) {
      if (row.actorId) {paymentMap.set(row.actorId, toNumber(row._sum?.amount));}
    }
    const expenseMap = new Map<string, number>();
    for (const row of expenseRows) {
      if (row.actorId) {expenseMap.set(row.actorId, toNumber(row._sum?.amount));}
    }
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // 8. Merge into StaffSummaryEntry[]
    return actorIds.map((actorId) => {
      const isOwner = property?.ownerId === actorId;
      const actorRole = isOwner ? "owner" : staffUserIds.has(actorId) ? "staff" : "staff";
      return {
        actorId,
        actorName: userMap.get(actorId) ?? "Unknown",
        actorRole,
        totalPayments: paymentMap.get(actorId) ?? 0,
        totalExpenses: expenseMap.get(actorId) ?? 0,
      };
    });
  }
}
