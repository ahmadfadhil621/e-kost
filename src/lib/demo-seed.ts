import { prisma } from "@/lib/prisma";
import type { ExpenseCategory } from "@/generated/prisma/enums";

function monthStart(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function paymentDate(monthsBack: number, day = 5): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function yearMonth(monthsBack: number): { year: number; month: number } {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

async function recordPayment(
  tenantId: string,
  amount: number,
  monthsBack: number,
  day = 5
) {
  const { year, month } = yearMonth(monthsBack);
  const cycle = await prisma.billing_cycle.upsert({
    where: { tenantId_year_month: { tenantId, year, month } },
    create: { tenantId, year, month },
    update: {},
  });
  await prisma.payment.create({
    data: {
      tenantId,
      amount,
      paymentDate: paymentDate(monthsBack, day),
      billingCycleId: cycle.id,
    },
  });
}

export async function seedDemoData(ownerId: string): Promise<void> {
  const property = await prisma.property.create({
    data: {
      name: "Demo Kost Merdeka",
      address: "Jl. Merdeka No. 17, Jakarta",
      ownerId,
    },
  });

  const roomData = [
    { roomNumber: "101", monthlyRent: 1200000, status: "OCCUPIED" as const, capacity: 1 },
    { roomNumber: "102", monthlyRent: 1200000, status: "OCCUPIED" as const, capacity: 1 },
    { roomNumber: "103", monthlyRent: 1500000, status: "OCCUPIED" as const, capacity: 1 },
    { roomNumber: "104", monthlyRent: 1500000, status: "AVAILABLE" as const, capacity: 1 },
    { roomNumber: "201", monthlyRent: 1800000, status: "OCCUPIED" as const, capacity: 1 },
    { roomNumber: "202", monthlyRent: 1800000, status: "AVAILABLE" as const, capacity: 1 },
    // Shared room — capacity 2, both beds occupied
    { roomNumber: "203", monthlyRent: 900000, status: "OCCUPIED" as const, capacity: 2 },
  ];

  const rooms = await Promise.all(
    roomData.map((r) =>
      prisma.room.create({
        data: {
          propertyId: property.id,
          roomNumber: r.roomNumber,
          monthlyRent: r.monthlyRent,
          status: r.status,
          capacity: r.capacity,
        },
      })
    )
  );

  const roomMap = Object.fromEntries(rooms.map((r) => [r.roomNumber, r]));

  // Scenario 1 — Budi Santoso: fully paid up (all cycles paid)
  const budi = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["101"].id,
      name: "Budi Santoso",
      movedInAt: monthStart(4),
    },
  });
  for (const m of [4, 3, 2, 1, 0]) {
    await recordPayment(budi.id, 1200000, m);
  }

  // Scenario 2 — Siti Rahayu: 2 consecutive unpaid months (current + prev)
  const siti = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["102"].id,
      name: "Siti Rahayu",
      movedInAt: monthStart(4),
    },
  });
  // Paid months 4 and 3 months ago, NOT the last 2
  for (const m of [4, 3]) {
    await recordPayment(siti.id, 1200000, m);
  }

  // Scenario 3 — Ahmad Fauzi: partial payment on most recent month
  const ahmad = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["103"].id,
      name: "Ahmad Fauzi",
      movedInAt: monthStart(3),
    },
  });
  await recordPayment(ahmad.id, 1500000, 3); // paid in full
  await recordPayment(ahmad.id, 1500000, 2); // paid in full
  await recordPayment(ahmad.id, 750000, 1);  // partial for last month
  // current month = unpaid

  // Scenario 4 — Dewi Lestari: skipped month 2 (paid 1st and 3rd, not 2nd)
  const dewi = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["201"].id,
      name: "Dewi Lestari",
      movedInAt: monthStart(3),
    },
  });
  await recordPayment(dewi.id, 1800000, 3); // oldest: paid
  // monthsBack=2 is intentionally skipped
  await recordPayment(dewi.id, 1800000, 1); // paid — but skipped m=2

  // Scenario 5 — Shared room 203: Rudi (paid up) + Nisa (2 months unpaid)
  const rudi = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["203"].id,
      name: "Rudi Hartono",
      movedInAt: monthStart(3),
    },
  });
  for (const m of [3, 2, 1, 0]) {
    await recordPayment(rudi.id, 900000, m);
  }

  const nisa = await prisma.tenant.create({
    data: {
      propertyId: property.id,
      roomId: roomMap["203"].id,
      name: "Nisa Aulia",
      movedInAt: monthStart(3),
    },
  });
  // Paid only 3 and 2 months ago — last 2 months unpaid
  for (const m of [3, 2]) {
    await recordPayment(nisa.id, 900000, m);
  }

  const expenseData: { monthsBack: number; category: ExpenseCategory; amount: number }[] = [
    { monthsBack: 0, category: "ELECTRICITY", amount: 450000 },
    { monthsBack: 0, category: "WATER", amount: 120000 },
    { monthsBack: 1, category: "ELECTRICITY", amount: 430000 },
    { monthsBack: 1, category: "WATER", amount: 115000 },
    { monthsBack: 1, category: "MAINTENANCE", amount: 200000 },
    { monthsBack: 2, category: "ELECTRICITY", amount: 460000 },
    { monthsBack: 2, category: "WATER", amount: 110000 },
    { monthsBack: 3, category: "ELECTRICITY", amount: 420000 },
    { monthsBack: 3, category: "MAINTENANCE", amount: 350000 },
  ];

  await Promise.all(
    expenseData.map(({ monthsBack, category, amount }) =>
      prisma.expense.create({
        data: {
          propertyId: property.id,
          category,
          amount,
          date: monthStart(monthsBack),
        },
      })
    )
  );
}
