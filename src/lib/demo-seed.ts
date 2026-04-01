import { prisma } from "@/lib/prisma";
import type { ExpenseCategory } from "@/generated/prisma/enums";

function monthStart(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function paymentDate(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setDate(monthsBack === 0 ? 2 : 5);
  d.setHours(0, 0, 0, 0);
  return d;
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
    { roomNumber: "101", monthlyRent: 1200000, status: "OCCUPIED" as const },
    { roomNumber: "102", monthlyRent: 1200000, status: "OCCUPIED" as const },
    { roomNumber: "103", monthlyRent: 1500000, status: "OCCUPIED" as const },
    { roomNumber: "104", monthlyRent: 1500000, status: "AVAILABLE" as const },
    { roomNumber: "201", monthlyRent: 1800000, status: "OCCUPIED" as const },
    { roomNumber: "202", monthlyRent: 1800000, status: "AVAILABLE" as const },
  ];

  const rooms = await Promise.all(
    roomData.map((r) =>
      prisma.room.create({
        data: {
          propertyId: property.id,
          roomNumber: r.roomNumber,
          monthlyRent: r.monthlyRent,
          status: r.status,
        },
      })
    )
  );

  const roomMap = Object.fromEntries(rooms.map((r) => [r.roomNumber, r]));

  const tenantData = [
    { name: "Budi Santoso", roomNumber: "101", movedInMonthsAgo: 6, paidThisMonth: true },
    { name: "Siti Rahayu", roomNumber: "102", movedInMonthsAgo: 5, paidThisMonth: true },
    { name: "Ahmad Fauzi", roomNumber: "103", movedInMonthsAgo: 8, paidThisMonth: false },
    { name: "Dewi Lestari", roomNumber: "201", movedInMonthsAgo: 3, paidThisMonth: false },
  ];

  await Promise.all(
    tenantData.map(async ({ name, roomNumber, movedInMonthsAgo, paidThisMonth }) => {
      const room = roomMap[roomNumber];
      const tenant = await prisma.tenant.create({
        data: {
          propertyId: property.id,
          roomId: room.id,
          name,
          movedInAt: monthStart(movedInMonthsAgo),
        },
      });

      const paymentMonths = paidThisMonth ? [3, 2, 1, 0] : [3, 2, 1];
      await Promise.all(
        paymentMonths.map((monthsBack) =>
          prisma.payment.create({
            data: {
              tenantId: tenant.id,
              amount: room.monthlyRent,
              paymentDate: paymentDate(monthsBack),
            },
          })
        )
      );
    })
  );

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
